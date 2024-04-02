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
const Chat = require('./models/chat');


const { isLoggedIn, isVerified } = require('./utils/middlewares');

// routes
const userRouter = require("./routes/user");
const roomRouter = require("./routes/room");


async function main() {
    await mongoose.connect(process.env.DB_URL);
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
    mongoUrl: process.env.DB_URL,
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
// let sd = io.of("/stream-debate");

io.on("connection", async (socket) => {
    // let socketId = socket.id
    let currUserSocketId = socket.id;
    let userId = socket.handshake.auth.token;
    let meetingId = socket.handshake.auth.meetingId;
    await User.findByIdAndUpdate({ _id: userId.toString() }, { is_online: true, socket_id: socket.id, meetingRoom: meetingId });
    // console.log(socketId)
    // console.log(userId)

//  ------------------------------------- chats -------------------------------------

    socket.on("getOldChats", async (roomName) => {
        let chats = await Chat.find({roomName: roomName});
        socket.emit("getOldChats", chats);
    })

    socket.on("loadCurrentChat", (roomName, chat) => {
        socket.broadcast.to(roomName).emit("loadCurrentChat",chat);
    })

//  ------------------------------------- chats -------------------------------------    

    socket.on("getOnlineUser", async (userId) => {
        let updatedUser = await User.findById(userId)
        // console.log(updatedUser)
        socket.emit("getOnlineUser", updatedUser);  // correct this method
        socket.to(meetingId).emit("getOnlineUser", updatedUser);  // correct this method
    })


    socket.on("getConnectedUsers", async (roomName) => {
        // console.log(roomName);
        let meetingRoom = await Room.findOne({ meetingId: roomName }).populate("host")
        let host = meetingRoom.host;
        // console.log(host);
        let connectedUSer = await User.find({ meetingRoom: roomName });
        connectedUSer = connectedUSer.filter((user) => {
            return user._id.toString() != userId.toString();
        })
        connectedUSer = connectedUSer.filter((user) => {
            return user._id.toString() != host._id.toString();
        })

        socket.emit("connectedUser", connectedUSer, host);
    });

    // let rooms = io.sockets.adapter.rooms;
    socket.on("join", (roomName) => {
        // console.log("join");
        let rooms = io.sockets.adapter.rooms;
        // console.log(rooms)
        let room = rooms.get(roomName);
        // console.log(room)
        if (room == undefined) {
            socket.join(roomName);
        }
        else if (!room.has(currUserSocketId)) {
            // console.log(true)
            socket.join(roomName);
        }
        socket.emit("join");
        // room = rooms.get(roomName)
        // console.log(room)
        // console.log(rooms)
    })

    // socket.on("sdpProcess", (data) => {
    //     socket.to(data.to_connid).emit("sdpProcess",{
    //         message: data.message,
    //         from_connid: socket.id 
    //     })
    // })

    socket.on("ready", (roomName, socketId) => {
        // console.log("ready");
        // console.log(roomName)
        // let rooms = io.sockets.adapter.rooms;
        // console.log(rooms)
        // let room = rooms.get(roomName)
        // console.log(room)
        // console.log(socketId)
        socket.broadcast.to(roomName).emit("ready", socketId);
    })

    socket.on("candidate", (candidate, socketId) => {
        // console.log("candidate", socketId);
        // console.log(candidate)
        socket.to(socketId).emit("candidate", candidate);
        // socket.broadcast.to(socketId).emit("candidate", candidate);
    })

    socket.on("offer", (offer, socketId) => {
        // console.log("offer");
        // console.log(offer);
        socket.to(socketId).emit("offer", offer, currUserSocketId);
        // socket.broadcast.to(socketId).emit("offer", offer, socketId);
    })

    socket.on("answer", (answer, socketId) => {
        // console.log("answer");
        socket.to(socketId).emit("answer", answer);
        // socket.broadcast.to(socketId).emit("answer", answer, socketId);
    })

    socket.on('disconnect', async () => {
        let userId = socket.handshake.auth.token;
        await User.findByIdAndUpdate({ _id: userId }, { is_online: false, socket_id: "", meetingRoom: "" });
        socket.to(meetingId).emit("getOfflineUser", userId); // correct this method
    });
})

app.use((req, res, next) => {
    res.cookie('user', JSON.stringify(req.user));
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// http://localhost:8080/rooms/meeting?meetingId=91422581

app.get("/", async (req, res, next) => {
    res.render("chase.ejs");
});

app.get("/main", isLoggedIn, isVerified, async (req, res, next) => {
    let rooms = await Room.find({ isOver: false }).populate("host");
    rooms = rooms.reverse()
    // console.log(rooms);
    // console.log(req);
    // res.render("rooms/index.ejs", { rooms });
    res.render("home.ejs", { rooms });
});

// using routes
app.use("/users", userRouter);
app.use("/rooms", roomRouter);

server.listen(process.env.PORT || 8080, () => {
    console.log("listening to post 8080");
});