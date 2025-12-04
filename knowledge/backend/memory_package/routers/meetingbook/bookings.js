// Handles all booking-related API calls

const express = require('express');
const router = express.Router();
const { dbmeetingbook } = require('../../config/db');


// GET all bookings
router.get('/', async (req, res) => {
    try {
        const [rows] = await dbmeetingbook.query(`SELECT 
            id,
            name,
            user_id,
            room_id,
            time_id,
            purpose,
            DATE_FORMAT(date, '%Y-%m-%d') AS date
            FROM bookings;
`);
        res.send(rows);
    } catch (err) {
        console.error("Failed to fetch bookings:", err);
        res.status(500).json({ error: 'Database query failed' });
    }
});



// POST new booking
// router.post('/', async (req, res) => {
//     const { user_id, name, purpose, date, room_id, time_id, email } = req.body;

//     if (!name || !user_id || !date || !room_id || !time_id || !email) {
//         return res.status(400).json({ error: "Missing required booking fields" });
//     }

//     try {
//         // Insert user if not already in users table
//         await dbmeetingbook.query(`
//             INSERT IGNORE INTO users (uid, name, email)
//             VALUES (?, ?, ?)
//         `, [user_id, name, email]);

//         // Insert booking
//         await dbmeetingbook.query(
//             'INSERT INTO bookings (name, user_id, purpose, date, room_id, time_id) VALUES (?, ?, ?, ?, ?, ?)',
//             [name, user_id, purpose, date, room_id, time_id]
//         );

//         console.log("Booking + user saved:", req.body);
//         res.status(201).send('Booking and user saved');
//     } catch (err) {
//         console.error("Error saving booking and user:", err);
//         res.status(500).json({ error: 'Failed to save booking and user' });
//     }
// });

// POST new booking
router.post('/', async (req, res) => {
    try {
        const b = req.body || {};

        // accept both camelCase and snake_case
        const user_id = b.user_id ?? b.userId;
        const room_id = Number(b.room_id ?? b.roomId);
        const time_id = Number(b.time_id ?? b.timeId);
        const date = b.date;
        const name = b.name?.trim();
        const purpose = b.purpose ?? null;
        const email = b.email ?? b.userEmail ?? null; // make email OPTIONAL

        if (!name || !user_id || !date || !room_id || !time_id) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields",
                got: { name: !!name, user_id: !!user_id, date: !!date, room_id: !!room_id, time_id: !!time_id, email: !!email }
            });
        }

        // Ensure VARCHAR user_id
        const userIdStr = String(user_id);

        // Insert user row if you have a users table (email optional)
        if (email) {
            await dbmeetingbook.query(
                `INSERT IGNORE INTO users (uid, name, email) VALUES (?, ?, ?)`,
                [userIdStr, name, email]
            );
        } else {
            // still ensure presence in users table by uid+name if you rely on JOINs later
            await dbmeetingbook.query(
                `INSERT IGNORE INTO users (uid, name) VALUES (?, ?)`,
                [userIdStr, name]
            );
        }

        // Insert booking
        const [result] = await dbmeetingbook.query(
            `INSERT INTO bookings (name, user_id, purpose, date, room_id, time_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [name, userIdStr, purpose, date, room_id, time_id]
        );

        return res.status(201).json({
            success: true,
            message: "Booking created successfully",
            id: result.insertId
        });
    } catch (err) {
        console.error("Error saving booking and user:", err);
        return res.status(500).json({
            success: false,
            error: err.sqlMessage || err.message
        });
    }
});



// DELETE booking by user
router.delete('/', async (req, res) => {
    const { user_id, date, time_id, room_id } = req.body;
    console.log(` trying to delete ${room_id}`)
    if (!user_id || !date || !time_id || !room_id) {
        return res.status(400).json({ error: "Missing required fields for deletion" });
    }

    try {
        const [result] = await dbmeetingbook.query(
            'DELETE FROM bookings WHERE user_id = ? AND date = ? AND time_id = ? AND room_id = ?',
            [user_id, date, time_id, room_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "No matching booking found to delete" });
        }

        console.log("Booking deleted:", req.body);
        res.sendStatus(200);
    } catch (error) {
        console.error("Error deleting booking:", error);
        res.status(500).json({ error: 'Failed to delete booking' });
    }
});

// PUT update booking (name or purpose) by user
router.put('/', async (req, res) => {
    const { name, user_id, purpose, date, time_id, room_id } = req.body;

    if (!name || !user_id || !purpose || !date || !room_id || !time_id) {
        return res.status(400).json({ error: "Missing required booking fields for update" });
    }

    try {
        const [result] = await dbmeetingbook.query(
            `UPDATE bookings 
             SET name = ?, purpose = ? 
             WHERE user_id = ? AND date = ? AND time_id = ? AND room_id = ?`,
            [name, purpose, user_id, date, time_id, room_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "No matching booking found to update" });
        }

        console.log("Booking updated:", req.body);
        res.status(200).json({ message: "Booking updated" });
    } catch (err) {
        console.error("Error updating booking:", err);
        res.status(500).json({ error: "Failed to update booking" });
    }
});




module.exports = router;


