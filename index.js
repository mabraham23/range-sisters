const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const passport = require("passport");
const passportLocal = require("passport-local");
const mongodb = require("./MongoConfig");
const cors = require("cors");
const axios = require("axios");
var bodyParser = require("body-parser");

async function get_random_text() {
  const resp = await axios.get("http://metaphorpsum.com/paragraphs/1/4");
  return resp.data
}

mongoose.connect(mongodb.mongo, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const app = express();
const port = process.env.PORT || 3000;
const model = require("./model");
const WebSocket = require("ws");
const { response } = require("express");

let server = app.listen(port, function () {
  console.log("Web Socket server is listening on port", port);
});

const wss = new WebSocket.Server({ server: server });

function broadcastToAllClients(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

function sendData(client, data, attribute) {
    ret = {
        attribute: attribute,
        data: data
    }
    client.send(JSON.stringify(ret));
}

wss.getUniqueID = function () {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + "-" + s4();
};

clients = [];
groups = [];
wss.on("connection", async function connection(newClient) {
    newClient.id = wss.getUniqueID();
    clients.push(newClient);
    if (clients.length >= 10){
        groups.push(clients);
        clients = [];
    }
    attribute = "paragraph"
    text = await get_random_text();
    console.log(text);
    sendData(newClient, text, attribute)
    newClient.on("message", async(data) => {
        data = JSON.parse(data);
        if (data["start_game"]) {
            groups.forEach((group) => {
                group.forEach(async (client) => {
                    if (newClient.id === client.id) {
                        text = await get_random_text();
                        attribute = "paragraph"
                        group.forEach( function(client){
                            sendData(client, text, attribute);
                        })
                    }
                })
            })
        } else {
            console.log(data);
            groups.forEach((group) => {
                group.forEach(async (client) => {
                    if (newClient.id === client.id) {
                        attribute = "player-info"
                        group.forEach( function(client){
                            sendData(client, data, attribute);
                        })
                    }
                })
            })
        } 
    });


});


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
// app.options('http://localhost:8080', cors())
app.use(express.static("public"));

// used to sign a cookie to verify the signature of the client or server
app.use(
  session({
    secret: "3df23fnb912jslzl05f",
    resave: false,
    saveUninitialized: true,
  })
);

// passport session
app.use(passport.initialize());

// glue between the two
app.use(passport.session());

// 1. local stategy implementation
passport.use(
  new passportLocal.Strategy(
    {
      usernameField: "email",
      passwordField: "plainPassword",
    },
    function (email, plainPassword, done) {
      // done is a function, call when done!
      model.User.findOne({ email: email })
        .then(function (user) {
          // verify that the user exists:
          if (!user) {
            // fail: user does not exist
            done(null, false);
            return;
          }
          // verify user's password
          user.verifyPassword(plainPassword, function (result) {
            if (result) {
              // user and password matched
              done(null, user);
            } else {
              // user exists but given wrong password
              done(null, false);
            }
          });
        })
        .catch(function (err) {
          done(err);
        });
    }
  )
);

// 2. serialize user to session
passport.serializeUser(function (user, done) {
  done(null, user._id);
});

// 3. de-serialize user from session
passport.deserializeUser(function (userId, done) {
  model.User.findOne({ _id: userId })
    .then(function (user) {
      done(null, user);
    })
    .catch(function (err) {
      done(err);
    });
});

// 4. Need the authenticate endpoint
app.post("/session", passport.authenticate("local"), function (req, res) {
  res.set("Access-Control-Allow-Origin", "http://localhost:8080");
  res.set("Access-Control-Allow-Credentials", "true");
  // this function is called if authentication succeeds
  res.status(201).json(req.user);
  // res.json(req.user);
  // res.sendStatus(201);
});

// logout user
app.delete("/session", function (req, res) {
  res.set("Access-Control-Allow-Origin", "http://localhost:8080");
  res.set("Access-Control-Allow-Credentials", "true");
  // this function is called if authentication succeeds
  req.logOut();
  res.sendStatus(200);
});

// 5. "me" endpoint
app.get("/me", function (req, res) {
  res.set("Access-Control-Allow-Origin", "http://localhost:8080");
  res.set("Access-Control-Allow-Credentials", "true");
  if (req.user) {
    res.json(req.user);
    // send user details
  } else {
    res.sendStatus(401);
  }
});

app.post("/users", (req, res) => {
  var user = new model.User({
    email: req.body.email,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
  });

  res.set("Access-Control-Allow-Origin", "http://localhost:8080");
  res.set("Access-Control-Allow-Credentials", "true");

  user.setEncryptedPassword(req.body.plainPassword, function () {
    // Store hash in your passowrd DB
    user
      .save()
      .then(() => {
        console.log("User Created");
        res.sendStatus(201);
      })
      .catch(function (err) {
        if (err.errors) {
          var messages = {};
          for (var e in err.errors) {
            messages[e] = err.errors[e].messages;
          }
          res.status(422).json(messages);
        } else if (err.code == 11000) {
          res.status(409).json({
            email: "Already Registered.",
          });
        } else {
          // something else happened
          res.sendStatus(500);
          console.log("Unknown error occurred:", err);
        }
      });
  });
});

// DISCS API REQUESTS
app.get("/discs", (req, res) => {
  let filter = {
    user: req.user._id,
  };
  // return a list of discs
  res.set("Access-Control-Allow-Origin", "http://localhost:8080");
  model.Disc.find(filter).then((discs) => {
    console.log("disc queried from DB:", discs);
    res.json(discs);
  });
});

// retrieve an existing pizza member
app.get("/discs/:discsId", (req, res) => {
  let filter = {
    user: req.user._id,
    _id: req.params.discId,
  };

  model.Disc.findOne(filter)
    .then((disc) => {
      if (disc) {
        res.json(disc);
      } else {
        res.sendStatus(404);
      }
    })
    .catch((err) => {
      res.sendStatus(400);
    });
});

app.post("/discs", (req, res) => {
  if (!req.user) {
    res.sendStatus(401);
    return;
  }

  let disc = new model.Disc({
    name: req.body.name,
    brand: req.body.brand,
    type: req.body.type,
    weight: req.body.weight,
    speed: req.body.speed,
    glide: req.body.glide,
    turn: req.body.turn,
    fade: req.body.fade,
    color: req.body.color,
    user: req.user._id,
  });

  disc
    .save()
    .then(() => {
      console.log("Disc Created");
      res.sendStatus(201);
    })
    .catch(function (err) {
      console.log(err.errors);
      if (err.errors) {
        var messages = {};
        for (var e in err.errors) {
          messages[e] = err.errors[e].message;
        }
        // console.log("these are the messages", messages)
        res.status(422).json(messages);
      } else {
        // something else happened
        res.sendStatus(500);
      }
    });
});

app.delete("/discs/:discId", (req, res) => {
  let filter = {
    user: req.user._id,
    _id: req.params.discId,
  };

  model.Disc.findByIdAndDelete(filter).then(() => {
    console.log("Disc deleted");
    res.sendStatus(204);
  });
});

// retrieve an existing pizza member
app.put("/discs/:discId", (req, res) => {
  let filter = {
    user: req.user._id,
    _id: req.params.discId,
  };

  model.Disc.findOne(filter)
    .then((disc) => {
      if (disc) {
        disc.name = req.body.name;
        disc.brand = req.body.brand;
        disc.type = req.body.type;
        disc.weight = req.body.weight;
        disc.speed = req.body.speed;
        disc.glide = req.body.glide;
        disc.turn = req.body.turn;
        disc.fade = req.body.fade;
        disc.color = req.body.color;

        disc
          .save()
          .then(() => {
            console.log("Disc Created");
            res.sendStatus(200);
          })
          .catch((err) => {
            res.sendStatus(500);
          });
      } else {
        res.sendStatus(404);
      }
    })
    .catch(function (err) {
      console.log(err.errors);
      if (err.errors) {
        var messages = {};
        for (var e in err.errors) {
          messages[e] = err.errors[e].message;
        }
        // console.log("these are the messages", messages)
        res.status(422).json(messages);
      } else {
        // something else happened
        res.sendStatus(500);
      }
    });
});
