const express = require("express");
const cors = require("cors");
const socket = require("./socket");

const port = process.env.PORT || 3000;

const app = express();

const server = app.listen(port, function () {
    console.log("Server is listening on port", port);
});

socket.InitWebSocket(server);

app.use(cors());
app.use(express.static("public"));
