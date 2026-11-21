const router = require("express").Router();
const pool = require("../db");

const VALID_STATUSES = ["Pending", "In progress", "Completed"];

// Helper to validate positive whole number ID
function parsePositiveInt(value) {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0 || String(num) !== String(value).trim()) {
    return null;
  }
  return num;
}

// Helper to validate POST and PUT request bodies
function validateRecordBody(body) {
  if (!body || typeof body !== "object") {
    return { error: "Request body must be a valid JSON object." };
  }

  const { title, category, description, status } = body;

  if (typeof title !== "string") {
    return { error: "Title is required and must be text." };
  }
  if (typeof category !== "string") {
    return { error: "Category is required and must be text." };
  }
  if (typeof description !== "string") {
    return { error: "Description is required and must be text." };
  }
  if (typeof status !== "string") {
    return { error: "Status is required and must be text." };
  }

  const cleanTitle = title.trim();
  const cleanCategory = category.trim();
  const cleanDescription = description.trim();
  const cleanStatus = status.trim();

  if (cleanTitle.length < 3 || cleanTitle.length > 80) {
    return { error: "Title must have 3 to 80 characters." };
  }
  if (cleanCategory.length < 2 || cleanCategory.length > 40) {
    return { error: "Category must have 2 to 40 characters." };
  }
  if (cleanDescription.length < 5 || cleanDescription.length > 300) {
    return { error: "Description must have 5 to 300 characters." };
  }
  if (!VALID_STATUSES.includes(cleanStatus)) {
    return { error: "Status must be one of: Pending, In progress, Completed." };
  }

  return {
    data: {
      title: cleanTitle,
      category: cleanCategory,
      description: cleanDescription,
      status: cleanStatus
    }
  };
}

// GET /api/records — Read all records
router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT id, title, category, description, status FROM records ORDER BY id"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
});

// GET /api/records/:id — Read one record
router.get("/:id", async (req, res, next) => {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Record ID must be a positive whole number." });
    }

    const result = await pool.query(
      "SELECT id, title, category, description, status FROM records WHERE id = $1",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: `Record with id ${id} not found.` });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// POST /api/records — Create a record
router.post("/", async (req, res, next) => {
  try {
    const { error, data } = validateRecordBody(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const result = await pool.query(
      "INSERT INTO records (title, category, description, status) VALUES ($1, $2, $3, $4) RETURNING id, title, category, description, status",
      [data.title, data.category, data.description, data.status]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// PUT /api/records/:id — Update a record
router.put("/:id", async (req, res, next) => {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Record ID must be a positive whole number." });
    }

    const { error, data } = validateRecordBody(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const result = await pool.query(
      "UPDATE records SET title = $1, category = $2, description = $3, status = $4 WHERE id = $5 RETURNING id, title, category, description, status",
      [data.title, data.category, data.description, data.status, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: `Record with id ${id} not found.` });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/records/:id — Delete a record
router.delete("/:id", async (req, res, next) => {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Record ID must be a positive whole number." });
    }

    const result = await pool.query(
      "DELETE FROM records WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: `Record with id ${id} not found.` });
    }

    res.status(200).json({ message: "Record deleted." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;