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

        const newPlayerNumber = utility.generatePlayerNumber(code);
        // Give them a number (1-456)
        data.Rooms[code].players[client.id] = {
            score: 0,
            number: newPlayerNumber
        };
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

// TODO: make timer
function updatePlayerProgress(roomCode, playerID, score) {
    data.Rooms[roomCode].players[playerID].score = score;
    broadcastToRoom(roomCode);
}

// Notify room
function sendProgress(roomCode) {
    broadcastToRoom(roomCode, data.Rooms[roomCode].players);
}

async function sendNewParagraph(roomCode) {
    const text = await utility.getRandomText();
    broadcastToRoom(roomCode, {
        type: "NEW_PARAGRAPH",
        data: text
    });
}

function broadcastToRoom(roomCode, data) {
    data.Rooms[roomCode].players.forEach((player) => {
        utility.sendData(player, data);
    });
}

module.exports = { startRoom, joinRoom, sendNewParagraph, updatePlayerProgress, sendProgress };