const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const discSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserId",
    required: true,
  },
  userName: {
    type: String,
    required: true,
    maxLength: 30,
  },
  balance: {
    type: Number,
    min: 0,
    max: 999999999,
  },
  wins: {
    type: Number,
  },
  losses: {
    type: Number,
  },
});

const userDisc = mongoose.model("userDisc", discSchema);

const userSchema = mongoose.Schema({
  userName: {
    type: String,
    required: true,
    maxLength: 30,
  },
  encryptedPassword: {
    type: String,
    required: true,
  },
});

userSchema.methods.setEncryptedPassword = function (plainPassword, callback) {
  bcrypt.hash(plainPassword, 12).then((hash) => {
    this.encryptedPassword = hash;
    callback();
  });
};

userSchema.methods.verifyPassword = function (plainPassword, callback) {
  bcrypt.compare(plainPassword, this.encryptedPassword).then((result) => {
    callback(result);
  });
};

const User = mongoose.model("User", userSchema);

module.exports = {
  userDisc: userDisc,
  User: User,
};
