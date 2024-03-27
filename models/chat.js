const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const chatSchema = new Schema({
    roomName: {
        type: String,
        required: true
    },
    sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    message: {
        type: String,
        required: true
    }
},{timestamps: true});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;