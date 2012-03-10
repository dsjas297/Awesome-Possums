var html = require('fs').readFileSync(__dirname+'/static/index.html');
var path = require('path');

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
var tower_id = 0;

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

function User(){
  this.goldCount = starting_gold;
  this.towers = [];
  this.creeps = [];
}

function Creep(){
  this.x;
  this.y;
  this.velX = 0.2;
  this.velY = 0.2;
  this.health;
}

function Tower(type){
  this.type;
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

function updateTower(tower, creeps){
   tower.timeSinceShot++;
   if (tower.timeSinceShot > 100){
      for(var i in creeps){
          if( inRange(creep, tower) ){
              tower.timeSinceShot = 0;
              creeps[i].health--;
              if(creeps[i].health <=0){
                  delete creeps[i];
              }
              this.now.fireTower(tower.x, tower.y, creeps[i].x, creeps[i].y)
              break;
          }
      }
   }
}

function updateCreep(creep){
   creep.x = creep.x + creep.velX;
   creep.y = creep.y + creep.velY;
}

function updateGameState(){
  for (var i in players[this.user.clientId].towers){
      updateTower(players[this.user.clientId].towers[i]);
  }
  for (var i in players[this.user.clientId].creeps){
      updateTower(players[this.user.clientId].creeps[i]);
  }
  this.now.updateState(players[this.user.clientId]);
}

everyone.now.buildTower = function(x, y, type) {
    var retval = false;
    if(players[this.user.clientId].goldCount > 20){
        retval = true;
        players[this.user.clientId].goldCount = players[this.user.clientId].goldCount - 20;
        players[this.user.clientId].towers[tower_id++] = new Tower("basic");
        players[this.user.clientId].towers[tower_id++].x = x;
        players[this.user.clientId].towers[tower_id++].y = y;
        players[this.user.clientId].towers[tower_id++].timeSinceShot = 0;
        players[this.user.clientId].towers[tower_id++].range = 50;
    }
    
    this.now.client_build_tower(retval, x, y, type, players[this.user.clientId].goldCount);
}

function gameLoop(){
    updateGameState();
    var t = setTimeout("gameLoop()", 50);
}

var t = setTimeout("gameLoop()", 5000);
