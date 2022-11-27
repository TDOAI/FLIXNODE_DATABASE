const mongoose = require("mongoose");

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
    tmdb_id: { type: Number },
    stream_id: { type: String, index: true },
    updated: { type: Date, default: Date.now },
    media_type: { type: String, index: true },
    backdrop_path: { type: String },
    poster_path: { type: String },
    original_title: { type: String, sparse:true },
    blurhash: { type: String },
    title: { type: String, index:true },
    tagline: { type: String, sparse:true },
    overview: { type: String, sparse:true },
    release_date: { type: String },
    runtime: { type: Number },
    belongs_to_collection: { 
        id: { type: Number },
        name: { type: String },
        poster_path: { type: String },
        backdrop_path: { type: String }
    },
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
    vote_count: { type: Number }
},
{
    versionKey: false
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

module.exports = { MoviesSchema_id, TVsSchema_id, CardsSchema, MoviesErrorSchema, TVsErrorSchema  }