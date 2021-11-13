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

function sendData(client, data) {
    client.send(JSON.stringify(data));
}

module.exports = { InitWebSocket };