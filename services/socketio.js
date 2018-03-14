const mongoose = require('mongoose')
const User = mongoose.model('users')
const checkForAchievements = require('./checkForAchievements')

module.exports = ( server, sessionMiddleware ) => {

    const io = require('socket.io')(server)

    io.use( (socket, next) => {
        sessionMiddleware(socket.request, {}, next)
    })

    const rooms = []
    const roomSockets = []
    let id = 0

    const listOfDuelRoomsRecipients = []

    io.on('connection', async client => {

        const user = await deserializeUser(client.request.session.passport.user)

        client.on('reciveListOfDuelRooms', () => {
            client.emit('listOfDuelRooms', rooms.filter( room => room.visibility) )
            listOfDuelRoomsRecipients.push(client)
        })

        const stopReciveListOfDuelRooms = () => {
            const index = listOfDuelRoomsRecipients.indexOf(client)
            if(index)
                listOfDuelRoomsRecipients.splice(index, 1)
        }

        client.on('stopReciveListOfDuelRooms', () => {
            stopReciveListOfDuelRooms()
        })

        client.on('createNewRoom', async data => {

            //user authentication
            if(!user) return

            user.points = 0

            const room = {
                id,
                name: data.name,
                difficultyLevel: data.difficultyLevel,
                slots: data.slots,
                players: [ user ],
                creator: user.id,
                level: 1,
                numberOfLevels: parseFloat(data.numberOfLevels),
                visibility: true
            }

            switch(room.difficultyLevel){
                default:
                case 'easy':
                    room.intervals = 1
                    room.animationTime = 0.2
                    room.start = -9
                    room.end = 9
                break
                case 'normal':
                    room.intervals = 1
                    room.animationTime = 0.2
                    room.start = -30
                    room.end = 30
                break
                case 'hard':
                    room.intervals = 1
                    room.animationTime = 0.2
                    room.start = -100
                    room.end = 100
                break
                case 'custom':
                    room.intervals = data.intervals
                    room.animationTime = data.animationTime
                    room.start = data.start
                    room.end = data.end
                break
            }

            rooms.push(room)
            roomSockets.push({
                id,
                sockets: [ client ]
            })
            ++id
            sendTo('listOfDuelRooms', rooms.filter( room => room.visibility), listOfDuelRoomsRecipients)

            client.emit('joinToRoom', room)

        })

        client.on('joinRoom', async roomId => {

            //user authentication
            if(!user){
                client.emit('joinToRoomFailed')
                return
            }

            const room = rooms.find( e => e.id === roomId)

            //room must have at least one free slot
            if(room.players.length >= room.slots){
                client.emit('joinToRoomFailed')
                return
            }
            
            user.points = 0
            room.players.push( user )

            const roomSocket = roomSockets.find( e => e.id === roomId )
            roomSocket.sockets.push(client)

            client.emit('joinToRoom', room)
            sendTo('listOfDuelRooms', rooms.filter( room => room.visibility ), listOfDuelRoomsRecipients)
            sendTo('newPlayerList', room.players, roomSockets.find( rs => rs.id === roomId).sockets )
        })

        client.on('sendNewMessage', data => {

            if(!user) return 
            
            const { message, roomId } = data
            const room = roomSockets.find( rs => rs.id === roomId )
            const dataToSend = {
                date: new Date().getTime(),
                author: user.username,
                content: message
            }

            sendTo('newChatMessage', dataToSend, room.sockets)
        })
        
        const disconnectUserFromRoom = roomId => {
            if(!user) return

            const room = rooms.find( r => r.id === roomId )
            const sockets = roomSockets.find( s => s.id === roomId )

            if(!room && !sockets)
                return

            if(room.creator === user.id){
                sendTo('disconnectFromDuelRoom', null, sockets.sockets)
                const roomIndex = rooms.indexOf(room)
                const socketIndex = roomSockets.indexOf(sockets)
                rooms.splice(roomIndex, 1)
                roomSockets.splice(socketIndex, 1)
            }

            const playerIndex = room.players.indexOf( user )
            room.players.splice(playerIndex, 1)       

            const currentSocketIndex = sockets.sockets.indexOf(client)
            sockets.sockets.splice(currentSocketIndex, 1)

            sendTo('listOfDuelRooms', rooms.filter( room => room.visibility ), listOfDuelRoomsRecipients)
        }

        client.on('disconnectUserFromRoom', roomId => disconnectUserFromRoom(roomId))

        client.on('disconnect', () => {
            //sprawdz czy jest w jakims pokoju, jezeli tak wyjeb go stamtad
            const roomSocket = roomSockets.find( rs => !!rs.sockets.find( socket => socket === client ))
            stopReciveListOfDuelRooms()
            if( roomSocket ) //disconnectUserFromRoom
                disconnectUserFromRoom(roomSocket.id)
        })

        client.on('startGame', roomId => {
            const room = rooms.find( r => r.id === roomId)

            if( !user ) return
            if( !room ) return
            if( room.creator !== user.id ) return
            if( room.players.length < 2) return

            const socketRoom = roomSockets.find( rs => rs.id === roomId )

            const numbers = randomizeNumbers(room.end, room.start, room.level)
            room.numbers = numbers
            room.visibility = false
            
            sendTo('listOfDuelRooms', rooms.filter( room => room.visibility ), listOfDuelRoomsRecipients)
            sendTo('startGame', numbers, socketRoom.sockets)
            
        })

        const startNewLevel = roomId => {
            const sockets = roomSockets.find( rs => rs.id === roomId ).sockets
            const room = rooms.find( r => r.id === roomId)
            ++room.level
            room.numbers = randomizeNumbers(room.end, room.start, room.level)

            sendTo('startNewLevel', room, sockets)
        }

        const gameOver = roomId => {
            const room = rooms.find( r => r.id === roomId)
            saveScores(room.players)
            rooms.splice(rooms.indexOf(room), 1)

            const roomSocket = roomSockets.find( rs => rs.id === roomId )
            roomSockets.splice( roomSockets.indexOf(roomSocket), 1 )
        }

        client.on('clientResult', ({ result, roomId }) => {
            const room = rooms.find( r => r.id === roomId)

            if( !user ) return
            if( !room ) return

            const player = room.players.find( p => p._id === user._id)

            const correctResult = room.numbers.reduce( (sum, number) => sum+=number, 0 )
            
            if(correctResult === result)
                player.points += calculatePoints(room.difficultyLevel, room.level)
            player.gaveAnswer = true

            client.emit('answerCorrectness', correctResult === result )
            
            if( doesAllPlayersGaveAnswer(room.players) ){
                deleteGaveAnswersFromPlayers(room.players)
                sendTo('showScoreboard', { scoreboard: room.players.sort( (p1,p2) => p2.points - p1.points ), correctResult }, roomSockets.find( sr => sr.id === roomId ).sockets )
                
                if(room.level === room.numberOfLevels)
                    gameOver(roomId)
                else
                    setTimeout(() => startNewLevel(roomId), 5000)
            }

        })

    })

}

async function saveScores(players){

    const highScore = players.sort( (p1, p2) => p2.points - p1.points )[0].points
    
    players.forEach( async user => {

        const dbUser = await User.findById(user._id)
        dbUser.points += user.points
        ++dbUser.numberOfDuels
        ++dbUser.numberOfGames

        if( user.points === highScore ){
            ++dbUser.wonDuels
        }


        await dbUser.save()
        checkForAchievements(dbUser)

    })
}

function randomizeNumbers(end, start, level){
    let numbers = []
    for(let i=0; i<level + 1; i++)
        numbers.push( Math.floor(Math.random() * (end - start + 1)) + start )
    return numbers
}

function doesAllPlayersGaveAnswer(players){
    return players.filter( p => p.gaveAnswer ).length === players.length
}

function deleteGaveAnswersFromPlayers(players){
    players.forEach( player => {
        delete player.gaveAnswer
    })
}

function calculatePoints(difficultyLevel, level){

    let points = 0

    switch (difficultyLevel){
        case 'easy':
            points = level + 1
        break
        case 'normal':
            points = ( level + 1 ) * 2
        break
        case 'hard':
            points = ( level + 1 ) * 3
        break
        default:
            points = 0
        break
    }

    return points

}

async function deserializeUser(id){
    const user = await User.findOne({ _id: id }, ['_id', 'username'], {})
    return user
}

function sendTo(actionName, data, recipients){

    recipients.forEach( socket => {
        socket.emit(actionName, data)
    })

}