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

/**
 * @swagger
 * tags:
 * - name: URLs
 * description: Core short URL generation and management
 * - name: Analytics
 * description: Traffic and click insights tracking
 */

/**
 * @swagger
 * /urls:
 * post:
 * summary: Create a shortened URL
 * tags: [URLs]
 * security:
 * - BearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - originalUrl
 * properties:
 * originalUrl:
 * type: string
 * format: uri
 * example: "https://example.com/very-long-article-path"
 * customCode:
 * type: string
 * example: "mycustom"
 * expiresAt:
 * type: string
 * format: date-time
 * example: "2026-12-31T23:59:59.000Z"
 * responses:
 * 201:
 * description: Short URL created successfully
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * success:
 * type: boolean
 * example: true
 * message:
 * type: string
 * example: "Short URL created successfully"
 * data:
 * type: object
 * properties:
 * id:
 * type: integer
 * example: 42
 * originalUrl:
 * type: string
 * example: "https://example.com/very-long-article-path"
 * shortCode:
 * type: string
 * example: "mycustom"
 * shortUrl:
 * type: string
 * example: "https://zipurl-backend-v8v2.onrender.com/urls/mycustom"
 * 400:
 * description: Validation error
 * 401:
 * description: Unauthorized
 * 500:
 * description: Internal server error
 */
router.post("/", createUrlLimiter, authMiddleware, createShortUrl);

/**
 * @swagger
 * /urls/my:
 * get:
 * summary: Retrieve current user's short URLs
 * tags: [URLs]
 * security:
 * - BearerAuth: []
 * parameters:
 * - in: query
 * name: page
 * schema:
 * type: integer
 * default: 1
 * - in: query
 * name: limit
 * schema:
 * type: integer
 * default: 10
 * - in: query
 * name: search
 * schema:
 * type: string
 * responses:
 * 200:
 * description: Collection of user links retrieved
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * success:
 * type: boolean
 * example: true
 * 401:
 * description: Unauthorized
 * 500:
 * description: Internal server error
 */
router.get("/my", authMiddleware, getMyUrls);

/**
 * @swagger
 * /urls/{id}/analytics:
 * get:
 * summary: Retrieve total metrics and clicks breakdown
 * tags: [Analytics]
 * security:
 * - BearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * responses:
 * 200:
 * description: Analytical data compiled
 * 401:
 * description: Unauthorized
 * 404:
 * description: Not found
 */
router.get("/:id/analytics", authMiddleware, getUrlAnalytics);

/**
 * @swagger
 * /urls/{id}:
 * delete:
 * summary: Soft delete an existing short URL
 * tags: [URLs]
 * security:
 * - BearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * responses:
 * 200:
 * description: URL marked as soft deleted
 * 401:
 * description: Unauthorized
 */
router.delete("/:id", authMiddleware, deleteUrl);

/**
 * @swagger
 * /urls/{id}/restore:
 * patch:
 * summary: Restore a previously soft-deleted URL record
 * tags: [URLs]
 * security:
 * - BearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * responses:
 * 200:
 * description: URL restored successfully
 * 401:
 * description: Unauthorized
 */
router.patch("/:id/restore", authMiddleware, restoreUrl);

/**
 * @swagger
 * /urls/{shortCode}:
 * get:
 * summary: Public short URL redirection endpoint
 * tags: [URLs]
 * parameters:
 * - in: path
 * name: shortCode
 * required: true
 * schema:
 * type: string
 * responses:
 * 302:
 * description: Redirecting client to destination
 * 404:
 * description: Short URL record not found
 * 410:
 * description: URL has expired
 */
router.get("/:shortCode", redirectLimiter, redirectToOriginalUrl);

module.exports = router;