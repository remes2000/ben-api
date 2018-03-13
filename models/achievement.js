const mongoose = require('mongoose')
const { Schema } = mongoose

const achievementSchema = Schema({
    restrictionField: { require: true, type: String }, 
    operation: { require: true, type: String },
    than: { require: true, type: Number }
})

mongoose.model('achievements', achievementSchema)