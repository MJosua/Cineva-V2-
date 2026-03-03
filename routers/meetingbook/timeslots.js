// Handle all timeslot-related routes

const express = require('express');
const router = express.Router();
const { dbmeetingbook } = require('../../config/db');;


router.get('/', async (req, res) => {
  try {
    const rows = await dbmeetingbook.query('SELECT * FROM time_map');
    res.send(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get rooms' });
  }
});

module.exports = router;
