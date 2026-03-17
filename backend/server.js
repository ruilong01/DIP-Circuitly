const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./config/db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // In production, you might want to restrict this to your GitHub Pages domain
app.use(express.json());

app.get('/api/health', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.json({ success: true, message: 'Backend and database are working' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Database connection failed' });
    }
});

app.post('/api/auth/register', async (req, res) => {
    const { username, password, studentId, name, classGroup } = req.body;

    try {
        const passwordHash = await bcrypt.hash(password, 10);

        const result = await db.query(
            `INSERT INTO users (username, password_hash, student_id, name, class_group)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, student_id AS "studentId", name, xp, hearts, role`,
            [username, passwordHash, studentId, name, classGroup]
        );

        res.status(201).json({ success: true, user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(400).json({
            success: false,
            error: err.message.includes('unique') ? 'Username or Student ID already exists' : 'Registration failed'
        });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, error: 'User not found' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const profile = {
            id: user.id,
            username: user.username,
            studentId: user.student_id,
            name: user.name,
            xp: user.xp,
            hearts: user.hearts,
            role: user.role,
            topicProgress: {}
        };

        const progResult = await db.query(
            'SELECT topic_id, xp_earned FROM topic_progress WHERE user_id = $1',
            [user.id]
        );

        progResult.rows.forEach((row) => {
            profile.topicProgress[row.topic_id] = { xp: row.xp_earned };
        });

        res.json({ success: true, user: profile });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Login server error' });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                u.id, 
                u.username, 
                u.student_id AS "studentId", 
                u.name, 
                u.class_group AS "classGroup",
                u.xp, 
                u.hearts, 
                u.role,
                u.last_active AS "lastActive"
            FROM users u
            ORDER BY u.xp DESC
        `);

        // Get progress for all users
        const users = result.rows;
        for (let user of users) {
             const progResult = await db.query(
                'SELECT topic_id, xp_earned, time_spent AS "timeSpent" FROM topic_progress WHERE user_id = $1',
                [user.id]
            );
            user.topicProgress = {};
            progResult.rows.forEach(row => {
                user.topicProgress[row.topic_id] = { 
                    xp: row.xp_earned,
                    time: row.timeSpent
                };
            });
            // Detailed stats mapping
            user.stats = user.topicProgress; 
        }

        res.json({ success: true, users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }
});

app.post('/api/progress', async (req, res) => {
    const { studentId, xp, hearts, topicProgress } = req.body;

    try {
        // 1. Get user id from studentId
        const userRes = await db.query('SELECT id FROM users WHERE student_id = $1', [studentId]);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        const userId = userRes.rows[0].id;

        // 2. Update user XP and hearts
        await db.query(
            'UPDATE users SET xp = $1, hearts = $2, last_active = NOW() WHERE id = $3',
            [xp, hearts, userId]
        );

        // 3. Update topic progress (upsert)
        for (const [topicId, data] of Object.entries(topicProgress)) {
            await db.query(
                `INSERT INTO topic_progress (user_id, topic_id, xp_earned)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (user_id, topic_id) 
                 DO UPDATE SET xp_earned = EXCLUDED.xp_earned, last_attempt = NOW()`,
                [userId, parseInt(topicId, 10), data.xp]
            );
        }

        res.json({ success: true, message: 'Progress saved' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Failed to save progress' });
    }
});

app.get('/api/questions/:topicId', async (req, res) => {
    const topicId = parseInt(req.params.topicId, 10);

    try {
        const result = await db.query(
            `SELECT
         id,
         topic_id AS "topicId",
         type,
         difficulty,
         prompt AS question,
         option_a AS "optionA",
         option_b AS "optionB",
         option_c AS "optionC",
         option_d AS "optionD",
         answer,
         image_url AS image,
         explanation
       FROM questions
       WHERE topic_id = $1
       ORDER BY id ASC`,
            [topicId]
        );

        res.json({
            success: true,
            questions: result.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch questions'
        });
    }
});

// User Behaviour Logging
app.post('/api/behaviours', async (req, res) => {
    const { studentId, actionType, metadata } = req.body;

    try {
        const userRes = await db.query('SELECT id FROM users WHERE student_id = $1', [studentId]);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        const userId = userRes.rows[0].id;

        await db.query(
            'INSERT INTO user_behaviours (user_id, action_type, metadata) VALUES ($1, $2, $3)',
            [userId, actionType, JSON.stringify(metadata || {})]
        );

        res.json({ success: true, message: 'Behaviour logged' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Failed to log behaviour' });
    }
});

app.get('/api/behaviours', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                b.id,
                u.name,
                u.student_id AS "studentId",
                b.action_type AS "actionType",
                b.metadata,
                b.timestamp
            FROM user_behaviours b
            JOIN users u ON b.user_id = u.id
            ORDER BY b.timestamp DESC
            LIMIT 500
        `);

        res.json({ success: true, behaviours: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Failed to fetch behaviours' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});