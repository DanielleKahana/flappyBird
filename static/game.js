
var socket = io();
var pipes = [];
var myGamePiece;
var myScore;
var player,otherPlayers={};
var northPipe;
var southPipe;
var myPlayerName;
var scoreSound;

var winnerText = document.createElement("h1");
var nameField = document.getElementById('name_field');
var signDiv = document.getElementById('start_game');
var gameDiv = document.getElementById('gameDiv');
var header = document.getElementById('header');
var startBtn = document.getElementById('start_btn');


let gap = 80;
let constant_height;


let bird = new Image(),
    bg= new Image(),
    fg= new Image(),
    pipeNorth_img= new Image(),
    pipeSouth_img= new Image(),
    redBird = new Image();

socket.on('winner', function(data) {
    winnerText.innerHTML = "The winner is " + data.name + " with score: " + data.score;
    winnerText.style.cssText = "font-family: Arial;size: 20px;color: #77c5cd;"
    document.body.append(winnerText);

});

//load images
function load_images() {
    bird.src = "static/images/bird.png";
    bg.src = "static/images/bg.png";
    fg.src = "static/images/fg.png";
    pipeNorth_img.src = "static/images/pipeNorth.png";
    pipeSouth_img.src = "static/images/pipeSouth.png";
    redBird.src = "static/images/redBird.png";

    pipeNorth_img.onload = function() {
        constant_height = pipeNorth_img.height + gap;
    }
}


startBtn.onclick = function() {
    socket.emit('new player', nameField.value);
    signDiv.style.display = 'none';
    gameDiv.style.display = 'inline-block';
    header.style.display = 'none';
}


socket.on('start', function() {
    start();
});

socket.on('state',function(players){
    otherPlayers=players;
});

socket.on('pipes',function(myPipes){
    pipes = myPipes;
});



let myGameArea = {
    canvas : document.getElementById('canvas'),
    start : function() {
        this.canvas.width = 288;
        this.canvas.height = 512;
        this.context = this.canvas.getContext('2d');
        this.interval = setInterval(updateGameArea, 20);
    },
    clear : function() {
        if(this.context){
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    },

    stop : function() {
        clearInterval(this.interval);
    }
};

function sound(src) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    this.play = function(){
        this.sound.play();
    }
    this.stop = function(){
        this.sound.pause();
    }
}


function component(width, height, color, x, y, type) {
    if (type == "image") {
        this.image = new Image();
        this.image.src = color;
    }
    this.type = type;
    this.score = 0;
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.gravity = 1.5;
    this.offset=0;
    this.crashed = false;


    this.update = function() {
        ctx = myGameArea.context;
        if (type == "image") {
            ctx.drawImage(this.image,
                this.x,
                this.y);
        }

        else if (this.type == "text") {
            ctx.font = this.width + " " + this.height;
            ctx.fillStyle = color;
            ctx.fillText(this.text, this.x, this.y);
        }
    }

    this.newPos = function() {
        this.offset += 1;
        if (this.offset > 288)
            this.offset=288;
        this.y += this.gravity;
        this.hitBottom();
        this.roof();

    }
    this.hitBottom = function() {
        var rockbottom = myGameArea.canvas.height - fg.height - myGamePiece.height;
        if (this.y > rockbottom) {
            this.y = rockbottom;
            stop();
        }
    }
    this.roof = function() {
        if (this.y  < 0){
            this.y = 0;
            stop();
        }
    }

    this.crashWith = function(otherobj) {
        var crash = false;
            var myleft = this.x;
            var myright = this.x + (this.width);
            var mytop = this.y;
            var mybottom = this.y + (this.height);
            var otherleft = otherobj.x;
            var otherright = otherobj.x + (pipeNorth_img.width);
            var pipeNorthtop = otherobj.y + pipeNorth_img.height;
            var pipeSouthtop = otherobj.y + constant_height;


        if (((myright >= otherleft) && (myleft <= otherright)) && ((mytop <= pipeNorthtop) || (mybottom >= pipeSouthtop))) {
            crash = true;
        }
        return crash;
    }
}


function updateGameArea() {

    myGameArea.clear();
    myGameArea.context.drawImage(bg, 0, 0);

    for (let id in otherPlayers) {
        if(socket.id != id){
            player = otherPlayers[id];
            player = new component(38, 26, "redBird.png", player.x, player.y, "image");
            player.update();
        }
        else {
            myGamePiece.update;
        }
    }

    for (let i = 0; i < pipes.length; i++ ) {
        pipes[i].x--;

        southPipe.x = pipes[i].x;
        southPipe.y = pipes[i].y + constant_height;

        northPipe.x = pipes[i].x;
        northPipe.y = pipes[i].y;

        southPipe.update();
        northPipe.update();

        if(pipes[i].x == 5) {
            myScore.score++;
            scoreSound.play();
        }
    }

    for (let i = 0; i < pipes.length; i += 1) {
        if (myGamePiece.crashWith(pipes[i])) {
            stop();
            return;
        }
    }

    myGameArea.context.drawImage(fg,0,myGameArea.canvas.height - fg.height);
    myScore.text="Score: " + myScore.score;
    myScore.update();
    myPlayerName.text = nameField.value;
    myPlayerName.update();
    myGamePiece.newPos();
    socket.emit('change_pos',myGamePiece, myScore.score);
    myGamePiece.update();
}

function stop() {
    myGameArea.context.drawImage(fg,0,myGameArea.canvas.height - fg.height);
    myGamePiece.update();
    myGameArea.stop();
    myGamePiece.crashed = true;
    myGamePiece.gravity = 0;
    myScore.update();
    myPlayerName.update();

    socket.emit("finished", player);
}

function start (){
    load_images();
    myGamePiece = new component(38, 26, "bird.png", 10, 120, "image");
    myScore = new component("20px", "Verdana", "black", 10 , myGameArea.canvas.height - 20, "text");
    myPlayerName = new component("20px", "Verdana", "black", 200 , myGameArea.canvas.height - 20, "text");
    northPipe = new component(pipeNorth_img.width, pipeNorth_img.height, "pipeNorth.png", myGameArea.canvas.width,0, "image");
    southPipe = new component(pipeSouth_img.width, pipeSouth_img.height , "pipeSouth.png", myGameArea.canvas.width, constant_height, "image");
    scoreSound = new sound("/sounds/score.mp3");
    myGameArea.start();
}

document.addEventListener('keydown', function(event) {
    if(myGamePiece && !myGamePiece.crashed) {
        myGamePiece.y -= 25;
        myGamePiece.update();
        socket.emit('change_pos',myGamePiece, myScore.score);
    }
});