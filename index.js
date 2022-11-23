require('dotenv').config();
const axios = require("axios");
const { MongoClient } = require("mongodb");
const { getPlaiceholder } = require('plaiceholder');


const base_url = process.env.BASE_URL;
const img_base_url = process.env.IMG_BASE_URL
const api_key = process.env.API_KEY;
const DB_URL = process.env.DB_URL;

const argument = process.argv.slice(2)
console.log(argument)



const client = new MongoClient(DB_URL,
    {
        compressors: ["snappy"]
    });

async function dispatch () {
    const portion = (parseInt(argument[0])-1)*1000
    console.log(portion)
    return portion
}

async function run (sec) {
    try {
        const database = client.db('MEDIA_ID_MAP')
        const cus = await database.collection('movies').find({}).skip(sec).limit(1).toArray();
        // console.log(cus)
        console.log("OK RETRIEVE")
        return cus
    } finally {
        
    }
}


async function append_db (array) {
    try {
        // specify the DB's name
        const db = client.db('flixnode');
        const promises = await (array|| []).map(async card => {
            const req = await axios.get(`${base_url}movie/${card.tmdb_id}?api_key=${api_key}&append_to_response=keywords`, {validateStatus: function (status) {
                return status = 404 || status == 301;
            }})
            const res = req.data
            const document = { 
                id: res.id,
                stream_id: card.stream_id,
                media_type: 'movie',
                backdrop_path: res.backdrop_path,
                poster_path: res.poster_path,
                genres: res.genres,
                original_title: res.original_title,
                title: res.title,
                tagline: res.tagline,
                overview: res.overview,
                keywords: res.keywords,
                popularity: res.popularity,
                vote_average: res.vote_average,
                vote_count: res.vote_count
            }
            if ( res.status_message != 'The resource you requested could not be found.') {
            // execute find query
            const query = { id: res.id };
            const update = { $set: document };
            const options = { upsert: true };
            await db.collection('movies').updateOne(query, update, options);
            console.log(document)
            } else {
                const check = await db.collection('movies').findOne({ id: res.id });
                const check_error = await db.collection('error_movies').findOne({ id: res.id });
                if (!check && !check_error) {
                    const items = await  db.collection('error_movies').insertOne(card)
                }
            }
        })
        await Promise.all(promises);
        console.log("OK DONE")
    } finally {
        
    }
}

async function main () {
    try {
        console.time("Time");
        const sec = await dispatch()
        const array = await run(sec);
        await append_db(array);
        console.timeEnd("Time");
        process.exit(0)
    } finally {
        
    }
}

main()
