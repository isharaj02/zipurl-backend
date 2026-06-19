const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const {
  loginLimiter,
  registerLimiter
} = require("../middleware/rateLimitMiddleware");
const { registerUser, login, profile } = require("../controllers/auth.controller");
const router = express.Router();

router.post("/register", registerLimiter, registerUser);
router.post("/login", loginLimiter, login);
router.get("/profile", authMiddleware, profile);
module.exports = router;