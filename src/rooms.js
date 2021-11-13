const utility = require("./utility");
const data = require("./data");

function startRoom(client) {
    const code = utility.generateRoomCode();
    console.log("creating room: ", code);
    data.Rooms[code] = {
        players: {}
    };
    joinRoom(code, client);
}

function joinRoom(code, client) {
    // If room exists
    if (data.Rooms[code]) {

        // Give them a number (1-456)
        const newPlayerNumber = utility.generatePlayerNumber(code);
        // Create player
        console.log("join room", client.id, code);
        data.Rooms[code].players[client.id] = {
            score: 0,
            number: newPlayerNumber,
            ready: false
        };
        // Add code to client object
        client.room = code;

        utility.sendData(client, {
            type: "ROOM_JOINED",
            data: {
                roomCode: code,
                number: newPlayerNumber
            },
        });
    } else {
        utility.sendData(client, {
            type: "BAD_CODE",
            data: code,
        });
    }
}

function readyUp(roomCode, playerID) {
    const room = data.Rooms[roomCode];
    room.players[playerID].ready = true;

    // Check if all ready
    const ids = Object.keys(room.players);
    for (let i = 0; i < ids.length; i++) {
        if (!room.players[ids[i]].ready) {
            return;
        }
    }

    // All ready go start
    sendNewParagraph(roomCode);
}

// TODO: make timer
function updatePlayerProgress(roomCode, playerID, score) {
    const room = data.Rooms[roomCode];
    room.players[playerID].score = score;
    sendProgress(roomCode);
}

// Notify room
function sendProgress(roomCode) {
    const players = data.Rooms[roomCode].players;
    let arr = [];
    Object.keys(players).forEach((id) => {
        arr.push(players[id]);
    });

    broadcastToRoom(roomCode, {
        type: "UPDATE_PROGRESS",
        data: arr
    });
}

async function sendNewParagraph(roomCode) {
    const text = await utility.getRandomText();
    broadcastToRoom(roomCode, {
        type: "NEW_PARAGRAPH",
        data: text
    });
}

function broadcastToRoom(roomCode, msg) {
    Object.keys(data.Rooms[roomCode].players).forEach((id) => {
        console.log("player", id);
        utility.sendData(data.Users[id], msg);
    });
}

module.exports = { startRoom, joinRoom, sendNewParagraph, updatePlayerProgress, sendProgress, readyUp };