require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");
const recordsRouter = require("./routes/records");

const app = express();

// Configure CORS
const origins = (process.env.CLIENT_ORIGINS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

app.use(cors({
  origin: origins.length > 0 ? origins : "*"
}));

app.use(express.json());

// GET / — HTML API Guide for the marker
app.get("/", (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  res.status(200).send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Campus Maintenance Requests API Guide</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 850px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; color: #1f2937; }
    h1, h2 { color: #1456a0; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { border: 1px solid #d1d5db; padding: 0.6rem; text-align: left; }
    th { background: #f3f4f6; }
    pre { background: #f3f4f6; padding: 1rem; border-radius: 6px; overflow-x: auto; }
    .note { background: #eff6ff; border-left: 4px solid #1456a0; padding: 0.75rem 1rem; }
  </style>
</head>
<body>
  <h1>Campus Maintenance Requests — REST API Guide</h1>
  <p><strong>Student Name:</strong> Kumbutso Jere | <strong>Student Number:</strong> 2020507764</p>
  <p><strong>System Description:</strong> Backend API for recording and managing campus facility maintenance requests (broken lights, plumbing leaks, and damaged furniture).</p>
  <p><strong>Live API Base URL:</strong> <code>${baseUrl}</code></p>
  <p>Quick Links: <a href="/health">/health</a> | <a href="/api/records">/api/records</a></p>

  <div class="note">
    <strong>Hosting Note:</strong> Hosted on a Render free instance. If the service has been idle, the first request may take 30–50 seconds to wake up.
  </div>

  <h2>Required Routes</h2>
  <table>
    <thead>
      <tr><th>Method</th><th>Route</th><th>Purpose</th></tr>
    </thead>
    <tbody>
      <tr><td>GET</td><td>/</td><td>Show this API documentation guide</td></tr>
      <tr><td>GET</td><td>/health</td><td>Verify server and PostgreSQL database connectivity</td></tr>
      <tr><td>GET</td><td>/api/records</td><td>Retrieve all maintenance records</td></tr>
      <tr><td>GET</td><td>/api/records/:id</td><td>Retrieve a single record by positive integer ID</td></tr>
      <tr><td>POST</td><td>/api/records</td><td>Create a new maintenance record</td></tr>
      <tr><td>PUT</td><td>/api/records/:id</td><td>Update all four editable fields of an existing record</td></tr>
      <tr><td>DELETE</td><td>/api/records/:id</td><td>Delete a maintenance record by ID</td></tr>
    </tbody>
  </table>

  <h2>Record Fields &amp; Validation Rules</h2>
  <ul>
    <li><strong>title:</strong> String, 3 to 80 characters (trimmed)</li>
    <li><strong>category:</strong> String, 2 to 40 characters (trimmed)</li>
    <li><strong>description:</strong> String, 5 to 300 characters (trimmed)</li>
    <li><strong>status:</strong> Must be exactly one of: <code>Pending</code>, <code>In progress</code>, or <code>Completed</code></li>
  </ul>

  <h2>Valid POST / PUT JSON Body Example</h2>
  <pre>{
  "title": "Broken classroom light",
  "category": "Electrical",
  "description": "The light in Room B12 does not switch on.",
  "status": "Pending"
}</pre>

  <h2>Expected HTTP Status Codes</h2>
  <ul>
    <li><strong>200 OK:</strong> Successful GET, PUT, or DELETE request</li>
    <li><strong>201 Created:</strong> Successful POST request returning the newly created record</li>
    <li><strong>400 Bad Request:</strong> Invalid field lengths, unknown status, non-positive ID, or malformed JSON</li>
    <li><strong>404 Not Found:</strong> Record ID or API route does not exist</li>
    <li><strong>500 / 503:</strong> Unexpected server or database connection error</li>
  </ul>
</body>
</html>`);
});

// GET /health — Server and database health check
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Health check failed:", error.message);
    res.status(503).json({ status: "error", message: "Database connection failed." });
  }
});

// Mount records router
app.use("/api/records", recordsRouter);

// Catch-all 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// Global error middleware (handles malformed JSON as 400 and unexpected errors as 500)
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ message: "Malformed JSON in request body." });
  }
  console.error("Server error:", error);
  res.status(500).json({ message: "An unexpected server failure occurred." });
});

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});