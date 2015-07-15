/**
 * furufuru-ball-server
 *
 * @author: Yuuki Shimizu at Cosmoway
 */
var WebSocketServer = require('ws').Server
    , http = require('http')
    , express = require('express')
    , app = express();

app.use(express.static(__dirname + '/'));
var server = http.createServer(app);
var wss = new WebSocketServer({server: server});

// Websocket コネクション配列
var connections = [];

// 接続時
wss.on('connection', function connection(ws) {

    // WebSocket コネクションを配列に保存
    connections.push(ws);

    // 切断時
    ws.on('close', function () {
        // WebSocket コネクションを配列から削除
        connections = connections.filter(function (conn, i) {
            return (conn !== ws);
        });
    });

    // メッセージ受信時
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
    });

    ws.send('something');
});
server.listen(process.env.PORT || 5000);
