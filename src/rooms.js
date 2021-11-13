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
            alive: true,
            number: newPlayerNumber,
            shape: utility.getPlayerShape(),
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
    sendRedLightGreenLight(roomCode);
}

function resetReadyUp(roomCode) {
    const players = data.Rooms[roomCode].players;
    let arr = [];
    Object.keys(players).forEach((id) => {
        room.players[id].ready = false;
    });
}

// TODO: make timer
function updatePlayerProgress(roomCode, playerID, score) {
    const room = data.Rooms[roomCode];
    room.players[playerID].score = score;
    sendProgress(roomCode);
}

function updatePlayerAliveStatus(roomCode, playerID, alive_status) {
    const room = data.Rooms[roomCode];
    room.players[playerID].alive = alive_status;
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
        utility.sendData(data.Users[id], msg);
    });
}

// game over if all players are dead or a player has reached the end
function gameOver(roomCode) {
    all_dead = true;
    player_won = false;
    Object.keys(data.Rooms[roomCode].players).forEach((id) => {
        if (data.Rooms[roomCode].players[id].alive) {
            all_dead = false;
        } else if (data.Rooms[roomCode].players[id].score >= 10) {
            player_won = true;
        }
    });

    if ( player_won || all_dead ){
        broadcastToRoom(roomCode, {
            type: "GAME_OVER",
        });
        resetReadyUp(roomCode);
        return true;
    } else {
        return false;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendRedLightGreenLight(roomCode) {
    let isRed = true;
    let secs = 0;
    while (!gameOver(roomCode)){
        if (isRed === true) {
            isRed = false;
            secs = utility.getRandomInRange(4, 10);
        } else {
            isRed = true;
            secs = utility.getRandomInRange(2, 4);
        }
        broadcastToRoom(roomCode, {
            type: "RED_LIGHT_GREEN_LIGHT",
            data: isRed 
        });
        await sleep(secs * 1000);
    }
}

module.exports = { startRoom, joinRoom, sendNewParagraph, updatePlayerProgress, updatePlayerAliveStatus, sendProgress, readyUp };