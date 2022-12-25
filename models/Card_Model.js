const mongoose = require("mongoose");
const { string } = require("sharp/lib/is");

const MoviesSchema_id = new mongoose.Schema({
    tmdb_id: String,
    stream_id: { type: String, index: true }
},
    {
        versionKey: false
    }
)

const TVsSchema_id = new mongoose.Schema({
    tmdb_id: String,
    stream_id: { type: String, index: true }
},
    {
        versionKey: false
    }
)

const CardsSchema = new mongoose.Schema({
    slug: { type: String, index: true },
    tmdb_id: { type: Number },
    stream_id: { type: String, index: true },
    media_type: { type: String, index: true },
    backdrop_path: { type: String },
    poster_path: { type: String },
    original_title: { type: String, sparse: true },
    blurhash: { type: String },
    title: { type: String, index: true },
    tagline: { type: String, sparse: true },
    overview: { type: String, sparse: true },
    release_date: { type: String },
    runtime: { type: Number },
    belongs_to_collection: {
        id: { type: Number },
        name: { type: String },
        poster_path: { type: String },
        backdrop_path: { type: String }
    },
    production_companies: [
        {
            id: { type: Number },
            logo_path: { type: String },
            name: { type: String },
            origin_country: { type: String }
        }
    ],
    production_countries: [
        { iso_3166_1: { type: String }, name: { type: String } }
    ],
    genres: [
        { id: { type: Number }, name: { type: String } }
    ],
    keywords: {
        keywords: [
            { id: { type: Number }, name: { type: String } }
        ]
    },
    popularity: { type: Number },
    vote_average: { type: Number },
    vote_count: { type: Number },
    networks: [
        {
            "id": { type: Number, index: true },
            "name": { type: String },
            "logo_path": { type: String },
            "origin_country": { type: String },
        }
    ],
    credits: {
        cast: [
            {
                id: { type: Number },
                name: { type: String },
                original_name: { type: String },
                character: { type: String },
                popularity: { type: Number },
                order: { type: Number }
            }
        ],
        crew: [
            {
                id: { type: Number },
                name: { type: String },
                original_name: { type: String },
                jobs: [{ type: String }],
                popularity: { type: Number }
            }
        ]
    }
},
    {
        versionKey: false,
        timestamps: true
    }
)

const MoviesErrorSchema = new mongoose.Schema({
    tmdb_id: { type: String },
    stream_id: { type: String, index: true }
},
    {
        versionKey: false
    }
)

const TVsErrorSchema = new mongoose.Schema({
    tmdb_id: { type: String },
    stream_id: { type: String, index: true }
},
    {
        versionKey: false
    }
)

module.exports = { MoviesSchema_id, TVsSchema_id, CardsSchema, MoviesErrorSchema, TVsErrorSchema }