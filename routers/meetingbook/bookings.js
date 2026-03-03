// Handles all booking-related API calls using Universal Generic Resource System
const express = require('express');
const router = express.Router();
const { dbHots } = require('../../config/db');

// GET all active bookings
router.get('/', async (req, res) => {
    try {
        const [rows] = await dbHots.promise().query(`
            SELECT 
                r.reservation_id AS id,
                r.resource_key AS room,
                r.resource_key AS room_id,
                r.reference_id,
                DATE_FORMAT(r.start_time, '%Y-%m-%d') AS date,
                e.event_data
            FROM resource_t_reservation r
            INNER JOIN resource_t_event e ON r.reference_id = CAST(e.event_id AS CHAR) COLLATE utf8mb4_unicode_ci
            WHERE r.resource_category = 'meeting_room' 
            AND r.status = 'active'
        `);

        const formatted = rows.map(r => {
            let data = {};
            try {
                data = typeof r.event_data === 'string' ? JSON.parse(r.event_data) : (r.event_data || {});
            } catch (e) {
                console.error("Error parsing booking event data:", r.reference_id);
            }

            return {
                id: r.id,
                room: r.room,
                room_id: r.room_id,
                user_id: data.user_id,
                booked_by: data.name || "Unknown",
                purpose: data.purpose,
                date: r.date,
                start_time: data.start_time || data.time_id,
                end_time: data.end_time || data.time_id
            };
        });

        res.status(200).json({
            success: true,
            data: formatted,
            message: "Bookings retrieved"
        });
    } catch (err) {
        console.error("Failed to fetch bookings:", err);
        res.status(500).json({ success: false, message: 'Database query failed' });
    }
});

// POST new booking
router.post('/', async (req, res) => {
    const conn = await dbHots.promise().getConnection();
    try {
        await conn.beginTransaction();

        const b = req.body || {};
        const user_id = b.user_id || b.userId || req.dataToken?.user_id || "Unknown";
        const room_key = b.room_id || b.resource_key || b.room;
        const date = b.date;
        const start_time = b.start_time || b.time_id;
        const end_time = b.end_time || b.time_id;
        const name = b.name || b.PIC || b.requested_by || "Anonymous";
        const purpose = b.purpose || "Meeting";

        if (!user_id || !date || !room_key || !start_time) {
            return res.status(400).json({ error: "Missing required fields (user_id, date, room_key, start_time)" });
        }

        // 🔒 Validation: Check for Overlapping Bookings
        const startDateTime = `${date} ${start_time}`;
        const endDateTime = `${date} ${end_time}`;

        const [existing] = await conn.query(`
            SELECT reservation_id FROM resource_t_reservation 
            WHERE resource_category = 'meeting_room' 
            AND resource_key = ? 
            AND status = 'active'
            AND (
                (start_time < ? AND end_time > ?) OR  -- Overlaps start
                (start_time < ? AND end_time > ?) OR  -- Overlaps end
                (start_time >= ? AND end_time <= ?)   -- Fully inside
            )
            LIMIT 1
        `, [String(room_key), endDateTime, startDateTime, endDateTime, startDateTime, startDateTime, endDateTime]);

        if (existing.length > 0) {
            await conn.rollback();
            return res.status(409).json({
                success: false,
                message: "Time slot already booked by another user."
            });
        }

        // 1. Transactional Event Log (Ledger)
        const [eventResult] = await conn.query(`
            INSERT INTO resource_t_event (resource_category, resource_key, event_type, event_data, created_by)
            VALUES (?, ?, ?, ?, ?)
        `, ['meeting_room', String(room_key), 'ROOM_BOOKED', JSON.stringify({
            user_id, name, purpose, date, start_time, end_time
        }), user_id]);

        const eventId = eventResult.insertId;

        // 2. Update Current Reservation State
        await conn.query(`
            INSERT INTO resource_t_reservation (resource_category, resource_key, reference_id, start_time, end_time, status)
            VALUES (?, ?, ?, ?, ?, ?)
        `, ['meeting_room', String(room_key), String(eventId), startDateTime, endDateTime, 'active']);

        await conn.commit();

        // 📡 SSE Broadcast: Update Schedule
        if (global.sseManager) {
            global.sseManager.broadcast('update_meeting_schedule', {
                room_id: room_key,
                action: 'booked',
                by: name
            });
        }

        res.status(201).json({ success: true, message: "Booking created successfully", id: eventId });
    } catch (err) {
        await conn.rollback();
        console.error("Error saving booking:", err);
        res.status(500).json({ error: err.message });
    } finally {
        conn.release();
    }
});

// DELETE booking
router.delete('/', async (req, res) => {
    const { id, user_id, room_id } = req.body;
    const conn = await dbHots.promise().getConnection();
    try {
        await conn.beginTransaction();

        // 1. Update Reservation to cancelled
        const [result] = await conn.query(
            "UPDATE resource_t_reservation SET status = 'cancelled' WHERE reservation_id = ? AND resource_category = 'meeting_room'",
            [id]
        );

        if (result.affectedRows === 0) {
            await conn.rollback();
            return res.status(404).json({ message: "No matching booking found" });
        }

        // 2. Log Cancellation Event
        await conn.query(`
            INSERT INTO resource_t_event (resource_category, resource_key, event_type, event_data, created_by)
            VALUES (?, ?, ?, ?, ?)
        `, ['meeting_room', String(room_id), 'ROOM_CANCELLED', JSON.stringify({ reservation_id: id }), user_id]);

        await conn.commit();

        // 📡 SSE Broadcast: Update Schedule
        if (global.sseManager) {
            global.sseManager.broadcast('update_meeting_schedule', {
                room_id,
                action: 'cancelled',
                reservation_id: id
            });
        }

        res.sendStatus(200);
    } catch (err) {
        await conn.rollback();
        console.error("Error deleting booking:", err);
        res.status(500).json({ error: err.message });
    } finally {
        conn.release();
    }
});

module.exports = router;
