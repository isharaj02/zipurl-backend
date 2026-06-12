const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const {
  createShortUrl,
  redirectToOriginalUrl,
} = require("../controllers/url.controller");

router.post("/", authMiddleware, createShortUrl);
router.get("/:shortCode", redirectToOriginalUrl);
module.exports = router;