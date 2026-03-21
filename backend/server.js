const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./config/db');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first'); // Fix Node 18 native fetch failing in AWS App Runner

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // In production, you might want to restrict this to your GitHub Pages domain
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../docs')));

app.get('/api/health', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.json({ success: true, message: 'Backend and Database are connected' });
    } catch (err) {
        console.error('Health check failed:', err);
        res.status(500).json({ success: false, message: 'Database connection failed' });
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
            'SELECT topic_id, xp_earned, time_spent FROM topic_progress WHERE user_id = $1',
            [user.id]
        );

        profile.stats = {};
        progResult.rows.forEach((row) => {
            profile.topicProgress[row.topic_id] = { xp: row.xp_earned };
            profile.stats[row.topic_id] = { xp: row.xp_earned, time: row.time_spent || 0 };
        });

        res.json({ success: true, user: profile });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Login server error' });
    }
});

const getUsersHandler = async (req, res) => {
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

        const users = result.rows;
        
        // Fetch all progress record to mapping
        const allProgResult = await db.query(`
            SELECT user_id, topic_id, xp_earned, time_spent 
            FROM topic_progress
        `);

        // Group progress by user_id
        const progressMap = {};
        allProgResult.rows.forEach(row => {
            if (!progressMap[row.user_id]) progressMap[row.user_id] = {};
            progressMap[row.user_id][row.topic_id] = {
                xp: row.xp_earned,
                time: row.time_spent
            };
        });

        // Attach progress to each user
        users.forEach(user => {
            user.topicProgress = progressMap[user.id] || {};
            user.stats = user.topicProgress; // For backwards compatibility
        });

        res.json({ success: true, users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }
};

app.get('/api/users', getUsersHandler);
app.get('/api/admin/users', getUsersHandler);

app.post('/api/progress', async (req, res) => {
    const { studentId, xp, hearts, topicProgress } = req.body;

    try {
        const userRes = await db.query('SELECT id FROM users WHERE student_id = $1', [studentId]);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        const userId = userRes.rows[0].id;

        await db.query(
            'UPDATE users SET xp = $1, hearts = $2, last_active = NOW() WHERE id = $3',
            [xp, hearts, userId]
        );

        for (const [topicId, data] of Object.entries(topicProgress)) {
            // data.time might be null/missing from old clients, default to 0
            const timeToAdd = data.time || 0;
            
            await db.query(
                `INSERT INTO topic_progress (user_id, topic_id, xp_earned, time_spent)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (user_id, topic_id) 
                 DO UPDATE SET 
                    xp_earned = EXCLUDED.xp_earned, 
                    time_spent = EXCLUDED.time_spent,
                    last_attempt = NOW()`,
                [userId, parseInt(topicId, 10), data.xp, timeToAdd]
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

// Gemini API Proxy
const https = require('https');

app.post('/api/chat', (req, res) => {
    const { payload } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        return res.status(500).json({ success: false, error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const postData = JSON.stringify(payload);
    
    const options = {
        hostname: 'generativelanguage.googleapis.com',
        port: 443,
        path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 25000 // 25 seconds timeout to prevent AWS App Runner upstream timeout
    };

    const request = https.request(options, (response) => {
        let rawData = '';
        response.on('data', (chunk) => { rawData += chunk; });
        response.on('end', () => {
            try {
                const data = JSON.parse(rawData);
                if (response.statusCode < 200 || response.statusCode >= 300) {
                    console.error("Gemini API Error:", data);
                    if (!res.headersSent) {
                        return res.status(response.statusCode).json({ success: false, error: data.error?.message || "Failed to reach Gemini API." });
                    }
                }
                if (!res.headersSent) {
                    res.json({ success: true, data });
                }
            } catch (e) {
                if (!res.headersSent) {
                    res.status(500).json({ success: false, error: 'Failed to parse Gemini API response' });
                }
            }
        });
    });

    request.on('timeout', () => {
        console.error("Gemini API Request timed out.");
        request.destroy();
        if (!res.headersSent) {
            res.status(504).json({ success: false, error: 'The AI took too long to respond. Please try again.' });
        }
    });

    request.on('error', (err) => {
        console.error("Chat proxy error:", err);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    request.write(postData);
    request.end();
});

// Catch-all route to serve the frontend for any non-API requests (Useful for SPA routing)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../docs/index.html'));
});

// Global error handler — returns 503 instead of crashing on DB pool exhaustion
app.use((err, req, res, next) => {
    if (err.code === 'ECONNREFUSED' || err.message?.includes('timeout') || err.message?.includes('pool')) {
        console.error('DB pool error on request:', err.message);
        return res.status(503).json({ success: false, error: 'Server is busy, please try again.' });
    }
    console.error('Unhandled server error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

// Keep server alive on unexpected errors — log but don't crash
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err.message);
});
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} (max ${process.env.DB_POOL_MAX || 20} DB connections per instance)`);
});