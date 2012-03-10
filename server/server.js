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
  this.goldCount = 100;
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
  this.user.updateState(players[this.user.clientId]);
}
