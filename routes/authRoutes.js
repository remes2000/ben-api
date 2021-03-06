const passport = require('passport')
const mongoose = require('mongoose')
const User = mongoose.model('users')
const keys = require('../config/keys')

module.exports = app => {

    app.get(
        '/auth/google',
        passport.authenticate('google', {
            scope: ['profile', 'email']
        })
    )

    app.get('/auth/google/callback', passport.authenticate('google'), (req, res) => {
        res.redirect(keys.clientAppUrl)
    })

    app.get('/auth/facebook', passport.authenticate('facebook'))

    app.get('/auth/facebook/callback', passport.authenticate('facebook'), (req, res) => {
        res.redirect(keys.clientAppUrl)
    })

    app.post('/register', (req, res, next) => {

        passport.authenticate('local-signup', (err, user, info) => {

            if(err) return next(err)

            if(info) return res.status(400).send(info)
            
            req.logIn(user, function(err) {
                if (err) return next(err)
                return res.send( user )
            })

        })(req, res, next)

    })

    app.post('/auth/local', (req, res, next) => {

        passport.authenticate('local-login', (err, user, info) => {

            if(err) return next(err)

            if(info) return res.status(400).send(info)

            req.logIn(user, function(err) {
                if (err) return next(err)
                return res.send( user )
            })

        })(req, res, next)

    })

    app.get('/logout', (req, res) => {
        req.logout()
        res.redirect(keys.clientAppUrl)
    })
    
    app.get('/current_user', (req, res) => {
        if(req.user){
            res.send(req.user)
        }
        else 
            res.send({})
    })

}