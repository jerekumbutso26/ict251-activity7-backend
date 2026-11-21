require("dotenv").config();
const fs = require("fs");
const pool = require("./db");

async function initDB() {
  try {
    const schema = fs.readFileSync("schema.sql", "utf8");
    const seed = fs.readFileSync("seed.sql", "utf8");
    await pool.query(schema);
    await pool.query(seed);
    console.log("Database initialized and seeded successfully!");
  } catch (err) {
    console.error("Database setup error:", err.message);
  } finally {
    await pool.end();
  }
}

initDB();