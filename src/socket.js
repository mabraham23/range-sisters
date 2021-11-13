const WebSocket = require("ws");
const utility = require("./utility");
const data = require("./data");

let wss;

function InitWebSocket(server) {
    console.log("Socket initializing...");

    wss = new WebSocket.Server({ server: server });

    wss.on("connection", (conn, req) => {
        data.Users[utility.generateUUID()] = conn;

        conn.on("message", incomingHandler);
    });
}

function incomingHandler(event) {
    const data = JSON.parse(event);
    console.log(data);
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
        sendData(player, data);
    });
}

function sendData(client, data) {
    if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
    }
}

async function sendNewParagraph(roomCode) {
    const text = await utility.getRandomText();
    broadcastToRoom(roomCode, {
        type: "NEW_PARAGRAPH",
        data: text
    });

}

module.exports = { InitWebSocket };