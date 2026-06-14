const pool = require("../db/pool");

function generateShortCode() {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let shortCode = "";

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(
      Math.random() * characters.length
    );

    shortCode += characters[randomIndex];
  }

  return shortCode;
}

exports.createShortUrl = async (req, res) => {
  const userId = req.user.userId;

  const { originalUrl } = req.body;

  if (!originalUrl) {
    return res.status(400).json({
      success: false,
      message: "Original URL is required",
    });
  }
  const shortCode = generateShortCode();

  try{
    const query = `
        INSERT INTO urls (
            user_id,
            original_url,
            short_code
        )
        VALUES ($1, $2, $3)
        RETURNING id, short_code;
        `;
  } catch(error){
    console.error(error);
    return res.status(500).json({
        success: false,
        message: "Internal server error",
    });
  }

    const values = [
        userId,
        originalUrl,
        shortCode,
    ];
    const result = await pool.query(query, values);

  res.status(201).json({
    success: true,
    message: "Short URL generated",
    data: {
      shortCode: result.rows[0].short_code,
    },
  });
};

exports.redirectToOriginalUrl = async (req, res) => {
  try{
  const { shortCode } = req.params;

  const query = `
    SELECT id, original_url
    FROM urls
    WHERE short_code = $1 AND deleted_at IS NULL
  `;

  const values = [shortCode];

  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: "Short URL not found",
    });
  }
    const urlId = result.rows[0].id;
    const originalUrl = result.rows[0].original_url;
    await pool.query(
      `
        INSERT INTO click_events (url_id)
        VALUES ($1)
      `,
      [urlId]
    );

    await pool.query(
      `
      UPDATE urls
      SET click_count = click_count + 1
      WHERE id = $1
      `,
      [urlId]
    );
    return res.redirect(originalUrl);
  } catch(error){
      console.error("Redirect Error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
};


exports.getMyUrls = async (req, res) => {
  try {
    const userId = req.user.userId;

    const query = `
      SELECT
        id,
        original_url,
        short_code,
        click_count,
        created_at
      FROM urls
      WHERE user_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [userId]);

    return res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get My URLs Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


exports.getUrlAnalytics = async (req, res) => {
  try {
    const userId = req.user.userId;
    const urlId = req.params.id;

    const ownershipQuery = `
      SELECT user_id
      FROM urls
      WHERE id = $1 AND deleted_at IS NULL
    `;

    const ownershipResult = await pool.query(
      ownershipQuery,
      [urlId]
    );

    if (ownershipResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "URL not found",
      });
    }

    const ownerId = ownershipResult.rows[0].user_id;
    if (ownerId !== userId){
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const analyticsQuery = `
      SELECT
        id,
        original_url,
        short_code,
        click_count,
        created_at
      FROM urls
      WHERE id = $1
    `;

    const analyticsResult = await pool.query(
      analyticsQuery,
      [urlId]
    );

    return res.status(200).json({
      success: true,
      data: analyticsResult.rows[0],
    });

  } catch (error) {
    console.error("Get Analytics Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


exports.deleteUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT id, user_id
      FROM urls
      WHERE id = $1;
      `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "URL not found"
      });
    }

    const url = result.rows[0];

    if (url.user_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden"
      });
    }

    const deleteQuery = `
      UPDATE urls
      SET deleted_at = NOW()
      WHERE id = $1;
    `;
    await pool.query(deleteQuery, [id]);

    return res.status(200).json({
      success: true,
      message: "URL deleted successfully"
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};