const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");

const passport = require("passport");
const passportLocal = require("passport-local");

const mongodb = require("./MongoConfig");

const cors = require("cors");
var bodyParser = require("body-parser");

const deepai = require("deepai"); // OR include deepai.min.js as a script tag in your HTML
deepai.setApiKey("2cd3fc5f-2841-4cd1-8bbb-319992f854e3");

async function get_random_text() {
  var resp = await deepai.callStandardApi("text-generator", {
    text: "Temporary Text",
  });
  return resp.output;
}

mongoose.connect(mongodb.mongo, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const app = express();
const port = process.env.PORT || 3000;

const model = require("./model");

// websocket stuff

const WebSocket = require("ws");

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

function sendData(client, data) {
  client.sendData(JSON.stringify(data));
}

wss.on("connection", function connection(newClient) {
  console.log("New client just connected");
  newClient.on("message", (data) => {
    console.log("A client just sent a message to the server:", data);
    data = JSON.parse(data);
    console.log("this is the data:", data);
    broadcastToAllClients(data);
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
