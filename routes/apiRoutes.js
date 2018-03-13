const requireLogin = require('../middlewares/requireLogin')
const mongoose = require('mongoose')
const User = mongoose.model('users')
const Achievement = mongoose.model('achievements')
const Highscore = mongoose.model('highscores')
const _ = require('lodash')

module.exports = app => {

    app.get('/api/best_players', async (req, res) => {
        
        const users = await User.find({}, ['username', 'points', 'numberOfGames'], { sort: { points: -1 } } )
        res.send(users)

    })

    app.get('/api/highscores', async (req, res) => {

        const highscores = await Highscore.find({ difficultyLevel: req.query.difficultyLevel }, [], { sort : { score: -1 } })
        res.send(highscores)

    })

    app.get('/api/get_user_by_id', async (req, res) => {

        const user = await User.findById( req.query.userId, ['username', 'points', 'numberOfGames', 'numberOfDuels', 'wonDuels', 'achievements'] )

        const highscores = await Highscore.find({ userId: req.query.userId}, [], { sort: { score: -1 } } )

        res.send(Object.assign( { highscores }, user.toJSON() ))
    })

    app.get('/api/get_achievements', async (req, res) => {
        const achievements = await Achievement.find({})
        res.send(achievements)
    })
}