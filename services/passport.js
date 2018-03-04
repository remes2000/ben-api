const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const FacebookStrategy = require('passport-facebook').Strategy
const LocalStrategy = require('passport-local').Strategy
const mongoose = require('mongoose')
const keys = require('../config/keys')
const bcrypt = require('bcrypt')

const User = mongoose.model('users')

passport.serializeUser((user, done) => {
    done(null, user.id)
  });
  
passport.deserializeUser((id, done) => {
    User.findById(id).then(user => {
      done(null, user)
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
            const existingUser = await User.findOne({ googleId: profile.id })

            if( existingUser )
                return done(null, existingUser)

            const user = await new User({ googleId: profile.id, username: profile.displayName}).save()
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

        const existingUser = await User.findOne({ facebookId: profile.id})

        if(existingUser)
            return done(null, existingUser)

        const user = await new User({ facebookId: profile.id, username: profile.displayName}).save()
        done(null, user)
    }
))

passport.use('local-signup', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    },
    async (req, email, password, done) => {

        const userWithSameEmail = await User.findOne({ email })
        
        if( userWithSameEmail )
            return done(null, false, { message: 'Invalid email'} )

        const newUser = await new User({ email, username: req.body.username, password: bcrypt.hashSync(password, 10)}).save()
        done(null, newUser)
    }
))

passport.use('local-login', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    },
    async (req, email, password, done) => {

        const existingUser = await User.findOne({ email })

        if(existingUser && bcrypt.compareSync(password, existingUser.password))
            return done(null, existingUser)

        done(null, false, { message: 'Email or password are incorrect' })
    }
))