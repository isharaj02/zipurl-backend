require("dotenv").config();

const app = require("./app");
const pool = require("./db/pool");

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await pool.query("SELECT NOW()");

    console.log("Database Connected");

    app.listen(PORT, () => {
      console.log(`Server Running On Port ${PORT}`);
    });
  } catch (error) {
    console.error("Startup Error:");
    console.error(error);
    process.exit(1);
  }
}

startServer();