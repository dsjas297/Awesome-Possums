var html = require('fs').readFileSync(__dirname+'/static/index.html');
var path = require('path');
var http = require('http');
var fs = require('fs');

var server = http.createServer(function (request, response) {
    console.log('request starting...');
     
    var filePath = '.' + request.url;
    if (filePath == './')
        filePath = './static/index.html';
         
    var extname = path.extname(filePath);
    var contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
    }
     
    path.exists(filePath, function(exists) {
     
        if (exists) {
            fs.readFile(filePath, function(error, content) {
                if (error) {
                    response.writeHead(500);
                    response.end();
                    console.log('error');
                }
                else {
                    response.writeHead(200, { 'Content-Type': contentType });
                    response.end(content, 'utf-8');
                }
            });
        }
        else {
            response.writeHead(404);
            response.end();
        }
    });
     
}).listen(8080);

var nowjs = require("now");
var everyone = nowjs.initialize(server);

var map_height = 20;
var map_width = 20;

var players = [];

var starting_gold = 1000;
var starting_lives = 3;
var tower_id = 0;
var creep_id = 0;

nowjs.on('connect', function() {
  players[this.user.clientId] = new User();
});

nowjs.on('disconnect', function() {
  for(var i in players) {
    if(i == this.user.clientId) {
      delete players[i];
      break;
    }
  }
});

function User() {
  this.goldCount = starting_gold;
  this.lives     = starting_lives;
  this.towers = [];
  this.creeps = [];
}

function Creep(id) {
  this.id = id;
  this.x;
  this.y;
  this.speed;
  this.path = [];
  this.pathIndex = 0;
  this.health;
  this.xVel;
  this.yVel;
}

function Tower(type){
  this.type = type;
  this.x;
  this.y;
  this.timeSinceShot;
  this.range;
}

// Synchronous updates
function inRange(creep, tower){
    if( Math.sqrt( Math.pow((creep.x - tower.x),2) + Math.pow((creep.y - tower.y),2) ) < tower.range ){
        return true;
    }
    return false;
}

function updateTower(userid, tower, creeps, delta) {
   tower.timeSinceShot = tower.timeSinceShot + delta;
   if (tower.timeSinceShot > 500){
      for(var i in creeps){
          if( inRange(creep, tower) ){
              // tell them to fire a tower
              nowjs.getClient(userid, function(){
                  this.now.tower_fire(tower.x, tower.y, creeps[i].id)
              });
              tower.timeSinceShot = 0;
              creeps[i].health--;
              if(creeps[i].health <=0){
                  delete creeps[i];
                  nowjs.getClient(userid, function(){
                      this.now.delete_creep(creeps[i].id)
                  });
              }
              break;
          }
      }
   }
}

function dist(x1,x2,y1,y2) {
    return Math.sqrt(Math.pow(x1-y1,2) + Math.pow(x2-y2,2));
}

function updateCreep(userid, user, creep, delta) {
   if (creep.pathIndex != creep.path.length - 1) {
      var nextPoint = creep.path[creep.pathIndex + 1];
      creep.x = creep.x + delta * creep.speed * creep.xVel;
      creep.y = creep.y + delta * creep.speed * creep.yVel;
      var nextX = nextPoint[0];
      var nextY = nextPoint[1];
      if (dist(creep.x,creep.y,nextX,nextY) <= delta * creep.speed) {
         // we are close enough to the next point, update
         creep.pathIndex = creep.pathIndex + 1;
         if (creep.pathIndex == creep.path.length - 1) {
             // we have reached the end
             for (var i in users.creeps) {
                 if (users.creeps[i].id == creep.id) {
                    delete creeps[i];
                    break;
                 }
             }
             user.lives = user.lives - 1;

             // tell them a creep reached the end
             nowjs.getClient(userid, function(){
               this.now.creep_reached_end(creep.id);
             });
         } else {
             // need to update xVel and yVel
             nextPoint = creep.path[creep.pathIndex + 1];
             nextX = nextPoint[0];
             nextY = nextPoint[1];
             var diffX = nextX - creep.x;
             var diffY = nextY - creep.y;
             var normFactor = Math.sqrt(diffX*diffX + diffY*diffY);
             creep.xVel = diffX / normFactor;
             creep.yVel = diffY / normFactor;
         }
      }
   }
}

function updateGameState(delta){
  for (var i in players){
      for(var j in players[i].towers){
          updateTower(i, players[i].towers[j], players[i].creeps, delta);
      }
  }
  for (var i in players){
      for(var j in players[i].creeps){
          updateCreep(i, players[i], players[i].creeps[j], delta);
      }
  }
}

everyone.now.buildTower = function(x, y, type) {
    var retval = false;
    if(players[this.user.clientId].goldCount > 20){
        retval = true;
        var tid = tower_id++;
        players[this.user.clientId].goldCount = players[this.user.clientId].goldCount - 20;
        players[this.user.clientId].towers[tid] = new Tower("basic");
        players[this.user.clientId].towers[tid].x = x;
        players[this.user.clientId].towers[tid].y = y;
        players[this.user.clientId].towers[tid].timeSinceShot = 0;
        players[this.user.clientId].towers[tid].range = 50;
    }
    
    this.now.client_build_tower(retval, x, y, type, players[this.user.clientId].goldCount);
}

everyone.now.synchCreeps = function() {
    this.now.synchCreeps( players[this.user.clientId].creeps );
}

lastTime = Date.getTime();
while(1) {
    currentTime = Date.getTime();
    updateGameState(currentTime - lastTime);
    lastTime = currentTime;
}
