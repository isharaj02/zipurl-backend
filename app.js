const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ZipUrl API Running",
  });
});

module.exports = app;