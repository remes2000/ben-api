const mongoose = require('mongoose')
const { Schema } = mongoose

const userSchema = Schema({
    local: {
        email: String,
        username: String,
        password: String
    },
    facebook: {
        id: String,
        username: String
    },
    google: {
        id: String,
        username: String
    }
})

mongoose.model('users', userSchema)