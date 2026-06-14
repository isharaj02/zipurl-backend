const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const {
  createShortUrl,
  redirectToOriginalUrl,
  getMyUrls,
  getUrlAnalytics,
  deleteUrl,
} = require("../controllers/url.controller");

router.post("/", authMiddleware, createShortUrl);
router.get("/my", authMiddleware, getMyUrls);
router.get(
  "/:id/analytics",
  authMiddleware,
  getUrlAnalytics
);
router.delete("/:id", authMiddleware, deleteUrl);
router.get("/:shortCode", redirectToOriginalUrl);

module.exports = router;