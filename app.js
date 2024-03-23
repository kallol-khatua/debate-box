require('dotenv').config();

const express = require('express')
const app = express()
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const bodyParser = require('body-parser');
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const http = require("http");
const socketIO = require("socket.io");

const server = http.createServer(app);
const io = socketIO(server)

// models
const User = require('./models/user');
const Room = require('./models/room');

const { isLoggedIn, isVerified } = require('./utils/middlewares');

// routes
const userRouter = require("./routes/user");
const roomRouter = require("./routes/room");
const Member = require('./models/member');

async function main() {
    await mongoose.connect(process.env.ATLAS_URL);
}

main()
    .then(() => {
        console.log("connected to database");
    })
    .catch((err) => {
        console.log(err);
    });

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const store = MongoStore.create({
    mongoUrl: process.env.ATLAS_URL,
    crypto: {
        secret: process.env.SECRET
    },
    touchAfter: 7 * 24 * 60 * 60 * 1000
});

store.on("error", () => {
    console.log("error in mongo session store", err)
});

const sessionOPtions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    }
};

app.use(session(sessionOPtions));
app.use(cookieParser());
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// socket io
// io.on("connection", async(socket) => {
//     let userId = socket.handshake.auth.token;
//     await User.findByIdAndUpdate({ _id: userId }, { is_online: true, socket_id: socket.id });
//     socket.broadcast.emit("getOnlineUser", userId);

//     socket.on('disconnect', async () => {
//         let userId = socket.handshake.auth.token;
//         await User.findByIdAndUpdate({ _id: userId }, { is_online: false, socket_id: "" });
//         socket.broadcast.emit("getOfflineUser", userId);
//     });
// }) 

// socket of stream page
let sd = io.of("/stream-debate");
sd.on("connection", async(socket) => {
    let userId = socket.handshake.auth.token;
    let user = await User.findByIdAndUpdate({ _id: userId }, { is_online: true, socket_id: socket.id });
    socket.broadcast.emit("getOnlineUser", {userId, user});

    socket.on("getConnectedUsers", async (meetingId) => {
        // console.log(meetingId);
        let room = await Room.findOne({meetingId: meetingId})
        let members = await Member.find({roomId: room._id}).populate("memberId");
        let onlineUsers = members.filter((member) => {
            return member.memberId.is_online;
        })
        onlineUsers = onlineUsers.filter((member) => {
            // console.log(member)
            // console.log(member.memberId._id.toString() != userId.toString())
            return member.memberId._id.toString() != userId.toString();
        })
        // console.log(onlineUsers)
        socket.emit("connectedUser", onlineUsers);
    });

    socket.on("sdpProcess", (data) => {
        socket.to(data.to_connid).emit("sdpProcess",{
            message: data.message,
            from_connid: socket.id 
        })
    })

    socket.on('disconnect', async () => {
        let userId = socket.handshake.auth.token;
        await User.findByIdAndUpdate({ _id: userId }, { is_online: false, socket_id: "" });
        socket.broadcast.emit("getOfflineUser", userId);
    });
}) 

app.use((req, res, next) => {
    res.cookie('user', JSON.stringify(req.user));
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

app.get("/", isLoggedIn, isVerified, async(req, res, next) => {
    let rooms = await Room.find({host: req.user._id});
    let joinedRooms = await Member.find({memberId: req.user._id}).populate("roomId");
    // console.log(joinedRooms);
    // console.log(req);
    res.render("rooms/index.ejs", {rooms, joinedRooms});
});

// using routes
app.use("/users", userRouter);
app.use("/rooms", roomRouter);

server.listen(process.env.PORT || 8080, () => {
    console.log("listening to post 8080");
});