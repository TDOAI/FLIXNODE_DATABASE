require('dotenv').config();
const { getPlaiceholder } = require('plaiceholder')
const mongoose = require("mongoose");
const { CardsSchema } = require('./models/Card_Model');

const DB_FULL = process.env.DB_FULL
const img_base_url = process.env.IMG_BASE_URL

const FULL_DB = mongoose.createConnection(DB_FULL, {
    maxPoolSize: 100
});

FULL_DB.on("error", console.error.bind(console, "DB_FULL connection error:"));
FULL_DB.on("connected",() => console.log("SUCCESSFULLY CONNECTED FROM DB_FULL"));
FULL_DB.on("close",() => console.log("SUCCESSFULLY DISCONNECTED FROM DB_FULL"));

const CARD = FULL_DB.model("Card", CardsSchema);

const arg = process.argv.slice(2)[0]
const section = parseInt(process.argv.slice(2)[1])

const delay = async (ms = 6000) =>
  new Promise(resolve => setTimeout(resolve, ms))

async function main() {
    try {
        let type
        if (arg === 'movie') {
            type = { media_type: 'movie' }
        }
        else {
            type = { media_type: 'tv' }
        }
        const count = await CARD.where(type).countDocuments()
        const limit = Math.ceil(count/10)
        const skip = limit*(section-1)
        await CARD.
            find({}).
            where(type).
            skip(skip).
            limit(limit).
            cursor().
            eachAsync(async function (doc, i) {
                if (doc.poster_path != null) {
                    const placeholder = await getPlaiceholder(`${img_base_url}w500${doc.poster_path}`)
                    await CARD.updateOne({ stream_id: doc.stream_id }, { blurhash: `${placeholder.blurhash.hash}` });
                    // console.log(`${i}-----${doc.stream_id}`)
                }
                else {
                    const blurhash = 'T3FVnJjI0njufQfQ0Ck9~3jufQfQ'
                    await CARD.updateOne({ stream_id: doc.stream_id }, { blurhash: blurhash });
                }
            }, { parallel: 10 })
    }
    catch (err) {
       console.log(err)
    }
}

// main()
//     .finally(async() => await FULL_DB.close())

async function test () {
    const skip = 897
    for (i=1; i<=90 ; i++) {
        const batch = skip+((i-1)*10)
        await CARD.
        find({}).
            where(type).
            skip(skip+batch).
            limit(10).
            cursor().
            eachAsync(async function (doc, i) {
                if (doc.poster_path != null) {
                    const placeholder = await getPlaiceholder(`${img_base_url}w500${doc.poster_path}`)
                    await CARD.updateOne({ stream_id: doc.stream_id }, { blurhash: `${placeholder.blurhash.hash}` });
                    // console.log(`${i}-----${doc.stream_id}`)
                }
                else {
                    const blurhash = 'T3FVnJjI0njufQfQ0Ck9~3jufQfQ'
                    await CARD.updateOne({ stream_id: doc.stream_id }, { blurhash: blurhash });
                }
            }, { parallel: 10 })
            console.log(skip+batch)
    }
}

test()



