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

    // 最初の接続であれば、球を送る
    if (connections.length == 0) {
        sendMoveInMessage(ws);
    }

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

        var jsonObject;
        try {
            jsonObject = JSON.parse(message);
        } catch (e) {
            console.log(e);
            return;
        }

        // 球が画面外に出たら...
        if (jsonObject['move'] == 'out') {
            // ランダムに他の端末を選択
            var connection = getRandomConnection();
            // その端末に球を送る
            sendMoveInMessage(connection)
        }
    });
});

/**
 * Websocket コネクション配列の中から、ランダムにコネクションを返す
 * @returns {*}
 */
function getRandomConnection() {
    var connection = null;
    var length = connections.length;
    if (length > 0) {
        var index = Math.floor(Math.random() * length);
        connection = connections[index];
    }
    return connection;
}

/**
 * 指定した端末に球を送る
 * @param connection
 */
function sendMoveInMessage(connection) {
    if (connection != null) {
        var m = {'move': 'in'};
        connection.send(JSON.stringify(m));
    }
}

server.listen(process.env.PORT || 5000);
