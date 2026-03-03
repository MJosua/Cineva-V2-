
const nodemailer = require("nodemailer");
const cron = require("node-cron");
const { dbmeetingbook } = require("../../../config/db");


const timeMap = {
    1: "08:00",
    2: "09:00",
    3: "10:00",
    4: "11:00",
    5: "12:00",
    6: "13:00",
    7: "14:00",
    8: "15:00",
    9: "16:00",
    10: "17:00",
    11: "18:00",
    12: "19:00"
};

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "iodxiaomi@gmail.com",        // 👈 your sender Gmail
        pass: "ustmztccwddlpwma"      // 👈 use App Password from Google (not your real password)
    }
});


const earlyReminders = async () => {
    const today = new Date().toISOString().split("T")[0];

    const bookings = await dbmeetingbook.query(
        `SELECT b.*, u.email 
         FROM bookings b 
         JOIN users u ON b.user_id = u.uid 
         WHERE b.date = ? AND b.time_id = 1 AND b.reminder_sent = 0 AND u.email IS NOT NULL
         AND u.email <> ''`,
        [today]
    );

    for (const booking of bookings) {
        const key = `${booking.user_id}_${booking.date}_${booking.room_id}`;

        // Check if there's a booking just before this time slot
        const prevRows = await dbmeetingbook.query(`
        SELECT * FROM bookings
        WHERE user_id = ? AND date = ? AND room_id = ? AND time_id = ?
    `, [booking.user_id, booking.date, booking.room_id, booking.time_id - 1]);

        if (prevRows.length > 0) {
            // Skip this one, since it's part of a block that's already been reminded
            continue;
        }

        // 1. Get all consecutive time slots for this booking block
        let endTimeId = booking.time_id;
        while (timeMap[endTimeId + 1]) {
            const nextRows = await dbmeetingbook.query(`
        SELECT * FROM bookings
        WHERE user_id = ? AND date = ? AND room_id = ? AND time_id = ?
    `, [booking.user_id, booking.date, booking.room_id, endTimeId + 1]);

            if (nextRows.length > 0) {
                endTimeId++;
            } else {
                break;
            }
        }

        // 2. Format time range
        const start = timeMap[booking.time_id];
        const end = timeMap[endTimeId + 1]; // end of the last slot
        const timeRange = end ? `${start} – ${end}` : start;


        const roomName = booking.room_id === 1 ? "Anzpac" : booking.room_id === 2 ? "Asia" : `Room ${booking.room_id}`;
        await transporter.sendMail({
            from: "iodxiaomi@gmail.com",
            to: booking.email,
            subject: "⏰ Reminder: 8:00 AM Meeting Room Booking",
            html: `
              <p>Hi ${booking.name},</p>
              <p>This is your reminder for your 8:00 AM booking today:</p>
              <ul>
                <li><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString("en-US")}</li>
                <li><strong>Time:</strong> ${timeRange}</li>
                <li><strong>Room:</strong> ${roomName}</li>
                <li><strong>Purpose:</strong> ${booking.purpose}</li>
              </ul>
            `
        });

        await dbmeetingbook.query(`UPDATE bookings SET reminder_sent = 1 WHERE id = ?`, [booking.id]);
        console.log(`📨 8AM Reminder sent to ${booking.email}`);
    }
};


cron.schedule("*/1 * * * *", async () => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const targetDate = oneHourLater.toISOString().split("T")[0];
    const targetTime = oneHourLater.toTimeString().substring(0, 5); // "14:00"
    const timeId = Object.entries(timeMap).find(([_, time]) => time === targetTime)?.[0];

    if (!timeId) return; // no matching time_id for this minute

    try {
        const bookings = await dbmeetingbook.query(
            `SELECT b.*, u.email 
                FROM bookings b 
                JOIN users u ON b.user_id = u.uid 
                WHERE b.date = ? AND b.time_id = ? AND b.reminder_sent = 0 AND u.email IS NOT NULL
                AND u.email <> ''`,
            [targetDate, timeId]
        );

        for (const booking of bookings) {
            const key = `${booking.user_id}_${booking.date}_${booking.room_id}`;

            // Check if there's a booking just before this time slot
            const prevRows = await dbmeetingbook.query(`
                SELECT * FROM bookings
                WHERE user_id = ? AND date = ? AND room_id = ? AND time_id = ?
            `, [booking.user_id, booking.date, booking.room_id, booking.time_id - 1]);

            if (prevRows.length > 0) {
                // Skip this one, since it's part of a block that's already been reminded
                continue;
            }

            // 1. Get all consecutive time slots for this booking block
            let endTimeId = booking.time_id;
            while (endTimeId < 12) { // up to 17:00
                const nextRows = await dbmeetingbook.query(`
                SELECT * FROM bookings
                WHERE user_id = ? AND date = ? AND room_id = ? AND time_id = ?
            `, [booking.user_id, booking.date, booking.room_id, endTimeId + 1]);

                if (nextRows.length > 0) {
                    endTimeId++;
                } else {
                    break;
                }
            }

            // 2. Format time range
            const nextSlot = timeMap[endTimeId + 1];
            const timeRange = `${timeMap[booking.time_id]} – ${timeMap[endTimeId + 1] || timeMap[endTimeId]
                }`;




            const roomName = booking.room_id === 1 ? "Anzpac" : booking.room_id === 2 ? "Asia" : `Room ${booking.room_id}`;
            await transporter.sendMail({
                from: "iodxiaomi@gmail.com",
                to: booking.email,
                subject: "⏰ Reminder: Meeting Room Booking",
                html: `
                <p>Hi ${booking.name},</p>

                <p>This is a friendly reminder that you have a confirmed meeting room booking:</p>

                <ul>
                <li><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                })}</li>

                    <li><strong>Time:</strong> ${timeRange}</li>
                    <li><strong>Room:</strong> ${roomName}</li>
                    <li><strong>Purpose:</strong> ${booking.purpose}</li>
                </ul>
                `
            });

            await dbmeetingbook.query(
                `UPDATE bookings SET reminder_sent = 1 WHERE id = ?`,
                [booking.id]
            );

            console.log(`✅ Reminder sent to ${booking.email} for ${booking.date} ${timeMap[booking.time_id]}`);
        }
    } catch (err) {
        console.log("❌ Failed to send reminders:", err);
    }
});