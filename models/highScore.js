const mongoose = require('mongoose')
const { Schema } = mongoose

const highScoreSchema = Schema({
    difficultyLevel: { type: String, required: true },
    score: { type: Number, require: true},
    userId: { type: String, require: true},
    username: { type: String, require: true}
})

mongoose.model('highscores', highScoreSchema)