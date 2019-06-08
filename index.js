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

function SendTick() {
  let obj = CreateTickObj();
  io.emit('tick', obj);
}

function CreateTickObj()
{
  let obj = {
    'players': players
  };
  return obj;
}

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

  // send the players object to the new player
  socket.emit('currentPlayers', players);

  // update all other players of the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);

  socket.emit('registeredId', socket.id);

  socket.emit('tick', CreateTickObj());

  socket.emit('starLocation', star);

  // when a player disconnects, remove them from our players object
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
  });

  socket.on('starCollected', function () {
    if(Math.abs(players[socket.id].x - star.x) <= 32 && Math.abs(players[socket.id].y - star.y) <= 32)
    {
      return;
    }

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

server.listen(process.env.PORT || 8081, function () {
  console.log(`Listening on ${server.address().port}`);

  setInterval(() => SendTick(), 41);
});