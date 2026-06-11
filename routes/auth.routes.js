const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const { registerUser, login, profile } = require("../controllers/auth.controller");
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", login);
router.get("/profile", authMiddleware, profile);
module.exports = router;