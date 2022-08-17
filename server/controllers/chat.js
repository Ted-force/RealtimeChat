const users = [];

const addUsers = (username) => {
    const name = username.trim().toLowerCase();
    const existingUser = users.find((u) => u === name);
    if(!username.trim()) return {error: 'Username is required'};
    if(existingUser) {
        return {error: 'Username is taken'};
    } 
    else {
        users.push(name);
        return username;

    }
}



const chat = (io) => {
    //middleware
    io.use((socket, next) => {
        const username = socket.handshake.auth.username;
        if(!username){
            return next( new Error('invalid username'));
        }
        socket.username = username;
        next();
    })
    // console.log("live chat --->", io.opts);
    io.on('connection', (socket) => {
        console.log("socket id", socket.id);

        // socket.on('username', (username, next) => {
        //     console.log("username", username);
        //     let res = addUsers(username);
        //     if(res.error)
        //     {
        //         return next(res.error);
        //     }else {
        //         io.emit('users', users);
        //         socket.broadcast.emit('user joined', `${username} joined the chat`);
        //     }
            
            
        // });
        let usernames = [];
        for(let [id,socket] of io.of("/").sockets){
            const existingUser = usernames.find((u) => u.username === socket.username);
            if(existingUser)
            {
                socket.emit("username taken");
                socket.disconnect();
                return;
            }else {
              usernames.push({userID: id,
                username: socket.username});  
            }
        }

        socket.emit('users',usernames);

        //when a new users joins notify users
        socket.broadcast.emit('user connected',{
            userID: socket.id,
            username: socket.username
        })

        socket.on('message', (data) => {
            // console.log(message);
            io.emit('message client', data);
        });

        socket.on('private message',({message,to}) => {
            socket.to(to).emit('private message', {
                message,
                from: socket.id,
            })
        })



        //disconnect
        socket.on('disconnect', () => {
            console.log("disconnected");
            socket.broadcast.emit('user disconnected', socket.id);
        });
    });

}

export default chat;