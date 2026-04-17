const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../db');
const aiService = require('../services/aiServiceDirect');


const topicGraph = {
  "Array": ["Two Pointers", "Sliding Window", "Prefix Sum"],
  "String": ["Sliding Window", "Hash Table"],
  "Dynamic Programming": ["Memoization", "Recursion"],
  "Tree": ["Binary Tree", "Binary Search Tree"],
  "Graph Theory": ["Depth-First Search", "Breadth-First Search"],
  "Stack": ["Monotonic Stack"],
  "Queue": ["Breadth-First Search"],
};


// ========================================
// LEARNING LOG ROUTES
// ========================================

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
        console.error('Save learning log error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save log'
        });
    }
});

// ========================================
// CODING LOG ROUTES
// ========================================

// Create Coding Log
// Topic normalization
function normalizeTopic(topic) {
    if (!topic) return '';
    return topic.trim().toLowerCase();
}

// Get or create normalized topic
router.post('/topic/normalize', auth, async (req, res) => {
    try {
        const { topicName } = req.body;
        const userId = req.user.userId;
        const normalized = normalizeTopic(topicName);
        
        const [existing] = await db.query(
            'SELECT * FROM user_topics WHERE user_id = ? AND normalized_topic = ?',
            [userId, normalized]
        );
        
        if (existing.length > 0) {
            return res.json({
                success: true,
                exists: true,
                existingTopic: existing[0].display_name,
                normalized
            });
        }
        
        res.json({ success: true, exists: false, normalized });
    } catch (error) {
        console.error('Normalize topic error:', error);
        res.status(500).json({ success: false });
    }
});

// Save topic
router.post('/topic/save', auth, async (req, res) => {
    try {
        const { topicName, normalized } = req.body;
        const userId = req.user.userId;
        
        await db.query(
            'INSERT INTO user_topics (user_id, normalized_topic, display_name) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE display_name = ?',
            [userId, normalized, topicName, topicName]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Save topic error:', error);
        res.status(500).json({ success: false });
    }
});

// Get questions by topic
router.get('/questions/:topic', auth,async (req, res) => {
    try {
        const topic = req.params.topic;

        // normalize
        const normalized = normalizeTopic(topic);

        // convert back to display format (first letter caps)
        const mainTopic = topic
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        // get related topics
        const related = topicGraph[mainTopic] || [];

        const allTopics = [mainTopic, ...related];

        // fetch questions
        const [questions] = await db.query(
            `SELECT * FROM question_bank 
             WHERE LOWER(topic) IN (?) 
             ORDER BY FIELD(difficulty, 'Easy', 'Medium', 'Hard'), question_name`,
            [allTopics.map(t => t.toLowerCase())]
        );

        res.json({
            success: true,
            mainTopic,
            relatedTopics: related,
            total: questions.length,
            questions
        });

    } catch (error) {
        console.error('Get questions error:', error);
        res.status(500).json({ success: false, questions: [] });
    }
});

// Save solved question
router.post('/question/solve', auth, async (req, res) => {
    console.log("🚀 Incoming body:", req.body);
    try {
        const {
            problem_name,
            difficulty,
            platform,
            topic_name,
            approach_solution,
            logic_steps,
            mistakes_faced,
            solved_date
        } = req.body;
        console.log("BODY:", req.body);
        if (!problem_name || !difficulty || !platform || !topic_name) {
            console.log("❌ Missing fields:", req.body);
            return res.status(400).json({
                success: false,
                message: "Required fields missing"
            });
        }
        const userId = req.user.userId;

        if (!mistakes_faced || String(mistakes_faced).trim() === '') {
            return res.status(400).json({ success: false, message: 'Mistakes field is required' });
        }

        // ✅ Normalize topic
        const normalized = normalizeTopic(topic_name);

        // ✅ Check if topic exists
        const [existing] = await db.query(
            'SELECT * FROM user_topics WHERE user_id = ? AND normalized_topic = ?',
            [userId, normalized]
        );

        // ✅ Insert if not exists
        if (existing.length === 0) {
            await db.query(
                'INSERT INTO user_topics (user_id, normalized_topic, display_name) VALUES (?, ?, ?)',
                [userId, normalized, topic_name]
            );
        }

        // ✅ Save solved question
        await db.query(`
            INSERT INTO user_solved_questions 
            (
                user_id,
                question_id,
                problem_name,
                difficulty,
                platform,
                topic_name,
                approach_solution,
                logic_steps,
                mistakes_faced,
                solved_date
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            userId,
            req.body.question_id || null,
            problem_name,
            difficulty,
            platform,
            topic_name,
            approach_solution || '',
            logic_steps || '',
            mistakes_faced,
            solved_date
        ]);

        res.json({ success: true });

    } catch (error) {
        console.error('Save question error:', error);
        res.status(500).json({ success: false, message: 'Failed to save' });
    }
});

router.post('/suggestion/click', auth, async (req, res) => {
    try {
        const { question_id, topic } = req.body;
        const userId = req.user.userId;

        await db.query(
            `INSERT INTO suggestion_clicks (user_id, question_id, topic) 
             VALUES (?, ?, ?)`,
            [userId, question_id, topic]
        );

        res.json({ success: true });

    } catch (error) {
        console.error('Suggestion click error:', error);
        res.status(500).json({ success: false });
    }
});

// ========================================
// DASHBOARD ROUTES
// ========================================

// Get Dashboard Stats
router.get('/dashboard/stats', auth,async (req, res) => {
    try {
        const userId = req.user.userId;

        // Problems solved
        const [problems] = await db.query(`
            SELECT COUNT(*) as total FROM user_solved_questions WHERE user_id = ?
        `, [userId]);

        // Topics
        const [topics] = await db.query(`
            SELECT COUNT(DISTINCT topic_name) as total FROM user_solved_questions WHERE user_id = ?
        `, [userId]);

        const [datesRows] = await db.query(`
            SELECT DISTINCT DATE(solved_date) as date
            FROM user_solved_questions
            WHERE user_id = ?
        `, [userId]);

        const solvedDates = new Set(
            datesRows.map(r => r.date.toISOString().slice(0, 10))
        );

        function formatDate(date) {
            return date.toISOString().split('T')[0];
        }

        let currentStreak = 0;
        let today = new Date();

        // STRICT streak (no skipping today)
        if (solvedDates.has(formatDate(today))) {
            for (let i = 0; i < 365; i++) {
                const temp = new Date(today);
                temp.setDate(today.getDate() - i);

                if (solvedDates.has(formatDate(temp))) {
                    currentStreak++;
                } else break;
            }
        }
        res.json({
            success: true,
            stats: {
                streak: { current: currentStreak, lastWeek: 0 }, // keep simple for now
                topics: { current: topics[0].total, lastWeek: 0 },
                problems: { current: problems[0].total, lastWeek: 0 }
            }
        });

    } catch (err) {
        console.error("Stats error:", err);
        res.status(500).json({ success: false });
    }
});

// Get Recent Activity
router.get('/dashboard/activity', auth,async (req, res) => {
    try {
        const userId = req.user.userId;

        const [rows] = await db.query(`
            SELECT topic_name, solved_date, mistakes_faced
            FROM user_solved_questions
            WHERE user_id = ?
            ORDER BY solved_date DESC
            LIMIT 10
        `, [userId]);

        const activity = rows.map(r => ({
            type: 'coding',
            topic: r.topic_name,
            notes: r.mistakes_faced,
            date: r.solved_date
        }));

        res.json({ success: true, activity });

    } catch (err) {
        console.error("Activity error:", err);
        res.status(500).json({ success: false });
    }
});

// Get Weak Areas
router.get('/dashboard/weak-areas', auth, async (req, res) => {
    try {
        const userId = req.user.userId; // or req.user.id if auth

        const [rows] = await db.query(`
            SELECT topic_name as topic,
                COUNT(*) as count,
                GROUP_CONCAT(mistakes_faced SEPARATOR ' | ') as mistakes
            FROM user_solved_questions
            WHERE user_id = ? 
            AND mistakes_faced IS NOT NULL 
            AND mistakes_faced != ''
            GROUP BY topic_name
            ORDER BY count DESC
            LIMIT 5
        `, [userId]);
        console.log("ROWS FROM DB:", rows);
        res.json({
            success: true,
            weakAreas: rows.map(r => ({
                topic: r.topic,
                count: r.count,
                mistakes: r.mistakes || '',
                difficulty: Math.min(100, r.count * 10)
            }))
        });

    } catch (err) {
        console.error("Weak areas error:", err);
        res.status(500).json({ success: false });
    }
});

// ========================================
// AI RECAP ROUTES
// ========================================

// Get logs for AI recap (grouped by topic)
router.post('/ai-recap/logs', auth,async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        const userId = req.user.userId;

        console.log('📊 AI Recap request:', { userId, startDate, endDate });

        // Get learning logs
        const [learningLogs] = await db.query(
            'SELECT topic, content, challenges, log_date, "learning" as type FROM learning_logs WHERE user_id = ? AND log_date BETWEEN ? AND ? ORDER BY topic, log_date ASC',
            [userId, startDate, endDate]
        );

        console.log('📝 Learning logs found:', learningLogs.length);

        // Get coding logs
        const [codingLogs] = await db.query(
        `SELECT 
            usq.topic_name as topic,
            usq.mistakes_faced as challenges,
            usq.approach_solution,
            usq.logic_steps,
            usq.solved_date as log_date,
            "coding" as type,
            usq.problem_name,
            usq.difficulty,
            usq.platform
        FROM user_solved_questions usq
        WHERE usq.user_id = ? 
        AND usq.solved_date BETWEEN ? AND ?
        ORDER BY usq.topic_name, usq.solved_date ASC`,
        [userId, startDate, endDate]
        );

        console.log('💻 Coding logs found:', codingLogs.length);

        const allLogs = [...learningLogs, ...codingLogs];

        // 🔥 Weak topic detection
        const weakTopicsMap = {};

        (codingLogs || []).forEach(log => {
            if (log.challenges && log.challenges.trim() !== '') {
                if (!weakTopicsMap[log.topic]) {
                    weakTopicsMap[log.topic] = 0;
                }
                weakTopicsMap[log.topic]++;
            }
        });

        const weakTopics = Object.entries(weakTopicsMap)
            .sort((a, b) => b[1] - a[1])
            .map(([topic, count]) => ({
                topic,
                mistakes: count
            }));
             
        // Group logs by topic
       
        const groupedLogs = {};
        allLogs.forEach(log => {
            const topic = log.topic?.trim() || 'General';
            if (!groupedLogs[topic]) {
                groupedLogs[topic] = [];
            }
            groupedLogs[topic].push(log);
        });

        console.log('✅ Topics found:', Object.keys(groupedLogs).length);
        const topics = Object.keys(groupedLogs);
        res.json({
            success: true,
            logs: allLogs,
            groupedLogs,
            topics,
            weakTopics
        });

    } catch (error) {
        console.error('❌ Get recap logs error:', error);
        res.status(500).json({ 
            success: false, 
            logs: [], 
            groupedLogs: {}, 
            topics: [],
            error: error.message 
        });
    }
});

// Generate AI summary (topic-wise)
router.post('/ai-recap/summary', async (req, res) => {
    try {
       const { groupedLogs, weakTopics } = req.body;

        console.log('🤖 Generating summary for topics:', Object.keys(groupedLogs || {}).length);

        if (!groupedLogs || Object.keys(groupedLogs).length === 0) {
            return res.json({
                success: false,
                summary: 'No logs found for the selected period.'
            });
        }

        const result =  await aiService.generateTopicWiseSummary(groupedLogs, weakTopics);
        
        console.log('✅ Summary generated successfully');
        
        res.json(result);

    } catch (error) {
        console.error('❌ Generate summary error:', error);
        res.status(500).json({
            success: false,
            summary: 'Failed to generate summary: ' + error.message
        });
    }
});

// Generate comprehensive checklist
router.post('/ai-recap/checklist', async (req, res) => {
    try {
        const { topics } = req.body;

        console.log('📋 Generating checklist for topics:', topics?.length || 0);

        if (!topics || topics.length === 0) {
            return res.json({
                success: false,
                checklist: []
            });
        }

        const result = await aiService.generateComprehensiveChecklist(topics);
        
        console.log('✅ Checklist generated successfully');
        
        res.json(result);

    } catch (error) {
        console.error('❌ Generate checklist error:', error);
        res.status(500).json({
            success: false,
            checklist: [],
            error: error.message
        });
    }
});

// Generate topic overview
router.post('/ai-recap/overview', async (req, res) => {
    try {
        const { topics } = req.body;

        console.log('🎯 Generating overview for topics:', topics?.length || 0);

        if (!topics || topics.length === 0) {
            return res.json({
                success: false,
                overview: 'No topics provided.'
            });
        }

        const result = await aiService.generateTopicOverview(topics);
        
        console.log('✅ Overview generated successfully');
        
        res.json(result);

    } catch (error) {
        console.error('❌ Generate overview error:', error);
        res.status(500).json({
            success: false,
            overview: 'Failed to generate overview: ' + error.message
        });
    }
});

// ========================================
// ANALYTICS ROUTES
// ========================================

// Get all data for analytics
router.get('/analytics/data', auth, async (req, res) => {
    try {
        const userId = req.user.userId;

        console.log('📊 Optimized analytics for user:', userId);

        // =========================
        // 1. TOTAL PROBLEMS
        // =========================
        const [[{ totalSolved }]] = await db.query(`
            SELECT COUNT(*) as totalSolved
            FROM user_solved_questions
            WHERE user_id = ?
        `, [userId]);

        // =========================
        // 2. DIFFICULTY BREAKDOWN
        // =========================
        const [difficultyRows] = await db.query(`
            SELECT difficulty, COUNT(*) as count
            FROM user_solved_questions
            WHERE user_id = ?
            GROUP BY difficulty
        `, [userId]);

        const difficulty = { Easy: 0, Medium: 0, Hard: 0 };
        difficultyRows.forEach(d => {
            difficulty[d.difficulty] = d.count;
        });

        // =========================
        // 3. TOP TOPICS
        // =========================
        const [topTopics] = await db.query(`
            SELECT topic, COUNT(*) as count
            FROM learning_logs
            WHERE user_id = ?
            GROUP BY topic
            ORDER BY count DESC
            LIMIT 5
        `, [userId]);

        // =========================
        // 4. STREAK CALCULATION 🔥
        // =========================
       
        const [datesRows] = await db.query(`
            SELECT DISTINCT solved_date
            FROM user_solved_questions
            WHERE user_id = ?
        `, [userId]);

       const solvedDates = new Set(
            datesRows.map(r => r.solved_date.toISOString().slice(0, 10))
        );

        function formatDate(date) {
            return date.toISOString().split('T')[0];
        }

        let currentStreak = 0;
        let today = new Date();

        if(solvedDates.has(formatDate(today))) {
        // calculate current streak
            for (let i = 0; i < 365; i++) {
            const tempDate = new Date(today);
            tempDate.setDate(today.getDate() - i);

            const dateStr = formatDate(tempDate);

            if (solvedDates.has(dateStr)) {
                currentStreak++;
            } else {
                break;
            }
        }
}

        // =========================
        // MAX STREAK
        // =========================
        const sortedDates = Array.from(solvedDates).sort();

        let maxStreak = 0;
        let tempStreak = 0;

        for (let i = 0; i < sortedDates.length; i++) {
            if (i === 0) {
                tempStreak = 1;
            } else {
                const prev = new Date(sortedDates[i - 1]);
                const curr = new Date(sortedDates[i]);

                const diff = (curr - prev) / (1000 * 60 * 60 * 24);

                if (diff === 1) tempStreak++;
                else tempStreak = 1;
            }

            maxStreak = Math.max(maxStreak, tempStreak);
        }

        const activeDays = solvedDates.size;

                // =========================
                // 6. LEARNING LOG STATS
                // =========================
                const [[{ totalLogs }]] = await db.query(`
                    SELECT COUNT(*) as totalLogs
                    FROM learning_logs
                    WHERE user_id = ?
                `, [userId]);

                const [[{ uniqueTopics }]] = await db.query(`
                    SELECT COUNT(DISTINCT topic) as uniqueTopics
                    FROM learning_logs
                    WHERE user_id = ?
                `, [userId]);
                const [platformRows] = await db.query(`
                    SELECT platform, COUNT(*) as count
                    FROM user_solved_questions
                    WHERE user_id = ?
                    AND platform IS NOT NULL
                    AND platform != ''
                    GROUP BY platform
                `, [userId]);
                
                // =========================
                // FINAL RESPONSE (UI SAFE)
                // =========================
                res.json({
                    success: true,

                    // existing UI fields
                    totalSolved,
                    currentStreak,
                    maxStreak,
                    activeDays,

                    // charts
                    difficulty,
                    topTopics,

                    // learning stats
                    totalLogs,
                    uniqueTopics,

                    platforms : platformRows
                });

            } catch (error) {
                console.error('❌ Optimized analytics error:', error);
                res.status(500).json({ success: false });
            }
        });

// Get comparison data for specific date ranges
router.post('/analytics/compare', auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { periodA, periodB } = req.body;

        console.log('⟷ Comparison request:', { userId, periodA, periodB });

        // ======================
        // PERIOD A
        // ======================
        const [learningA] = await db.query(
            'SELECT * FROM learning_logs WHERE user_id = ? AND log_date BETWEEN ? AND ?',
            [userId, periodA.start, periodA.end]
        );

        const [codingA] = await db.query(`
            SELECT * FROM user_solved_questions 
            WHERE user_id = ? AND solved_date BETWEEN ? AND ?
        `, [userId, periodA.start, periodA.end]);

        const [problemsA] = await db.query(`
            SELECT * 
            FROM user_solved_questions
            WHERE user_id = ? 
            AND solved_date BETWEEN ? AND ?
        `, [userId, periodA.start, periodA.end]);


        // ======================
        // PERIOD B
        // ======================
        const [learningB] = await db.query(
            'SELECT * FROM learning_logs WHERE user_id = ? AND log_date BETWEEN ? AND ?',
            [userId, periodB.start, periodB.end]
        );

        const [codingB] = await db.query(`
            SELECT * FROM user_solved_questions 
            WHERE user_id = ? AND solved_date BETWEEN ? AND ?
        `, [userId, periodB.start, periodB.end]);

        const [problemsB] = await db.query(`
            SELECT * 
            FROM user_solved_questions
            WHERE user_id = ? 
            AND solved_date BETWEEN ? AND ?
        `, [userId, periodB.start, periodB.end]);

        console.log('✅ Comparison data ready');

        res.json({
            success: true,
            periodA: {
                learningLogs: learningA,
                codingLogs: codingA,
                problems: problemsA
            },
            periodB: {
                learningLogs: learningB,
                codingLogs: codingB,
                problems: problemsB
            }
        });

    } catch (error) {
        console.error('❌ Comparison error:', error);
        res.status(500).json({ success: false });
    }
});

// MOVED TO END - Module export
module.exports = router;

// ========================================
// SEARCH & FILTER ROUTES
// ========================================

// Search logs by date/filters
router.post('/search', auth, async (req, res) => {
    try {
        const { date, startDate, endDate, type, sortBy } = req.body;
        const userId = req.user.userId;
        
        console.log('🔍 Search request:', { userId, date, startDate, endDate, type, sortBy });
        
        let learningLogs = [];
        let codingLogs = [];
        
        // Build query based on filters
        let learningQuery = 'SELECT * FROM learning_logs WHERE user_id = ?';
        let codingQuery = 'SELECT * FROM user_solved_questions WHERE user_id = ?';
        
        const learningParams = [userId];
        const codingParams = [userId];
        
        // Date filters
        if (date) {
            learningQuery += ' AND log_date = ?';
            codingQuery += ' AND solved_date = ?';
            learningParams.push(date);
            codingParams.push(date);
        } else if (startDate && endDate) {
            learningQuery += ' AND log_date BETWEEN ? AND ?';
            codingQuery += ' AND solved_date BETWEEN ? AND ?';
            learningParams.push(startDate, endDate);
            codingParams.push(startDate, endDate);
        }
        
        // Sorting
        const sortOrder = sortBy === 'oldest' ? 'ASC' : 'DESC';
        learningQuery += ` ORDER BY log_date ${sortOrder}, created_at ${sortOrder}`;
        codingQuery += ` ORDER BY solved_date ${sortOrder}, created_at ${sortOrder}`;
        
        // Fetch based on type filter
        if (!type || type === 'all' || type === 'learning') {
            const [results] = await db.query(learningQuery, learningParams);
            learningLogs = results.map(log => ({
                ...log,
                type: 'learning',
                log_id: log.id,
                title: log.topic,
                description: log.content,
                date: log.log_date
            }));
        }
        
        if (!type || type === 'all' || type === 'coding') {
            const [results] = await db.query(codingQuery, codingParams);
            codingLogs = results.map(log => ({
                ...log,
                type: 'coding',
                log_id: log.id,
                title: log.problem_name || 'Coding Problem',
                description: log.approach_solution,
                date: log.solved_date
            }));
        }
        
        const allLogs = [...learningLogs, ...codingLogs];
        
        // Sort combined results
        allLogs.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return sortBy === 'oldest' ? dateA - dateB : dateB - dateA;
        });
        
        console.log('✅ Found', allLogs.length, 'logs');
        
        res.json({
            success: true,
            logs: allLogs,
            count: allLogs.length
        });
        
    } catch (error) {
        console.error('❌ Search error:', error);
        res.status(500).json({ success: false, logs: [], count: 0 });
    }
});

// Get single log details
router.get('/details/:type/:id', auth, async (req, res) => {
    try {
        const { type, id } = req.params;
        const userId = req.user.userId;
        
        let log = null;
        
        if (type === 'learning') {
            const [results] = await db.query(
                'SELECT * FROM learning_logs WHERE id = ? AND user_id = ?',
                [id, userId]
            );
            log = results[0];
        } else if (type === 'coding') {
            const [results] = await db.query(
                'SELECT * FROM user_solved_questions WHERE id = ? AND user_id = ?',
                [id, userId]
            );
            log = results[0];
        }
        
        if (!log) {
            return res.status(404).json({ success: false, message: 'Log not found' });
        }
        
        res.json({ success: true, log });
        
    } catch (error) {
        console.error('❌ Get log details error:', error);
        res.status(500).json({ success: false });
    }
});

// Update learning log
router.put('/learning/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { topic, content, challenges, log_date } = req.body;
        const userId = req.user.userId;

        // 1️⃣ Get OLD data
        const [oldData] = await db.query(
            'SELECT * FROM learning_logs WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (oldData.length === 0) {
            return res.status(404).json({ success: false, message: 'Log not found' });
        }

        const old = oldData[0];

        // 2️⃣ Save to history
        await db.query(`
            INSERT INTO log_edit_history 
            (log_id, user_id, type, topic, content, challenges, log_date)
            VALUES (?, ?, 'learning', ?, ?, ?, ?)
        `, [
            id,
            userId,
            old.topic,
            old.content,
            old.challenges,
            old.log_date
        ]);

        // 3️⃣ Update main table
        await db.query(
            'UPDATE learning_logs SET topic = ?, content = ?, challenges = ?, log_date = ? WHERE id = ? AND user_id = ?',
            [topic, content, challenges || '', log_date, id, userId]
        );

        res.json({ success: true, message: 'Learning log updated + history saved' });

    } catch (error) {
        console.error('❌ Update learning log error:', error);
        res.status(500).json({ success: false });
    }
});

// Update coding log
router.put('/coding/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { topic, approach_solution, logic_steps, mistakes_faced, solved_date } = req.body;
        const userId = req.user.userId;

        // 1️⃣ Get existing log (OLD DATA)
        const [oldData] = await db.query(
            'SELECT * FROM user_solved_questions WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (oldData.length === 0) {
            return res.status(404).json({ success: false, message: 'Log not found' });
        }

        const old = oldData[0];

        // 2️⃣ SAVE OLD DATA TO HISTORY
        await db.query(`
            INSERT INTO log_edit_history 
            (log_id, user_id, type, topic, approach_solution, logic_steps, mistakes_faced, log_date)
            VALUES (?, ?, 'coding', ?, ?, ?, ?, ?)
        `, [
            id,
            userId,
            old.topic_name,
            old.approach_solution,
            old.logic_steps,
            old.mistakes_faced,
            old.solved_date
        ]);

        // 3️⃣ UPDATE MAIN TABLE
        const [result] = await db.query(
            'UPDATE user_solved_questions SET topic_name = ?, approach_solution = ?, logic_steps = ?, mistakes_faced = ?, solved_date = ? WHERE id = ? AND user_id = ?',
            [
                topic,
                approach_solution || '',
                logic_steps || '',
                mistakes_faced,
                solved_date,
                id,
                userId
            ]
        );

        res.json({ success: true, message: 'Coding log updated + history saved' });

    } catch (error) {
        console.error('❌ Update coding log error:', error);
        res.status(500).json({ success: false });
    }
});

router.get('/history/:type/:id', auth, async (req, res) => {
    try {
        const { id, type } = req.params;
        const userId = req.user.userId;

        const [rows] = await db.query(
            'SELECT * FROM log_edit_history WHERE log_id = ? AND user_id = ? AND type = ? ORDER BY edited_at DESC',
            [id, userId, type]
        );

        res.json({ success: true, history: rows });

    } catch (err) {
        console.error('History error:', err);
        res.status(500).json({ success: false });
    }
});

// Delete log
router.delete('/:type/:id', auth, async (req, res) => {
    try {
        const { type, id } = req.params;
        const userId = req.user.userId;
        
        console.log('🗑️ Deleting log:', type, id);
        
        if (type === 'learning') {
            const [result] = await db.query(
                'DELETE FROM learning_logs WHERE id = ? AND user_id = ?',
                [id, userId]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Log not found' });
            }
        } else if (type === 'coding') {
            const [result] = await db.query(
                'DELETE FROM user_solved_questions WHERE id = ? AND user_id = ?',
                [id, userId]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Log not found' });
            }
        }
        
        console.log('✅ Log deleted');
        
        res.json({ success: true, message: 'Log deleted successfully' });
        
    } catch (error) {
        console.error('❌ Delete log error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete log' });
    }
});