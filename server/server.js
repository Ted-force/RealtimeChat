import express from 'express';
import chat from './controllers/chat';
require('dotenv').config();
// not added cors for now
//app
const app = express();
const http = require('http').createServer(app);

//socket io 
const io = require('socket.io')(http,{
    path: '/socket.io',
    cors:{
        origin: '*',
        methods: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        allowedHeaders: 'Content-Type, Authorization, X-Requested-With, X-Socket-ID',
    }
});

//middlwares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//rest api
app.get('/', (req, res) => {
    res.send('Hello World!');
})

//socket
chat(io);

const PORT = process.env.PORT || 8000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});   
