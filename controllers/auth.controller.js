const bcrypt = require("bcrypt");
const pool = require("../db/pool");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({
        success: false,
        message: "All fields are required"
    });
    }

    if (password.length < 6) {
        return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
    });
    }

    const existingUser = await pool.query(
        `
        SELECT id
        FROM users
        WHERE email = $1
        `,
        [email]
    );

    if (existingUser.rows.length > 0) {
        return res.status(409).json({
        success: false,
        message: "Email already registered"
    });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
        `
        INSERT INTO users
        (name, email, password_hash)
        VALUES
        ($1, $2, $3)
        RETURNING id, name, email
        `,
        [name, email, hashedPassword]
    );

    return res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: newUser.rows[0]
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const result = await pool.query(
      `SELECT id, name, email, password_hash
      FROM users
      WHERE email = $1`,
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const user = result.rows[0];

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token
      }
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const profile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await pool.query(
      `SELECT id, name, email
      FROM users
      WHERE id = $1`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

module.exports = {
  registerUser,
  login,
  profile
};