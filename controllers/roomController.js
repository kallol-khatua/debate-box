const otpGenerator = require('generate-otp-by-size');
const Room = require('../models/room');
const Member = require('../models/member');
const Chat = require('../models/chat');

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

    if (req.user._id.toString() == room.host.toString()) {
        return res.send({ success: false, message: "you are the host", code: 1 });
    }

    // if already in the room then not allow to rejoin the room
    let member = await Member.findOne({ memberId: req.user._id, roomId: room._id })
    // console.log(member);
    if (member) {
        return res.send({ success: false, message: "you already joind the room" });
    }

    let newMember = new Member({ memberId: req.user, roomId: room });
    await newMember.save();
    res.send({ success: true, meetingId: room.meetingId });
};

module.exports.meeting = async (req, res, next) => {
    // console.log(req.user)
    if (req.query.meetingId && req.query.meetingId > 0) {
        let room = await Room.findOne({ meetingId: req.query.meetingId })
        let members = await Member.find({ roomId: room._id }).populate("memberId");
        let onlineUsers = members.filter((member) => {
            return member.memberId.meetingRoom == req.query.meetingId;
        })
        onlineUsers = onlineUsers.filter((member) => {
            // console.log(member.memberId._id.toString() != req.user._id.toString())
            return member.memberId._id.toString() != req.user._id.toString();
        })
        // console.log(room, members, onlineUsers)

        // console.log(onlineUsers, req.user)
        return res.render("rooms/roomDashboard.ejs", { onlineUsers });
    } else {
        return res.redirect("/");
    }
};

module.exports.saveChat = async (req, res, next) => {
    try {
        // console.log(req.body);
        let { roomName, sender, message } = req.body;
        let newChat = new Chat({
            roomName: roomName,
            sender: sender,
            message: message
        });

        let chat = await newChat.save();
        // console.log(chat);
        return res.send({ success: true, data: chat });
    }catch(err) {
        res.send({ success: false, message: "error" });
    } 
}