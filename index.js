'use strict';
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

var players = {};
var star = {
  x: Math.floor(Math.random() * 700) + 50,
  y: Math.floor(Math.random() * 500) + 50
};
var scores = {
  blue: 0,
  red: 0
};

io.on('connection', function (socket) {
  console.log('a user connected: ', socket.id);
  // create a new player and add it to our players object
  players[socket.id] = {
    rotation: 0,
    x: Math.floor(Math.random() * 700) + 50,
    y: Math.floor(Math.random() * 500) + 50,
    playerId: socket.id,
    team: (Math.floor(Math.random() * 2) == 0) ? 'red' : 'blue'
  };
  
  socket.emit('currentPlayers', players);

  
  socket.emit('starLocation', star);

  
  socket.emit('scoreUpdate', scores);
  
  
  socket.broadcast.emit('newPlayer', players[socket.id]);


  socket.on('disconnect', function () {
    console.log('user disconnected: ', socket.id);
    delete players[socket.id];

    io.emit('disconnect', socket.id);
  });

  // when a player moves, update the player data
  socket.on('playerMovement', function (movementData) {
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    players[socket.id].rotation = movementData.rotation;
    // emit a message to all players about the player that moved
    socket.broadcast.emit('playerMoved', players[socket.id]);
  });

  socket.on('starCollected', function () {
    if (players[socket.id].team === 'red') {
      scores.red += 10;
    } else {
      scores.blue += 10;
    }

    star.x = Math.floor(Math.random() * 700) + 50;
    star.y = Math.floor(Math.random() * 500) + 50;

    io.emit('starLocation', star);
    io.emit('scoreUpdate', scores);
  });
});

function tick()
{
    return {
      time : new Date().getSeconds()
    }; 
}

server.listen(process.env.PORT || 8081, function () {
  console.log(`Listening on ${server.address().port}`);

  setInterval(() => io.emit('tick', tick()), 100);
});