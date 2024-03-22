const otpGenerator = require('generate-otp-by-size');
const Room = require('../models/room');
const Member = require('../models/member');

module.exports.hostMeeting = async (req, res, next) => {
    let meetingId = await otpGenerator.generateOTP(8);
    let newRoom = new Room({ host: req.user, meetingId: meetingId });
    await newRoom.save();
    res.send({ success: true, meetingId: `${meetingId}` });
};

module.exports.joinMeeting = async (req, res, next) => {
    let room = await Room.findOne({ meetingId: req.query.meetingId });
    if (!room) {
        return res.send({ success: false, message: "room not found" });
    }

    // if host of the room then not allow to join again
    // console.log(room.host)
    // console.log(req.user._id)
    // console.log(req.user.id)
    // console.log(req.user._id.toString() == room.host.toString())
    if (req.user._id.toString() == room.host.toString()) {
        return res.send({ success: false, message: "you are the host" });
    }

    // if already in the room then not allow to rejoin the room
    let member = await Member.findOne({ memberId: req.user._id, roomId: room._id })
    console.log(member);
    if(member) {
        return res.send({ success: false, message: "you already joind the room" });
    }

    let newMember = new Member({ memberId: req.user, roomId: room });
    await newMember.save();
    res.send({ success: true, meetingId: room.meetingId });
};

module.exports.meeting = async (req, res, next) => {
    // console.log(req.user)
    if (req.query.meetingId && req.query.meetingId > 0) {
        return res.send("Working");
    } else {
        return res.redirect("/");
    }
};  