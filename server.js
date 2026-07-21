const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Allow your dashboard to fetch from this API
app.use(cors());

// ==========================================
// DATABASE CONNECTION (SQLite)
// ==========================================
// If you have level_data.db, put it in the SAME folder as server.js!
const DB_PATH = path.join(__dirname, 'level_data.db');

// Helper to calculate the exact level (Matching your Python bot's math)
function getLevelFromXP(xp) {
    let level = 0;
    while (Math.floor(1000 * Math.pow(level + 1, 1.5)) <= xp) {
        level++;
    }
    return level;
}

// ==========================================
// API ROUTE: /leaderboard/:guild_id
// ==========================================
app.get('/leaderboard/:guild_id', (req, res) => {
    const guildId = req.params.guild_id;

    // Check if the database file exists
    if (!fs.existsSync(DB_PATH)) {
        return res.status(404).json({ error: "Database file not found. Please upload level_data.db to Render." });
    }

    const db = new sqlite3.Database(DB_PATH);

    // Fetch top 100 users for this guild
    const query = `
        SELECT user_id, xp 
        FROM levels 
        WHERE guild_id = ? 
        ORDER BY xp DESC 
        LIMIT 100
    `;

    db.all(query, [guildId], (err, rows) => {
        db.close();

        if (err) {
            console.error("Database error:", err.message);
            return res.status(500).json({ error: "Database error" });
        }

        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: "No data found for this guild ID." });
        }

        // Format the data for your dashboard
        const formattedData = rows.map(row => ({
            user_id: row.user_id,
            xp: row.xp,
            level: getLevelFromXP(row.xp)
        }));

        res.json(formattedData);
    });
});

// ==========================================
// START THE SERVER
// ==========================================
app.listen(PORT, () => {
    console.log(`✅ Leaderboard API is running on port ${PORT}`);
    console.log(`📊 Visit: http://localhost:${PORT}/leaderboard/YOUR_GUILD_ID`);
});
