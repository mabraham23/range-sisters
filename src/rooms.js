const utility = require("./utility");
const data = require("./data");

function startRoom(client) {
    const code = utility.generateRoomCode();
    data.Rooms[code] = {
        players: [client]
    };
}

async function sendNewParagraph(roomCode) {
    const text = await utility.getRandomText();
    broadcastToRoom(roomCode, {
        type: "NEW_PARAGRAPH",
        data: text
    });
}