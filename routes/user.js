const express = require("express");
const router = express.Router();
const userController  = require("../controllers/userController");
const { isLoggedIn } = require("../utils/middlewares");
const passport = require("passport");

router.get("/signup", userController.renderSignup);
router.post("/signup", userController.signup);

router.get("/signin", userController.renderSignin);
router.post("/signin", passport.authenticate('local', { failureRedirect: '/users/signin', failureFlash: true }), userController.signin);

router.get("/logout", userController.logout);

router.get("/otpVerification", isLoggedIn, userController.otpVerification);
router.post("/otpVerification", isLoggedIn, userController.verifyOtp);

module.exports = router;