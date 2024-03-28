const express = require("express");
const router = express.Router();
const userController  = require("../controllers/userController");
const { isLoggedIn } = require("../utils/middlewares");
const passport = require("passport");
const multer  = require('multer');
const {storage, cloudinary} = require("../cloudconfig.js");
const upload = multer({ storage });

router.get("/signup", userController.renderSignup);
router.post("/signup", userController.signup);

router.get("/signin", userController.renderSignin);
router.post("/signin", passport.authenticate('local', { failureRedirect: '/users/signin', failureFlash: true }), userController.signin);

router.get("/logout", userController.logout);

router.get("/otpVerification", isLoggedIn, userController.otpVerification);
router.post("/otpVerification", isLoggedIn, userController.verifyOtp);

// indivisual user profile page
router.get("/profile/:id", isLoggedIn, userController.showProfile);

// upload profile picture
router.post("/updateProfile", isLoggedIn, upload.single("image"), userController.updateProfile);

// edit user info (username, bio);
router.post("/edit", isLoggedIn, userController.editinfo);

// save a debate for reference
router.post("/savedebate", isLoggedIn, userController.savedebate);

module.exports = router;