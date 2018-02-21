const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const FacebookStrategy = require('passport-facebook').Strategy
const LocalStrategy = require('passport-local').Strategy
const mongoose = require('mongoose')
const keys = require('../config/keys')
const bcrypt = require('bcrypt')

const User = mongoose.model('users')

passport.serializeUser((user, done) => {
    console.log(user.id)
    done(null, user.id)
  });
  
passport.deserializeUser((id, done) => {
    User.findById(id).then(user => {
      done(null, user)
      console.log(user)
    })
})

passport.use(
    new GoogleStrategy(
        {
            clientID: keys.googleClientId,
            clientSecret: keys.googleClientSecret,
            callbackURL: '/auth/google/callback'
        },
        async ( accessToken, refreshToken, profile, done ) => {
            const existingUser = await User.findOne({ 'google.id': profile.id })

            if( existingUser )
                return done(null, existingUser)

            const user = await new User({ 'google.id': profile.id, 'google.username': profile.displayName}).save()
            done(null, user)
        }
    )
)

passport.use(
    new FacebookStrategy({
        clientID: keys.facebookAppId,
        clientSecret: keys.facebookAppSecret,
        callbackURL: "/auth/facebook/callback"
    },
    async (accessToken, refreshToken, profile, done) => {

        const existingUser = await User.findOne({ 'facebook.id': profile.id})

        if(existingUser)
            return done(null, existingUser)

        const user = await new User({ 'facebook.id': profile.id, 'facebook.username': profile.displayName}).save()
        done(null, user)
    }
))

passport.use('local-signup', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    },
    async (req, email, password, done) => {

        const userWithSameEmail = await User.findOne({ 'local.email': email})
        const userWithSameUsername = await User.findOne({ 'local.username': req.body.username})
        
        if( userWithSameEmail )
            return done(null, false, { message: 'Invalid email'} )
        else if( userWithSameUsername )
            return done(null, false, { message: 'Invalid username'} )

        const newUser = await new User({'local.email': email, 'local.username': req.body.username, 'local.password': bcrypt.hashSync(password, 10)}).save()
        done(null, newUser)
    }
))

passport.use('local-login', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    },
    async (req, email, password, done) => {

        const existingUser = await User.findOne({'local.email': email})

        if(existingUser && bcrypt.compareSync(password, existingUser.local.password))
            return done(null, existingUser)

        done(null, false, { message: 'Email or password are incorrect' })
    }
))