const express = require('express');
const os = require('os');
const db = require('./db');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());

// Route for /users/12
app.get('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ ...result.rows[0], server_id: os.hostname() });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
