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
var wsConnections = [];

// カレントグループID
var currGroupId = generateGroupId();

// 接続時
wss.on('connection', function connection(ws) {
    // Websocket コネクションにカレントグループIDを登録
    ws.id = currGroupId;

    // WebSocket コネクションを配列に保存
    wsConnections.push(ws);

    // プレイヤー数変化時の処理を行う
    var connections = getConnectionsByGroup(ws.id);
    onChangePlayerCount(connections.length, connections);

    // 切断時
    ws.on('close', function () {
        // WebSocket コネクションを配列から削除
        wsConnections = wsConnections.filter(function (conn, i) {
            return (conn !== ws);
        });

        // プレイヤー数変化時の処理を行う
        var connections = getConnectionsByGroup(ws.id);
        onChangePlayerCount(connections.length, connections);
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

        // 同一グループのコネクションを取得
        var connections = getConnectionsByGroup(ws.id);

        // 球が画面外に出たら...
        if (jsonObject['move'] == 'out') {
            // ランダムに他の端末を選択
            var connection = getRandomConnection(connections);
            // その端末に球を送る
            sendMoveInMessage(connection)
        }

        // ゲームスタートになったら
        if (jsonObject['game'] == 'start') {
            // カレントグループID を更新する
            currGroupId = generateGroupId();

            // 全ての端末にゲームスタートのメッセージを送信する
            sendGameStartMessage(connections);

            // ランダムにコネクションを選び、球を送る
            var connection = getRandomConnection(connections);
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
function onChangePlayerCount(count, connections) {
    var m = {'player': 'change', 'count': count};
    sendBroadcast(m, connections);
}

/**
 * Websocket コネクション配列の中から、指定された同一グループのコネクション配列を返す
 * @param groupId
 * @returns {Array.<T>}
 */
function getConnectionsByGroup(groupId) {
    return wsConnections.filter(function (conn, i) {
        return (conn.id == groupId);
    });
}

/**
 * Websocket コネクション配列の中から、ランダムにコネクションを返す
 * @returns {*}
 */
function getRandomConnection(connections) {
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

/**
 * ランダムなグループID を生成する
 * @returns {number}
 */
function generateGroupId() {
    return Math.floor(Math.random() * 10000000);
}

server.listen(process.env.PORT || 5000);
