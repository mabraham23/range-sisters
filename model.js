const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const discSchema = mongoose.Schema({
    user : { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    name: {
       type: String,
       required: [true, "You must submit a disc name"],
       maxLength: [30, "Your disc name must be 30 characters or less"]
    },
    brand: {
        type: String,
        required: [true, "You must submit a disc brand"],
        enum:['Innova', 'Discraft', 'Streamline', 'Infinite', 'Dynamic Discs', 'Latitude 64', 'Westside Discs']
    },
    type: {
        type: String,
        required: [true, "You must submit a disc type"],
        enum: ['Distance Driver', 'Fairway Driver', 'Midrange', 'Putter']
    },
    weight: {
        type: Number,
        min: 120,
        max: 230,
    },
    speed: {
        type: Number,
        min: 0,
        max: 14
    },
    glide: {
        type: Number,
        min: 0,
        max: 7
    },
    turn: {
        type: Number,
        min: -5,
        max: 1
    },
    fade: {
        type: Number,
        min: 0,
        max: 5
    },
    color: {
        type: String,
    },
});

const Disc = mongoose.model('Disc', discSchema);

const userSchema = mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    encryptedPassword: {
        type: String,
        required: true,
    },
})

userSchema.methods.setEncryptedPassword = function (plainPassword, callback) {
    bcrypt.hash( plainPassword, 12).then( hash => {
        this.encryptedPassword = hash;
        callback();
    });
}

userSchema.methods.verifyPassword = function (plainPassword, callback) {
    bcrypt.compare( plainPassword, this.encryptedPassword).then( result => {
        callback( result );
    });
};;

const User = mongoose.model('User', userSchema);

module.exports = {
    Disc: Disc,
    User: User
};