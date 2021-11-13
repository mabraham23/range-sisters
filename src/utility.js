const data = require("./data");
const WebSocket = require("ws");

// Give them a unique room number (1-456)
function generatePlayerNumber(roomCode) {
    const room = data.Rooms[roomCode];
    if (room) {
        while (true) {
            const n = Math.floor(Math.random() * 456) + 1;
            const ids = Object.keys(room.players);
            for (let i = 0; i < ids.length; i++) {
                // TODO: does this rly work?
                if (room.players[ids[i]].number === n) {
                    break;
                }
            }
            // We gucci
            return n;
        }
    } else {
        return -1;
    }
}

function generateRoomCode() {
    while (true) {
        const code = Math.random().toString(36).substr(2, 5);
        if (data.Rooms[code]) {
            continue;
        } else {
            return code;
        }
    }
};

function generateUUID() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    while (true) {
        const uid = s4() + s4() + '-' + s4();
        if (data.Users[uid]) {
            continue;
        } else {
            return uid;
        }
    }
}

async function getRandomText() {
    const response = await axios.get("http://metaphorpsum.com/paragraphs/1/4");
    return response.data;
}

function sendData(client, data) {
    if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
    }
}


module.exports = { generateRoomCode, generateUUID, getRandomText, sendData, generatePlayerNumber };