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

  const { originalUrl, customCode, expiresAt } = req.body;

  if (!originalUrl) {
    return res.status(400).json({
      success: false,
      message: "Original URL is required",
    });
  }

  let normalizedUrl = originalUrl.trim();

  if (
    !normalizedUrl.startsWith("http://") &&
    !normalizedUrl.startsWith("https://")
  ) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  try {
    new URL(normalizedUrl);
  } catch {
    return res.status(400).json({
      success: false,
      message: "Invalid URL",
    });
  }

  if (expiresAt) {
    const expirationDate = new Date(expiresAt);

    if (isNaN(expirationDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid expiration date",
      });
    }

    if (expirationDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Expiration date must be in the future",
      });
    }
  }
  
  let customCodeUnavailable = false;
  let shortCode;
  if (customCode) {

    const customCodeRegex = /^[a-zA-Z0-9_-]{3,30}$/;

    if (!customCodeRegex.test(customCode)) {
      return res.status(400).json({
        success: false,
        message:
          "Custom code must be 3-30 characters and contain only letters, numbers, hyphens, and underscores",
      });
    }

    const checkQuery = `
      SELECT id
      FROM urls
      WHERE short_code = $1;
    `;

    const checkResult = await pool.query(checkQuery, [customCode]);

    if (checkResult.rows.length > 0) {
      customCodeUnavailable = true;
      shortCode = generateShortCode();
    } 
    else {
      shortCode = customCode;
    }
  }

  if (!shortCode) {
    shortCode = generateShortCode();
  }

  try{
    const query = `
      INSERT INTO urls (
        user_id,
        original_url,
        short_code,
        expires_at
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id, short_code, expires_at;
    `;
      
    const values = [
      userId,
      normalizedUrl,
      shortCode,
      expiresAt || null,
    ];
    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: customCodeUnavailable
  ? "Custom code already used. Random short code generated."
  : "Short URL generated",
      data: {
        shortCode: result.rows[0].short_code,
      },
    });
  } catch(error){
    console.error("Create Short URL Error:", error);
    return res.status(500).json({
        success: false,
        message: "Internal server error",
    });
  }  
};

exports.redirectToOriginalUrl = async (req, res) => {
  try{
  const { shortCode } = req.params;

  const query = `
    SELECT id, original_url, expires_at
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
  const url = result.rows[0];
  const urlId = url.id;
  const originalUrl = url.original_url;
    if (
      url.expires_at &&
      new Date(url.expires_at) <= new Date()
    ) 
    {
      return res.status(410).json({
        success: false,
        message: "This URL has expired",
      });
    }
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
    const isApiRequest =
      req.query.api === "true" ||
      req.headers.accept?.includes("application/json");

    if (isApiRequest) {
      return res.json({
        success: true,
        message: "Redirect URL",
        data: { url: originalUrl }
      });
    }

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

    const page = parseInt(req.query.page ?? "1");
    const limit = parseInt(req.query.limit ?? "10");
    const search = req.query.search?.trim() || "";
    const status = req.query.status?.trim().toLowerCase() || ""; 
    const searchPattern = `%${search}%`;   

    const allowedStatuses = [
      "active",
      "expired",
      "deleted",
    ];

    if (
      status &&
      !allowedStatuses.includes(status)
    ) 
    {
      return res.status(400).json({
        success: false,
        message: "status must be active, expired, or deleted",
      });
    }     

    if (page < 1 || limit < 1) {
      return res.status(400).json({
        success: false,
        message: "page and limit must be positive integers",
      });
    }

    const offset = (page - 1) * limit;
    let statusCondition = "";
    if (status === "active") {
      statusCondition = `
        AND deleted_at IS NULL
        AND (
          expires_at IS NULL
          OR expires_at > NOW()
        )
      `;
    }
    if (status === "expired") {
      statusCondition = `
        AND deleted_at IS NULL
        AND expires_at IS NOT NULL
        AND expires_at <= NOW()
      `;
    } 
    if (status === "deleted") {
      statusCondition = `
        AND deleted_at IS NOT NULL
      `;
    } 

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM urls
      WHERE user_id = $1
        ${statusCondition}
        AND (
          original_url ILIKE $2
          OR short_code ILIKE $2
        )
    `;

    const countResult = await pool.query(countQuery, [userId, searchPattern]);

    const totalItems = parseInt(
      countResult.rows[0].total
    );
    const totalPages = Math.ceil(
      totalItems / limit
    );

    const query = `
      SELECT
        id,
        original_url,
        short_code,
        click_count,
        created_at, 
        expires_at,
        deleted_at
      FROM urls
      WHERE user_id = $1 
        ${statusCondition}
        AND (
          original_url ILIKE $2
          OR short_code ILIKE $2
        )
      ORDER BY created_at DESC
      LIMIT $3
      OFFSET $4;
    `;

    const result = await pool.query(query, [
      userId,
      searchPattern,
      limit,
      offset,
    ]);

    return res.status(200).json({
      success: true,
      pagination: {
        page, 
        limit,
        totalItems,
        totalPages,
      },
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
      WHERE id = $1
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
        created_at,
        expires_at,
        deleted_at
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
      SELECT id, user_id, deleted_at
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

    if (url.deleted_at !== null) {
      return res.status(400).json({
        success: false,
        message: "URL is already deleted",
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
    console.error("Delete URL Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


exports.restoreUrl = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const query = `
      SELECT id, user_id, deleted_at
      FROM urls
      WHERE id = $1;
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "URL not found",
      });
    }

    const url = result.rows[0];

    if (url.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (url.deleted_at === null) {
      return res.status(400).json({
        success: false,
        message: "URL is already active",
      });
    }

    const restoreQuery = `
      UPDATE urls
      SET deleted_at = NULL
      WHERE id = $1;
    `;

    await pool.query(restoreQuery, [id]);

    return res.status(200).json({
      success: true,
      message: "URL restored successfully",
    });

  } catch (error) {
    console.error("Restore URL Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};



exports.getDashboardOverview = async (req, res) => {
  try {
    const userId = req.user.userId;

    const statsQuery = `
      SELECT
        COUNT(*) AS total_urls,

        COUNT(*) FILTER (
          WHERE deleted_at IS NULL
          AND (
            expires_at IS NULL
            OR expires_at > NOW()
          )
        ) AS active_urls,

        COUNT(*) FILTER (
          WHERE deleted_at IS NULL
          AND expires_at IS NOT NULL
          AND expires_at <= NOW()
        ) AS expired_urls,

        COUNT(*) FILTER (
          WHERE deleted_at IS NOT NULL
        ) AS deleted_urls,

        COALESCE(SUM(click_count), 0) AS total_clicks

      FROM urls
      WHERE user_id = $1;
    `;

    const statsResult = await pool.query(statsQuery, [userId]);

    const recentUrlsQuery = `
      SELECT
        id,
        original_url,
        short_code,
        click_count,
        created_at,
        expires_at,
        deleted_at
      FROM urls
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 5;
    `;

    const recentUrlsResult = await pool.query(recentUrlsQuery, [userId]);

    return res.status(200).json({
      success: true,
      data: {
        totalUrls: Number(statsResult.rows[0].total_urls),
        activeUrls: Number(statsResult.rows[0].active_urls),
        expiredUrls: Number(statsResult.rows[0].expired_urls),
        deletedUrls: Number(statsResult.rows[0].deleted_urls),
        totalClicks: Number(statsResult.rows[0].total_clicks),
        recentUrls: recentUrlsResult.rows,
      },
    });
  } catch (error) {
    console.error("Dashboard Overview Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};