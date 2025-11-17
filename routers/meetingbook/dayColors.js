const express = require('express');
const router = express.Router();
const { dbmeetingbook } = require('../../config/db');

// GET all day colors
router.get('/', async (req, res) => {
  try {
    const [rows] = await dbmeetingbook.query("SELECT * FROM day_colors");
    const colorMap = {};
    rows.forEach(row => {
      colorMap[row.day_idx] = row.hex_color;
    });
    res.json(colorMap);
  } catch (err) {
    console.error("Failed to fetch day colors:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// PUT single day color
router.put('/:dayIdx', async (req, res) => {
  const { dayIdx } = req.params;
  const { hex_color } = req.body;

  if (!/^#[0-9A-Fa-f]{6}$/.test(hex_color)) {
    return res.status(400).json({ error: "Invalid color format" });
  }

  try {
    await dbmeetingbook.query("REPLACE INTO day_colors (day_idx, hex_color) VALUES (?, ?)", [dayIdx, hex_color]);
    res.status(200).json({ message: "Color updated" });
  } catch (err) {
    console.error("Failed to update color:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

module.exports = router;
