const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db');

// Create Learning Log
router.post('/learning', auth, async (req, res) => {
    try {
        const { topic, content, challenges, log_date } = req.body;
        const userId = req.user.userId;

        await db.query(
            'INSERT INTO learning_logs (user_id, topic, content, challenges, log_date) VALUES (?, ?, ?, ?, ?)',
            [userId, topic, content, challenges || '', log_date]
        );

        res.status(201).json({
            success: true,
            message: 'Learning log saved successfully'
        });
    } catch (error) {
        console.error('Save error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save log'
        });
    }
});

// Create Coding Log
router.post('/coding', auth, async (req, res) => {
    try {
        const { topics_covered, problems, challenges_mistakes, log_date } = req.body;
        console.log(req.user);
        const userId = req.user.userId;

        // Insert main coding log
        const [logResult] = await db.query(
            'INSERT INTO coding_logs (user_id, topics_covered, challenges_mistakes, log_date) VALUES (?, ?, ?, ?)',
            [userId, topics_covered, challenges_mistakes || '', log_date]
        );

        const codingLogId = logResult.insertId;

        // Insert problems
        if (problems && problems.length > 0) {
            for (let i = 0; i < problems.length; i++) {
                const p = problems[i];
                await db.query(
                    'INSERT INTO coding_problems (coding_log_id, problem_number, problem_name, platform, difficulty, approach_solution) VALUES (?, ?, ?, ?, ?, ?)',
                    [codingLogId, i + 1, p.problem_name, p.platform, p.difficulty, p.approach_solution || '']
                );

                // Save custom platform
                const defaults = ['LeetCode', 'HackerRank', 'CodeChef', 'Codeforces', 'GFG'];
                if (!defaults.includes(p.platform)) {
                    await db.query(
                        'INSERT IGNORE INTO custom_platforms (user_id, platform_name) VALUES (?, ?)',
                        [userId, p.platform]
                    );
                }
            }
        }

        res.status(201).json({
            success: true,
            message: 'Coding log saved successfully'
        });
    } catch (error) {
        console.error('Save error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save log'
        });
    }
});

// Get custom platforms
router.get('/platforms', auth, async (req, res) => {
    try {
        const [platforms] = await db.query(
            'SELECT platform_name FROM custom_platforms WHERE user_id = ?',
            [req.user.userId]
        );

        res.json({
            success: true,
            platforms: platforms.map(p => p.platform_name)
        });
    } catch (error) {
        res.status(500).json({ success: false, platforms: [] });
    }
});

module.exports = router;