require('dotenv').config();
const axios = require("axios");
const mongoose = require("mongoose")
const { TVsSchema_id, CardsSchema, TVsErrorSchema  } = require('./models/Card_Model');
const https = require('https');
const http = require('http');
const uniqueSlug = require('unique-slug')
const { getPlaiceholder } = require('plaiceholder')


const base_url = process.env.BASE_URL;
const img_base_url = process.env.IMG_BASE_URL
const api_key = process.env.API_KEY;
const DB_ID = process.env.DB_ID;
const DB_FULL = process.env.DB_FULL

const ID_DB = mongoose.createConnection(DB_ID, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
    // keepAlive: true,
    // keepAliveInitialDelay: 300000
});

const FULL_DB = mongoose.createConnection(DB_FULL, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
    // connectTimeoutMS: 1200000,
    // socketTimeoutMS: 1200000,
    // serverSelectionTimeoutMS: 1200000,
    // keepAlive: true,
    // keepAliveInitialDelay: 30000,
    maxPoolSize: 200
});

const instance = axios.create({
    baseURL: base_url,
    validateStatus: function (status) {
        return status = 404 || status == 301;
    },
    httpsAgent: new https.Agent({ keepAlive: true }),
    httpAgent: new http.Agent({ keepAlive: true })
});


ID_DB.on("error", console.error.bind(console, "ID_DB connection error:"));
ID_DB.on("connected",() => console.log("SUCCESSFULLY CONNECTED FROM ID_DB"));
ID_DB.on("close",() => console.log("SUCCESSFULLY DISCONNECTED FROM ID_DB"));

FULL_DB.on("error", console.error.bind(console, "DB_FULL connection error:"));
FULL_DB.on("connected",() => console.log("SUCCESSFULLY CONNECTED FROM DB_FULL"));
FULL_DB.on("close",() => console.log("SUCCESSFULLY DISCONNECTED FROM DB_FULL"));

const TV_ID = ID_DB.model("Tvshow", TVsSchema_id);
const CARD = FULL_DB.model("Card", CardsSchema);
const TV_With_Error = FULL_DB.model("TV_Error", TVsErrorSchema);


async function CleanCredits(cred) {
    const result_cast = Object.values(
        cred.cast.slice(0, 8)
            .reduce((acc, person) => {
                acc[person.order] = {
                    id: person.id, name: person.name, original_name: person.original_name, character: person.character, popularity: person.popularity, order: person.order
                }
                return acc
            }, {})
    )
    const result_crew = Object.values(
        cred.crew
            .filter((person) => person.job === 'Producer' || person.job === 'Director' || person.job === 'Story' || person.job === 'Writer' || person.job === 'Screenplay' || person.job === 'Executive Producer' || person.job === 'Book' || person.job === 'Original Music Composer')
            .reduce((acc, person) => {
                if (acc[person.id]) {
                    acc[person.id].jobs.push(person.job);
                } else {
                    acc[person.id] = { id: person.id, name: person.name, original_name: person.original_name, jobs: [person.job], popularity: person.popularity };
                }
                return acc;
            }, {})
    ).sort((a, b) => b.popularity - a.popularity).slice(0, 8);
    return {
        cast: result_cast,
        crew: result_crew
    }
}

async function blurdata(poster_path) {
    let blurhash
    if (poster_path != null) {
        try {
            const placeholder = await getPlaiceholder(`${img_base_url}w500${poster_path}`)
            blurhash = `${placeholder.blurhash.hash}`
        }
        catch (err) {
            const placeholder = await getPlaiceholder(`https://i.imgur.com/Mch5TSH.png`)
            blurhash = `${placeholder.blurhash.hash}`
        }
    }
    else {
        const placeholder = await getPlaiceholder(`https://i.imgur.com/Mch5TSH.png`)
        blurhash = `${placeholder.blurhash.hash}`
    }
    return blurhash
}

async function fetch () {
    try {
        const array = await TV_ID.find({})
        return array
    } finally {
        ID_DB.close()
    }
}

async function chunkify(a, n, balanced) {
    
    if (n < 2)
        return [a];

    var len = a.length,
            out = [],
            i = 0,
            size;

    if (len % n === 0) {
        size = Math.floor(len / n);
        while (i < len) {
            out.push(a.slice(i, i += size));
        }
    }

    else if (balanced) {
        while (i < len) {
            size = Math.ceil((len - i) / n--);
            out.push(a.slice(i, i += size));
        }
    }

    else {

        n--;
        size = Math.floor(len / n);
        if (len % size === 0)
            size--;
        while (i < size * n) {
            out.push(a.slice(i, i += size));
        }
        out.push(a.slice(size * n));

    }

    return out;
};

// const delay = async (ms = 6000) =>
//   new Promise(resolve => setTimeout(resolve, ms))

async function database (chunks) {
    for (let i = 0; i < chunks.length; i += 1) {
        const promises = await (chunks[i]|| []).map(async card => {
            const req = await instance.get(`tv/${card.tmdb_id}?api_key=${api_key}&append_to_response=keywords,credits`)
            const res = req.data
            if ( res.status_message != 'The resource you requested could not be found.') {
                const credits = await CleanCredits(res.credits)
                const runtime = res.episode_run_time[0];
                const keywords = {
                    keywords: await res.keywords.results
                };
                const cardSlug = uniqueSlug(`${card.stream_id}`).toUpperCase()
                const blurhash = await blurdata(res.poster_path)
                const document = {
                    slug: cardSlug,
                    blurhash: blurhash,
                    tmdb_id: res.id,
                    stream_id: card.stream_id,
                    media_type: 'tv',
                    backdrop_path: res.backdrop_path,
                    poster_path: res.poster_path,
                    original_title: res.original_name,
                    title: res.name,
                    tagline: res.tagline,
                    overview: res.overview,
                    release_date: res.first_air_date,
                    runtime: runtime,
                    production_companies: res.production_companies,
                    production_countries: res.production_countries,
                    networks: res.networks,
                    genres: res.genres,
                    keywords: keywords,
                    popularity: res.popularity,
                    vote_average: res.vote_average,
                    vote_count: res.vote_count,
                    credits: credits
                }
                // execute find query
                const query = { stream_id: card.stream_id };
                const update = { $set: document };
                const options = { upsert: true };
                await CARD.updateOne(query, update, options);
            } else {
                const doc = {
                    tmdb_id: card.tmdb_id,
                    stream_id: card.stream_id
                }
                const check = await CARD.findOne({ stream_id: card.stream_id });
                const check_error = await TV_With_Error.findOne({ stream_id: card.stream_id });
                if (!check && !check_error) {
                    const newError = new TV_With_Error(doc);
                    return newError.save()
                }
            }
        })
        await Promise.all(promises);
        // await delay(6000)
    }
}

async function main () {
    try {
        console.time("Time");
        const array = await fetch();
        const chunks = await chunkify(array, 25, true)
        await database(chunks);
        console.timeEnd("Time");
    } finally {
        FULL_DB.close();
    }
}

main()

  
