const mongoose = require('mongoose')
const Achievement = mongoose.model('achievements')
const User = mongoose.model('users')

module.exports =  async userId => {
    const achievements = await Achievement.find({})
    const user = await User.findById(userId)
    
    const unlockedAchievements = achievements.filter( achievement => !user.achievements.includes(achievement._id) )

    unlockedAchievements.forEach( achievement => {
        if(isAchivementCompleted(achievement, user)){
            user.achievements.push(achievement._id)
        }
    })

    user.save()
}

function isAchivementCompleted(achievement, user){
    const restrictedField = user[achievement.restrictionField]
    const value = achievement.than

    switch(achievement.operation){
        case 'equal':
            return restrictedField === value
        case 'more':
            return restrictedField > value
        case 'less':
            return restrictedField < value
        case 'moreOrEqual':
            return restrictedField >= value
        case 'lessOrEqual':
            return restrictedField <= value
    }
}