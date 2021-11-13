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

        if (msg.type === "INITIAL_AUTH") {
            if (msg.data !== "") {
                console.log("returning player!", msg.data);
                client.id = msg.data;
            } else {
                const uuid = utility.generateUUID();
                console.log("new player!", uuid);
                client.id = uuid;
                utility.sendData(client, {
                    type: "SEND_UUID",
                    data: uuid
                });
            }
            data.Users[client.id] = client;
        } else if (msg.type === "CREATE_ROOM") {
            rooms.startRoom(client);
        } else if (msg.type === "JOIN_ROOM") {
            rooms.joinRoom(msg.data, client);
        } else if (msg.type === "READY_UP") {
            rooms.readyUp(client.room, client.id);
        } else if (msg.type === "UPDATE_PROGRESS") {
            rooms.updatePlayerProgress(client.room, client.id, msg.data);
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



module.exports = { InitWebSocket };