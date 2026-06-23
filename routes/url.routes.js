/**
 * @swagger
 * tags:
 *   - name: URLs
 *     description: URL shortening and management APIs
 *   - name: Analytics
 *     description: Click tracking and analytics APIs
 */

/**
 * @swagger
 * /urls:
 *   post:
 *     summary: Create a shortened URL
 *     tags:
 *       - URLs
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - originalUrl
 *             properties:
 *               originalUrl:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com/very-long-url
 *               customCode:
 *                 type: string
 *                 example: mycode123
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-12-31T23:59:59.000Z
 *     responses:
 *       201:
 *         description: Short URL created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /urls/my:
 *   get:
 *     summary: Get all URLs of logged-in user
 *     tags:
 *       - URLs
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: URLs fetched successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /urls/{id}/analytics:
 *   get:
 *     summary: Get URL analytics data
 *     tags:
 *       - Analytics
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Analytics fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: URL not found
 */

/**
 * @swagger
 * /urls/{id}:
 *   delete:
 *     summary: Soft delete a URL
 *     tags:
 *       - URLs
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: URL deleted successfully
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /urls/{id}/restore:
 *   patch:
 *     summary: Restore deleted URL
 *     tags:
 *       - URLs
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: URL restored successfully
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /urls/{shortCode}:
 *   get:
 *     summary: Redirect to original URL
 *     tags:
 *       - URLs
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirect to original URL
 *       404:
 *         description: URL not found
 *       410:
 *         description: URL expired
 */

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
const { createUrlLimiter, redirectLimiter } = require("../middleware/rateLimitMiddleware");


router.post("/", createUrlLimiter, authMiddleware, createShortUrl);

router.get("/my", authMiddleware, getMyUrls);

router.get("/:id/analytics", authMiddleware, getUrlAnalytics);

router.delete("/:id", authMiddleware, deleteUrl);

router.patch("/:id/restore", authMiddleware, restoreUrl);

router.get("/:shortCode", redirectLimiter, redirectToOriginalUrl);

module.exports = router;