const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    otp: { 
        type: String, 
        required: true,
    },
    isVerified: { 
        type: Boolean,
        required: true, 
        default: false 
    },
    is_online: {
        type: Boolean,
        default: false
    },
    socket_id : {
        type: String,
        default: ""
    }
},{timestamps: true});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', userSchema);

module.exports = User;