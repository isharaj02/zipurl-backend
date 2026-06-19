const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const {
  createShortUrl,
  redirectToOriginalUrl,
  getMyUrls,
  getUrlAnalytics,
  deleteUrl,
  restoreUrl
} = require("../controllers/url.controller");

const {
  createUrlLimiter,
  redirectLimiter
} = require("../middleware/rateLimitMiddleware");

router.post("/", createUrlLimiter, authMiddleware, createShortUrl);
router.get("/my", authMiddleware, getMyUrls);
router.get(
  "/:id/analytics",
  authMiddleware,
  getUrlAnalytics
);
router.delete("/:id", authMiddleware, deleteUrl);
router.get("/:shortCode", redirectLimiter,redirectToOriginalUrl);
router.patch("/:id/restore", authMiddleware, restoreUrl);

module.exports = router;