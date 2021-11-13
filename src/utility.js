const data = require("./data");


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

module.exports = { generateRoomCode, generateUUID };