// Handles all room-related API routes

const express = require('express');
const router = express.Router();
const { dbmeetingbook } = require('../../config/db');;


router.get('/', async (req, res) => {
    try {
        const [rows] = await dbmeetingbook.query('SELECT id, room_name FROM rooms');
        res.json(rows); // [{ id: 1, name: "Anzpac" }, ...]
    } catch (err) {
        console.log("Error fetching rooms:", err);
        res.status(500).json({ error: "Failed to fetch rooms" });
    }
});

module.exports = router;