const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const { loginLimiter, registerLimiter } = require("../middleware/rateLimitMiddleware");
const { registerUser, login, profile } = require("../controllers/auth.controller");
const router = express.Router();

/**
 * @swagger
 * tags:
 * name: Auth
 * description: User authentication and management endpoints
 */

/**
 * @swagger
 * /auth/register:
 * post:
 * summary: Register a new user
 * tags: [Auth]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - email
 * - password
 * properties:
 * email:
 * type: string
 * format: email
 * example: dev@example.com
 * password:
 * type: string
 * minLength: 6
 * example: strongpassword123
 * responses:
 * 201:
 * description: User successfully registered
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
 * example: "User registered successfully"
 * data:
 * type: object
 * properties:
 * id:
 * type: integer
 * example: 1
 * email:
 * type: string
 * example: dev@example.com
 * 400:
 * description: Validation error or Email already exists
 * 500:
 * description: Internal server error
 */
router.post("/register", registerLimiter, registerUser);

/**
 * @swagger
 * /auth/login:
 * post:
 * summary: Authenticate user and receive token
 * tags: [Auth]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - email
 * - password
 * properties:
 * email:
 * type: string
 * format: email
 * example: dev@example.com
 * password:
 * type: string
 * example: strongpassword123
 * responses:
 * 200:
 * description: Login successful
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
 * example: "Login successful"
 * data:
 * type: object
 * properties:
 * token:
 * type: string
 * example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * 401:
 * description: Invalid credentials
 * 500:
 * description: Internal server error
 */
router.post("/login", loginLimiter, login);

/**
 * @swagger
 * /auth/profile:
 * get:
 * summary: Retrieve current authenticated user profile
 * tags: [Auth]
 * security:
 * - BearerAuth: []
 * responses:
 * 200:
 * description: Profile retrieved successfully
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
 * example: "Profile data fetched"
 * data:
 * type: object
 * properties:
 * id:
 * type: integer
 * example: 1
 * email:
 * type: string
 * example: dev@example.com
 * 401:
 * description: Unauthorized access
 * 500:
 * description: Internal server error
 */
router.get("/profile", authMiddleware, profile);

module.exports = router;