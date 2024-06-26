const User = require("../models/user");
const otpGenerator = require('generate-otp-by-size');
const mailSender = require("../utils/mail");
const Room = require("../models/room");
const Member = require("../models/member");
const cloudinary = require('cloudinary').v2;

module.exports.renderSignup = (req, res, next) => {
    res.render("users/signup.ejs");
};

module.exports.signup = async (req, res, next) => {
    try {
        // console.log("working")
        let { username, email, password } = req.body;

        let otp = otpGenerator.generateOTP(4);

        // register a new user
        let newUser = new User({ username, email, otp });
        const registeredUser = await User.register(newUser, password);
        // console.log(username, email, otp);
        // sending email to the email given by the user along with otp
        let name = process.env.EMAIL_USER_NAME;
        let user = process.env.EMAIL_USER;
        let pass = process.env.EMAIL_PASS;
        await mailSender(name, user, pass, email, otp);

        // auto login after successfull signup
        req.login(registeredUser, (err) => {
            if (err) {
                return next(err);
            }
            req.flash("success", "Signup successfull");
            res.cookie('user', JSON.stringify(req.user));
            return res.redirect("/users/otpVerification");
        })
    } catch (error) {
        console.log(error);
        if (error.code === 11000 && error.keyPattern && error.keyPattern.email === 1) {
            req.flash('error', 'Email address is already in use.');
            // console.log(error.code);
            // console.log(error.keyPattern);
            // console.log(error.keyPattern.email);
            // console.log("Email address is already in use.");
            return res.status(400).redirect("/users/signin");
        } else if (error.message == " A user with the given username is already registered") {
            // Handle username taken error
            // Handle other errors
            // console.log(error.message);
            req.flash("error", error.message);
            return res.status(400).redirect("/users/signup");
        } else {
            // console.log(error.message);
            req.flash("error", error.message);
            return res.status(500).redirect("/users/signup");
        }
    }
};

module.exports.renderSignin = (req, res, next) => {
    try {
        if (req.user) {
            req.logout((err) => {
                if (err) {
                    return next(err);
                }
                req.flash("success", "You logged out successfully");
                return res.render("users/signin.ejs");
            });
        } else {
            return res.render("users/signin.ejs");
        }
    } catch (err) {
        return next(err);
    }

};

module.exports.signin = (req, res, next) => {
    res.cookie('user', JSON.stringify(req.user));
    req.flash("success", "Login successfull");
    res.redirect("/main");
};

module.exports.logout = (req, res, next) => {
    try {
        if (req.user) {
            req.logout((err) => {
                if (err) {
                    return next(err);
                }
                req.flash("success", "You logged out successfully");
                return res.redirect("/");
            });
        } else {
            return res.redirect("/");
        }
    } catch (err) {
        return next(err);
    }
}

module.exports.otpVerification = (req, res) => {
    res.render("users/otpVerification");
};

module.exports.verifyOtp = async (req, res) => {
    const otpArray = req.body.otp;
    const joinedString = otpArray.join('');
    const resultNumber = parseInt(joinedString, 10);

    let user = await User.findOne({ _id: String(req.user._id) });

    // when user already verified return to the main page
    if (user.isVerified) {
        return res.redirect("/main");
    }

    // if correct otp entered then update isVerified = true
    if (resultNumber == user.otp) {
        user.isVerified = true;
        await user.save();
    } else {
        return res.redirect("/users/otpVerification");
    }

    res.redirect("/main");
};

module.exports.showProfile = async (req, res) => {
    let user = await User.findById(req.params.id);
    let ongoingMeet = await Room.findOne({ host: req.params.id, isOver: false });
    let completedMeet = await Room.find({ host: req.params.id, isOver: true });
    let joinedMeet = await Member.find({ memberId: req.params.id }).populate("roomId").populate({
        path: 'host',
        populate: {
            path: 'profile_image'
        }
    });
    return res.render("users/dashboard.ejs", { user, ongoingMeet, completedMeet, joinedMeet });
};

module.exports.updateProfile = async (req, res, next) => {
    let user = req.user;
    if (user.profile_image.filename && req.file) {
        await cloudinary.uploader.destroy(user.profile_image.filename);
    }
    if (req.file) {
        user.profile_image.filename = req.file.filename;
        user.profile_image.url = req.file.path;
        await user.save();
    }
    res.redirect(`./profile/${user._id}`);
}

module.exports.editinfo = async (req, res, next) => {
    try {
        let { username, bio } = req.body;
        await User.findOneAndUpdate({ _id: req.user._id }, { username: username, bio: bio });
        let user = await User.findById(req.user._id);
        req.login(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.redirect(`./profile/${user._id}`);
        })
    } catch (err) {
        return next(err);
    }
}

module.exports.savedebate = async (req, res, next) => {
    try {
        // Handle the like logic here, for example, update a database
        const { roomId } = req.body;
        let room = await Room.findById(roomId);

        // Perform database update or other actions here
        // -----------------------------------------------------------------------
        if (room.savefor.includes(req.user._id)) {
            return res.status(200).json({ success: false, message: 'already saved' });
        }

        if (String(room.host) == String(req.user._id)) {
            return res.status(200).json({ success: false, message: 'you are the host' });
        }

        room.savefor.push(req.user);
        await room.save();
        // req.flash("success", "Response send"); 

        // -----------------------------------------------------------------------

        // Send a response to the client
        res.status(200).json({ success: true, message: 'debate saved' });
    } catch (err) {
        return next(err);
    }
}

module.exports.unsavedebate = async (req, res, next) => {
    try {
        // Handle the like logic here, for example, update a database
        const { roomId } = req.body;
        let room = await Room.findById(roomId);
        
        // Perform database update or other actions here
        // -----------------------------------------------------------------------
        if (room.savefor.includes(req.user._id)) {
            var index = room.savefor.indexOf(req.user._id); 
            if (index > -1) {
                room.savefor.splice(index, 1); 
            }
            
            await room.save();
            return res.status(200).json({ success: true, message: 'unsaved' });

        }

        // -----------------------------------------------------------------------

        // Send a response to the client
        res.status(200).json({ success: false, message: 'saved first' });
    } catch (err) {
        return next(err);
    }
}

module.exports.bookmark = async (req, res, next) => {
    try {
        let rooms = await Room.find({});
        // room.savefor.includes(req.user._id)
        // console.log(rooms)
        // for(room of rooms){
        //     console.log(room);
        //     console.log(room.savefor.includes(req.user._id))
        // }
        rooms = rooms.filter(room => {
            return room.savefor.includes(req.user._id);
        })
        // console.log(rooms)
        if(rooms && rooms.length > 0) {
            res.status(200).json({ success: true, message: 'rooms found', rooms: rooms });
        } else {
            res.status(200).json({ success: false, message: 'saved first' });
        }
    } catch (err) {
        return next(err);
    }
}