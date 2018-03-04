const mongoose = require('mongoose')
const { Schema } = mongoose

const userSchema = Schema({

    googleId: String, //just for google accounts
    facebookId: String, // just for facebook accounts

    email: String, // just for local accounts
    password: String, // just for local accounts

    username: { type: String, required: true },
    points: { type: Number, default: 0 },
    numberOfGames: { type: Number, default: 0},
    numberOfDuels: { type: Number, default: 0},
    wonDuels: { type: Number, default: 0}

})

mongoose.model('users', userSchema)