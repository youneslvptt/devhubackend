const express = require("express");
const router = express.Router();
const { register, login, getAllUsers } = require("../controllers/auth.controller");
const { createUser , getOnlineUsers , getStats } = require("../controllers/admin.controller");
const protect = require("../middleware/auth.middleware");
const { changePassword } = require("../controllers/auth.controller");


router.post("/register", register);
router.post("/login", login);
router.get("/users", protect, getAllUsers);
router.post("/create-user", protect, createUser);
router.post("/change-password", protect, changePassword);
router.get("/online-users", protect, getOnlineUsers);   
router.get("/stats", protect, getStats);    



module.exports = router;