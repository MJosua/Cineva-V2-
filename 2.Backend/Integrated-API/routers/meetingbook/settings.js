const express = require('express');
const router = express.Router();
// const db = require('../db'); // Your database connection
const { dbmeetingbook } = require('../../config/db');;


// GET current start and end time
router.get('/', async (req, res) => {
  try {
    const rows = await dbmeetingbook.query('SELECT end_time FROM settings WHERE id = 1');
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching settings');
  }
});

// POST to update times
router.post('/', async (req, res) => {
  const { start_time, end_time } = req.body;
  try {
    await dbmeetingbook.query(
      'UPDATE settings SET end_time = ? WHERE id = 1',
      [end_time]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating settings');
  }
});

module.exports = router;




// POST/PUT to update time settings (admin only)
router.put('/api/settings', async (req, res) => {
  const { end_time } = req.body;
  await db.query("UPDATE settings SET end_time = ? WHERE id = 1", [end_time]);
  res.sendStatus(200);
});

// const express = require('express');
// const router = express.Router();
// const db = require('../config/db');

// router.get("/", async (req, res) => {
//     try {
//         const [rows] = await dbmeetingbook.query("SELECT * FROM settings LIMIT 1");
//         res.json(rows[0]);
//     } catch (err) {
//         console.error("Failed to fetch settings:", err);
//         res.status(500).send("Failed to fetch settings");
//     }
// });

// router.post("/", (req, res) => {
//     const { start_time, end_time } = req.body;
//     console.log("being called")
//     if (!start_time || !end_time) {
//          console.log("start", start_time)
//         return res.status(400).send("Missing time values");
        
//     }

//     console.log("start", start_time)
//         console.log("end", end_time)
//     dbmeetingbook.query(
//         "UPDATE settings SET start_time = ?, end_time = ? WHERE id = 1",
//         [start_time, end_time],
//         (err, result) => {
//             if (err) {
//                 console.error("DB update error:", err);
//                 return res.status(500).send("Failed to update");
//             }
//             res.send("Time updated");
//         }
//     );
// });

// module.exports = router;
