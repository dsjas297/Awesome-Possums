var html = require('fs').readFileSync(__dirname+'/test.html');
var server = require('http').createServer(function(req, res){
  res.end(html);
});
server.listen(8080);

var nowjs = require("now");
var everyone = nowjs.initialize(server);

var map_height = 100;
var map_width = 100;

var players = [];

var starting_gold = 1000;


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
    retval = false
    if(players[this.user.clientId].goldCount > 20){
        retval = true;
        players[this.user.clientId].goldCount = players[this.user.clientId].goldCount - 20;
    }
    
    return [retval, x, y, type, players[this.user.clientId].goldCount];
}


