var http = require('http');
var fs = require('fs');
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

everyone.now.distributeMessage = function(message){
  everyone.now.receiveMessage(this.now.name, message);
};

var actors = [];
nowjs.on('connect', function() {
  actors[this.user.clientId] = {x: 0, y: 0};
});

nowjs.on('disconnect', function() {
  for(var i in actors) {
    if(i == this.user.clientId) {
      delete actors[i];
      break;
    }
  }
});

everyone.now.updateActor = function(x, y) {
  actors[this.user.clientId].x = x;
  actors[this.user.clientId].y = y;
  var toUpdate = {};
  for(var i in actors) {
    if(Math.abs(x - actors[i].x) < 310 && Math.abs(y - actors[i].y) < 210) {
        toUpdate[i] = {x: actors[i].x, y: actors[i].y};
    }
  }
  for(var i in toUpdate) {
    nowjs.getClient(i, function(err) {
      this.now.drawActors(toUpdate);
    });
  }
}
