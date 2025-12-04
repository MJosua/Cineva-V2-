const express = require("express");
const router = express.Router();
const { dbmeetingbook } = require('../../config/db');;


// GET user info by uid
router.get("/:uid", async (req, res) => {
  const uid = req.params.uid;

  try {
    const [rows] = await dbmeetingbook.execute("SELECT email, uid, role FROM users WHERE uid = ?", [uid]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      email: rows[0].email,
      uid: rows[0].uid,
      role: rows[0].role // frontend will use this!
    });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
