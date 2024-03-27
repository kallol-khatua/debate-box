const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roomSchema = new Schema({
    host: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    name: {
        type: String
    },
    meetingId: {
        type: String,
        required: true
    },
    isOver: {
        type: Boolean,
        default: false
    }
},{timestamps: true});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;