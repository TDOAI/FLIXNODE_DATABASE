require('dotenv').config();
const fetch = (...args) =>
	import('node-fetch').then(({default: fetch}) => fetch(...args));
const mongoose = require("mongoose");
const { encode } = require('blurhash')
const sharp = require('sharp')
const { CardsSchema } = require('./models/Card_Model');

const DB_FULL = process.env.DB_FULL
const img_base_url = process.env.IMG_BASE_URL

const FULL_DB = mongoose.createConnection(DB_FULL, {
    maxPoolSize: 200
});

FULL_DB.on("error", console.error.bind(console, "DB_FULL connection error:"));
FULL_DB.on("connected",() => console.log("SUCCESSFULLY CONNECTED FROM DB_FULL"));
FULL_DB.on("close",() => console.log("SUCCESSFULLY DISCONNECTED FROM DB_FULL"));

const CARD = FULL_DB.model("Card", CardsSchema);

const arg = process.argv.slice(2)[0]

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
        const limit = Math.ceil(count/25)
        for (let i = 1; i<=25 ; i++) {
            const skip = limit*(i-1)
            await CARD.
                find({}).
                where(type).
                skip(skip).
                limit(limit).
                cursor().
                eachAsync(async function (doc, i) {
                    if (doc.poster_path || doc.backdrop_path !== null) {
                        const response = await fetch(`${img_base_url}w500${doc.poster_path || doc.backdrop_path}`);
                        const arrayBuffer = await response.arrayBuffer();
                        const returnedBuffer = Buffer.from(arrayBuffer);

                        const { data, info } = await sharp(returnedBuffer)
                            .ensureAlpha()
                            .raw()
                            .toBuffer({
                                resolveWithObject: true,
                            });
                        const encoded = encode(
                            new Uint8ClampedArray(data),
                            info.width,
                            info.height,
                            3,
                            4
                        );
                        await CARD.updateOne({ stream_id: doc.stream_id }, { blurhash: `${encoded}` });
                        console.log(encoded)
                    }
                    else {
                        const blurhash = 'T3FVnJjI0njufQfQ0Ck9~3jufQfQ'
                        await CARD.updateOne({ stream_id: doc.stream_id }, { blurhash: blurhash });
                    }
                }, { parallel: limit/2 })
        }
    }
    catch (err) {
       console.log(err)
    }
}

main()
    .finally(async() => await FULL_DB.close())
