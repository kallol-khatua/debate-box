const otpGenerator = require('generate-otp-by-size');
const Room = require('../models/room');
const Chat = require('../models/chat');

module.exports.hostMeeting = async (req, res, next) => {
    let meetingId = await otpGenerator.generateOTP(8);
    let hostedMeeting = await Room.findOne({host: req.user, isOver: false});
    // console.log(hostedMeeting)
    if(hostedMeeting) {
        return res.redirect("/");
    }
    // console.log(req.body)
    // console.log(req.body.title)
    let newRoom = new Room({ 
        host: req.user, 
        meetingId: meetingId,
        title: req.body.title,
        description: req.body.description
     });
    await newRoom.save();
    // res.send({ success: true, meetingId: `${meetingId}` });
    res.redirect(`/rooms/meeting?meetingId=${meetingId}`);
};

module.exports.meeting = async (req, res, next) => {
    console.log(req.user)
    if (req.query.meetingId && req.query.meetingId > 0) {
      
        return res.render("rooms/roomDashboard.ejs");
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