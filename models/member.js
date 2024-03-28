const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const memberSchema = new Schema({
    roomId: {
        type: Schema.Types.ObjectId,
        ref: "Room",
        required: true
    },
    host: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    memberId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    last_joined: {
        type: Date,
        required: true
    },
    meetingId: {
        type: String,
        required: true
    },
},{timestamps: true});

const Member = mongoose.model('Member', memberSchema);

module.exports = Member;