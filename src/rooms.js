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

async function sendNewParagraph(roomCode) {
    const text = await utility.getRandomText();
    broadcastToRoom(roomCode, {
        type: "NEW_PARAGRAPH",
        data: text
    });
}

module.exports = { startRoom, joinRoom, sendNewParagraph };