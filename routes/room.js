const express = require("express");
const router = express.Router();
const roomController  = require("../controllers/roomController");
const { isLoggedIn, isVerified } = require("../utils/middlewares");

router.post("/hostMeeting", isLoggedIn, isVerified, roomController.hostMeeting);
router.get("/meeting", isLoggedIn, isVerified, roomController.meeting);
router.post("/chats/saveChat", isLoggedIn, isVerified, roomController.saveChat);

module.exports = router;