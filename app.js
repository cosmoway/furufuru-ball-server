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

    // プレイヤー数変化時の処理を行う
    onChangePlayerCount(connections.length);

    // 切断時
    ws.on('close', function () {
        // WebSocket コネクションを配列から削除
        connections = connections.filter(function (conn, i) {
            return (conn !== ws);
        });

        // プレイヤー数変化時の処理を行う
        onChangePlayerCount(connections.length);
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

        // ゲームスタートになったら
        if (jsonObject['game'] == 'start') {
            // 全ての端末にゲームスタートのメッセージを送信する
            sendGameStartMessage(connections);

            // ランダムにコネクションを選び、球を送る
            var connection = getRandomConnection();
            sendMoveInMessage(connection);
        }

        // ゲームオーバーになったら
        if (jsonObject['game'] == 'over') {
            // 全ての端末にゲームオーバーのメッセージを送信する
            sendGameOverMessage(connections);
        }
    });
});

/**
 * プレイヤー数が変化したら、変化後のプレイヤー数をブロードキャストする
 * @param count プレイヤー数
 */
function onChangePlayerCount(count) {
    var m = {'player': 'change', 'count': count};
    sendBroadcast(m, connections);
}

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

/**
 * ゲームスタートしたことを通知する
 */
function sendGameStartMessage(connections) {
    var m = {'game': 'start'};
    sendBroadcast(m, connections);
}

/**
 * ゲームオーバーしたことを通知する
 */
function sendGameOverMessage(connections) {
    var m = {'game': 'over'};
    sendBroadcast(m, connections);
}

/**
 * メッセージをブロードキャストする
 * @param message
 */
function sendBroadcast(message, connections) {
    connections.forEach(function(connection, index) {
        if (connection != null) {
            connection.send(JSON.stringify(message));
        }
    });
}

server.listen(process.env.PORT || 5000);
