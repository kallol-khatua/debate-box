const express = require("express");
const router = express.Router();
const roomController  = require("../controllers/roomController");
const { isLoggedIn } = require("../utils/middlewares");

router.get("/hostMeeting", isLoggedIn, roomController.hostMeeting);
router.get("/joinMeeting", isLoggedIn, roomController.joinMeeting);
router.get("/meeting", isLoggedIn, roomController.meeting);
router.post("/chats/saveChat", isLoggedIn, roomController.saveChat);

module.exports = router;