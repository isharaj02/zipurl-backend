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
  const { shortCode } = req.params;

  const query = `
    SELECT original_url
    FROM urls
    WHERE short_code = $1
  `;

  const values = [shortCode];

  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: "Short URL not found",
    });
  }

    const originalUrl = result.rows[0].original_url;
    return res.redirect(originalUrl);
};