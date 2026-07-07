const express = require("express");
const cors = require("cors");
const { swaggerUi, swaggerSpec } = require("./config/swagger");

const authRoutes = require("./routes/auth.routes");
const urlRoutes = require("./routes/url.routes");
const app = express();
app.set("trust proxy", 1);

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5000',   
  'https://zipurl-backend-v8v2.onrender.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/auth", authRoutes);
app.use("/urls", urlRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ZipUrl API Running",
  });
});

module.exports = app;