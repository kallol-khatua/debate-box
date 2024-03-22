const User = require("../models/user");

module.exports.isLoggedIn = (req, res, next) => {
    if(req.user) {
        return next();
    }
    res.redirect("/users/signin");
};

module.exports.isVerified = async (req, res, next) => {
    let user = await User.findOne({_id: String(req.user._id)});
    if(user.isVerified) {   
        return next();
    }
    res.redirect("/users/otpVerification");
};