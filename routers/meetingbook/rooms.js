// Handles all room-related API routes using Universal Generic Resource System
const express = require('express');
const router = express.Router();
const { dbHots } = require('../../config/db');

router.get('/', async (req, res) => {
    try {
        const [rows] = await dbHots.promise().query(`
            SELECT 
                id, 
                resource_key, 
                resource_label AS room_name,
                attributes
            FROM resource_m_data 
            WHERE resource_category = 'meeting_room' 
            AND is_active = 1
        `);

        // Parse attributes and format for frontend compatibility
        const formattedData = rows.map(row => {
            let attrs = {};
            try {
                attrs = typeof row.attributes === 'string' ? JSON.parse(row.attributes) : (row.attributes || {});
            } catch (e) {
                console.error("Error parsing attributes for room:", row.resource_key);
            }

            return {
                id: row.id,
                room_name: row.room_name,
                resource_key: row.resource_key,
                ...attrs
            };
        });

        res.status(200).json({
            success: true,
            data: formattedData,
            message: "Meeting Rooms list retrieved successfully"
        });
    } catch (err) {
        console.error(`Error getting Meeting Rooms list: ${err.message}`);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

module.exports = router;