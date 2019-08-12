const http = require('http')
const path = require('path')
const express = require('express')
const socketio = require('socket.io')
const {generateMessage} = require('./utils/messages')
const{addUser,removeUser,getUser,getUsersInRoom} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)
   
const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    console.log('New website connection')

    socket.on('sendMessage', (msg) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('message', generateMessage(user.username,msg))
    })

    socket.on('join', ({username, room}, callback) => {
       const {error, user} = addUser({id:socket.id, username, room })

       if(error){
           return callback(error)
       }

        socket.join(user.room)

        socket.emit('message', generateMessage('Admin','welcome'))
        socket.broadcast.to(user.room).emit('message',generateMessage( 'Admin',`${user.username} has joined`))
        io.to(user.room).emit('roomData', {
            room:user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })
    
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit('message', generateMessage('Admin',` ${user.username} has left !`))
            io.to(user.room).emit('roomData', {
                room:user.room,
                users:getUsersInRoom(user.room)
            })
        }
        
    })
})




server.listen(port, () => {
    console.log(`Server is up and running on port ${port} !`)
})
