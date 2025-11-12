// Handles all room-related API routes

const express = require('express');
const router = express.Router();
const { dbmeetingbook } = require('../../config/db');;


router.get('/', async (req, res) => {
    try {
        const [rows] = await dbmeetingbook.query('SELECT id, room_name FROM rooms');
        console.log("trying to get all rooms")
        res.status(200).json({
            success: true,
            data: rows,
            message: "Meeting Rooms list retrieved successfully"
        });
    } catch (err) {
        console.error(`Error getting Meeting Rooms list: ${err.message} at ${timestamp}`);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

module.exports = router;