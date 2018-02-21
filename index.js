const express = require('express')
const mongoose = require('mongoose')
const passport = require('passport')
const bodyParser = require('body-parser')
const cookieSession = require('cookie-session')
const cors = require('cors')

const keys = require('./config/keys')

mongoose.connect(keys.mongoURI)
require('./models/user')

const app = express()

app.use(cors({credentials: true, origin: true}))
app.use(bodyParser.json())
app.use(
  cookieSession({
    name: 'benGame',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    keys: [keys.cookieKey]
  })
)
app.use(passport.initialize())
app.use(passport.session()) 

require('./services/passport')
require('./routes/authRoutes')(app)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log("server started")
})