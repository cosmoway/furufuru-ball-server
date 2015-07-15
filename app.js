/**
 * furufuru-ball-server
 *
 * @author: yuukis (Cosmoway factory4)
 */
var WebSocketServer = require('ws').Server
    , http = require('http')
    , express = require('express')
    , app = express();

app.use(express.static(__dirname + '/'));
var server = http.createServer(app);
var wss = new WebSocketServer({server: server});

// 接続時
wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
    });

    ws.send('something');
});
server.listen(process.env.PORT || 5000);
