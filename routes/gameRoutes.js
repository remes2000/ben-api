const requireLogin = require('../middlewares/requireLogin')
const mongoose = require('mongoose')
const User = mongoose.model('users')
const HighScore = mongoose.model('highscores')

module.exports = app => {

    app.post('/game/add_new_highscore', requireLogin, async (req, res) => {

        req.user.points += req.body.points
        req.user.numberOfGames++

        const user = await req.user.save()

        const newHighScore = new HighScore({
            difficultyLevel: req.body.difficultyLevel,
            score: req.body.points,
            userId: user._id,
            username: user.username
        })
        await newHighScore.save()

        res.send(user)
    })

    app.post('/game/add_points', requireLogin, async (req, res) => {

        console.log(req.body)

        req.user.points += req.body.points
        req.user.numberOfGames++

        const user = await req.user.save()

        res.send(user)
    })

}