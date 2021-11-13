const WebSocket = require("ws");
const utility = require("./utility");
const data = require("./data");
const rooms = require("./rooms");

let wss;

function InitWebSocket(server) {
    console.log("Socket initializing...");

    wss = new WebSocket.Server({ server: server });

    wss.on("connection", (conn, req) => {
        conn.onmessage = incomingHandler(conn);
    });
}

function incomingHandler(client) {
    return function (event) {
        const msg = JSON.parse(event.data);
        console.log(msg);

        if (msg.type === "INITIAL_AUTH") {
            if (msg.data !== "") {
                console.log("returning player!", msg.data);
                client.id == msg.data;
            } else {
                const uuid = utility.generateUUID();
                client.id = uuid;
                utility.sendData(client, {
                    type: "SEND_UUID",
                    data: uuid
                });
            }
        } else if (msg.type === "CREATE_ROOM") {
            rooms.startRoom(client);
        } else if (msg.type === "JOIN_ROOM") {
            rooms.joinRoom(msg.data, client);
        }
    };
}

function broadcastToAllClients(data) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

function broadcastToRoom(roomCode, data) {
    data.Rooms[roomCode].players.forEach((player) => {
        utility.sendData(player, data);
    });
}



module.exports = { InitWebSocket };