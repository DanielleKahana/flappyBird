// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketIO(server);
app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));

// Routing
app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/bird.png', function (request, response) {
    response.sendFile(path.join(__dirname, '/static/images/bird.png'));
});


app.get('/bg.png', function (request, response) {
    response.sendFile(path.join(__dirname, '/static/images/bg.png'));
});


app.get('/fg.png', function (request, response) {
    response.sendFile(path.join(__dirname, '/static/images/fg.png'));
});


app.get('/pipeNorth.png', function (request, response) {
    response.sendFile(path.join(__dirname, '/static/images/pipeNorth.png'));
});


app.get('/pipeSouth.png', function (request, response) {
    response.sendFile(path.join(__dirname, '/static/images/pipeSouth.png'));
});

app.get('/redBird.png', function (request, response) {
    response.sendFile(path.join(__dirname, '/static/images/redBird.png'));
});

app.get('/stylesheet.css', function (request, response) {
    response.sendFile(path.join(__dirname, '/stylesheet.css'));
});

app.get('/sounds/score.mp3', function (request, response) {
    response.sendFile(path.join(__dirname, '/static/sounds/score.mp3'));
});


// Starts the server.
server.listen(5000, function() {
    console.log('Starting server on port 5000: http://localhost:5000');
    create_pipes();
});

let pipes = [];
var players = {};
var images = {};
var winner;

var numOfPlayers = 0;


io.on('connection', function(socket) {
    socket.on('new player', function(data) {
        players[socket.id] = {
            x: 10,
            y: 150,
            name: data,
            score: 0
        };
        startGame(socket);
    });

    socket.on('change_pos',function(myPlayer, myScore){
        var player = players[socket.id] || {};
        player.x = myPlayer.x;
        player.y = myPlayer.y;
        player.offset = myPlayer.offset;
        player.score = myScore;

    });


    socket.on('finished',function(myPlayer){
        let playersSize = Object.keys(players).length;
        numOfPlayers++;
        if(numOfPlayers == playersSize) {
            searchForWinner();
            io.sockets.emit('winner', winner);
            numOfPlayers = 0;
            winner = null;
        }
    });

    socket.on('disconnect', function(myPlayer) {
        delete players[socket.id];
    });


});

function startGame(socket) {
    socket.emit('pipes', pipes);
    socket.emit('state', players);
    socket.emit('start');
}

function searchForWinner() {
    var bestScore = -1;
    for (let id in players) {
        if(bestScore < players[id].score) {
            bestScore = players[id].score;
            winner = players[id];
        }
    }
}

function create_pipes() {
    var x =  118;
    var height = 242;

    for(var i=0; i< 150; i++) {
        x += 170;
        pipes.push({
            x : x,
            y: Math.floor(Math.random()* height) - height
        })
    }
}


setInterval(function() {
    io.sockets.emit('state', players);
}, 500 / 60);

