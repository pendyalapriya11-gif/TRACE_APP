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
    try {
        const { question_id, topic, approach_solution, mistakes_faced, solved_date } = req.body;
        const userId = req.user.userId;

        if (!mistakes_faced || mistakes_faced.trim() === '') {
            return res.status(400).json({ success: false, message: 'Mistakes field is required' });
        }

        // ✅ Normalize topic
        const normalized = normalizeTopic(topic);

        // ✅ Check if topic exists
        const [existing] = await db.query(
            'SELECT * FROM user_topics WHERE user_id = ? AND normalized_topic = ?',
            [userId, normalized]
        );

        // ✅ Insert if not exists
        if (existing.length === 0) {
            await db.query(
                'INSERT INTO user_topics (user_id, normalized_topic, display_name) VALUES (?, ?, ?)',
                [userId, normalized, topic]
            );
        }

        // ✅ Save solved question
        await db.query(
            `INSERT INTO user_solved_questions 
            (user_id, question_id, topic, approach_solution, mistakes_faced, solved_date) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, question_id, topic, approach_solution || '', mistakes_faced, solved_date]
        );

        res.json({ success: true });

    } catch (error) {
        console.error('Save question error:', error);
        res.status(500).json({ success: false, message: 'Failed to save' });
    }
});

// ========================================
// DASHBOARD ROUTES
// ========================================

// Get Dashboard Stats
router.get('/dashboard/stats', auth, async (req, res) => {
    try {
        const userId = req.user.userId; // FIXED
        const today = new Date();
        const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const fourteenDaysAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

        // Calculate current streak
        let currentStreak = 0;
        let dayOffset = 0;
        
        while (true) {
            const checkDate = new Date(today.getTime() - dayOffset * 24 * 60 * 60 * 1000);
            const dateStr = checkDate.toISOString().split('T')[0];
            
            const [logs] = await db.query(
                'SELECT id FROM learning_logs WHERE user_id = ? AND log_date = ? UNION SELECT id FROM coding_logs WHERE user_id = ? AND log_date = ?',
                [userId, dateStr, userId, dateStr]
            );
            
            if (logs.length > 0) {
                currentStreak++;
                dayOffset++;
            } else {
                break;
            }
        }

        // Calculate last week streak
        let lastWeekStreak = 0;
        dayOffset = 7;
        
        while (dayOffset < 14) {
            const checkDate = new Date(today.getTime() - dayOffset * 24 * 60 * 60 * 1000);
            const dateStr = checkDate.toISOString().split('T')[0];
            
            const [logs] = await db.query(
                'SELECT id FROM learning_logs WHERE user_id = ? AND log_date = ? UNION SELECT id FROM coding_logs WHERE user_id = ? AND log_date = ?',
                [userId, dateStr, userId, dateStr]
            );
            
            if (logs.length > 0) {
                lastWeekStreak++;
                dayOffset++;
            } else {
                break;
            }
        }

        // Get unique topics this week
        const [thisWeekTopics] = await db.query(
            'SELECT DISTINCT topic FROM learning_logs WHERE user_id = ? AND log_date >= ? UNION SELECT DISTINCT topics_covered FROM coding_logs WHERE user_id = ? AND log_date >= ?',
            [userId, sevenDaysAgo.toISOString().split('T')[0], userId, sevenDaysAgo.toISOString().split('T')[0]]
        );

        // Get unique topics last week
        const [lastWeekTopics] = await db.query(
            'SELECT DISTINCT topic FROM learning_logs WHERE user_id = ? AND log_date >= ? AND log_date < ? UNION SELECT DISTINCT topics_covered FROM coding_logs WHERE user_id = ? AND log_date >= ? AND log_date < ?',
            [userId, fourteenDaysAgo.toISOString().split('T')[0], sevenDaysAgo.toISOString().split('T')[0], userId, fourteenDaysAgo.toISOString().split('T')[0], sevenDaysAgo.toISOString().split('T')[0]]
        );

        // Count coding problems this week
        const [thisWeekProblems] = await db.query(
            'SELECT COUNT(*) as count FROM coding_problems cp JOIN coding_logs cl ON cp.coding_log_id = cl.id WHERE cl.user_id = ? AND cl.log_date >= ?',
            [userId, sevenDaysAgo.toISOString().split('T')[0]]
        );

        // Count coding problems last week
        const [lastWeekProblems] = await db.query(
            'SELECT COUNT(*) as count FROM coding_problems cp JOIN coding_logs cl ON cp.coding_log_id = cl.id WHERE cl.user_id = ? AND cl.log_date >= ? AND cl.log_date < ?',
            [userId, fourteenDaysAgo.toISOString().split('T')[0], sevenDaysAgo.toISOString().split('T')[0]]
        );

        res.json({
            success: true,
            stats: {
                streak: {
                    current: currentStreak,
                    lastWeek: lastWeekStreak
                },
                topics: {
                    current: thisWeekTopics.length,
                    lastWeek: lastWeekTopics.length
                },
                problems: {
                    current: thisWeekProblems[0].count,
                    lastWeek: lastWeekProblems[0].count
                }
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            stats: {
                streak: { current: 0, lastWeek: 0 },
                topics: { current: 0, lastWeek: 0 },
                problems: { current: 0, lastWeek: 0 }
            }
        });
    }
});

// Get Recent Activity
router.get('/dashboard/activity', auth, async (req, res) => {
    try {
        const userId = req.user.userId; 

        // Get recent learning logs
        const [learningLogs] = await db.query(
            'SELECT topic, content as notes, log_date as date, "learning" as type FROM learning_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 3',
            [userId]
        );

        // Get recent coding logs
        const [codingLogs] = await db.query(
            'SELECT topics_covered as topic, challenges_mistakes as notes, log_date as date, "coding" as type FROM coding_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 3',
            [userId]
        );

        // Combine and sort
        const allLogs = [...learningLogs, ...codingLogs]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        res.json({
            success: true,
            activity: allLogs
        });
    } catch (error) {
        console.error('Activity error:', error);
        res.json({ success: true, activity: [] });
    }
});

// Get Weak Areas
router.get('/dashboard/weak-areas', auth, async (req, res) => {
    try {
        const userId = req.user.userId; 

        // Get topics from learning logs
        const [topics] = await db.query(
            'SELECT topic, COUNT(*) as count FROM learning_logs WHERE user_id = ? AND challenges IS NOT NULL AND challenges != "" GROUP BY topic HAVING count >= 3 ORDER BY count DESC LIMIT 5',
            [userId]
        );

        res.json({
            success: true,
            weakAreas: topics.map(t => ({
                topic: t.topic,
                count: t.count,
                difficulty: Math.min(t.count * 20, 100)
            }))
        });
    } catch (error) {
        console.error('Weak areas error:', error);
        res.json({ success: true, weakAreas: [] });
    }
});

// ========================================
// AI RECAP ROUTES
// ========================================

// Get logs for AI recap (grouped by topic)
router.post('/ai-recap/logs', async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        const userId = 1;

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
            usq.topic,
            usq.mistakes_faced as challenges,
            usq.solved_date as log_date,
            "coding" as type,
            qb.question_name,
            qb.difficulty,
            qb.platform
        FROM user_solved_questions usq
        JOIN question_bank qb ON usq.question_id = qb.id
        WHERE usq.user_id = ? 
        AND usq.solved_date BETWEEN ? AND ?
        ORDER BY usq.topic, usq.solved_date ASC`,
        [userId, startDate, endDate]
        );

        console.log('💻 Coding logs found:', codingLogs.length);

        const allLogs = [...learningLogs, ...codingLogs];

        // Group logs by topic
        const groupedLogs = {};
        allLogs.forEach(log => {
            const topic = log.topic || 'General';
            if (!groupedLogs[topic]) {
                groupedLogs[topic] = [];
            }
            groupedLogs[topic].push(log);
        });

        console.log('✅ Topics found:', Object.keys(groupedLogs).length);

        res.json({
            success: true,
            logs: allLogs,
            groupedLogs: groupedLogs,
            topics: Object.keys(groupedLogs)
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
        const { groupedLogs } = req.body;

        console.log('🤖 Generating summary for topics:', Object.keys(groupedLogs || {}).length);

        if (!groupedLogs || Object.keys(groupedLogs).length === 0) {
            return res.json({
                success: false,
                summary: 'No logs found for the selected period.'
            });
        }

        const result = await aiService.generateTopicWiseSummary(groupedLogs);
        
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
        const userId = 1; // FIXED

        console.log('📊 Analytics data request for user:', userId);

        // Get all learning logs
        const [learningLogs] = await db.query(
            'SELECT * FROM learning_logs WHERE user_id = ? ORDER BY log_date DESC',
            [userId]
        );

        console.log('📝 Learning logs found:', learningLogs.length);

        // Get all coding logs
        const [codingLogs] = await db.query(
            'SELECT cl.* FROM coding_logs cl WHERE cl.user_id = ? ORDER BY cl.log_date DESC',
            [userId]
        );

        console.log('💻 Coding logs found:', codingLogs.length);

        // Get all coding problems with details
        const [codingProblems] = await db.query(
            'SELECT cp.*, cl.log_date FROM coding_problems cp JOIN coding_logs cl ON cp.coding_log_id = cl.id WHERE cl.user_id = ? ORDER BY cl.log_date DESC',
            [userId]
        );

        console.log('🎯 Coding problems found:', codingProblems.length);

        res.json({
            success: true,
            learningLogs,
            codingLogs,
            codingProblems
        });

    } catch (error) {
        console.error('❌ Analytics data error:', error);
        res.status(500).json({
            success: false,
            learningLogs: [],
            codingLogs: [],
            codingProblems: []
        });
    }
});

// Get comparison data for specific date ranges
router.post('/analytics/compare', auth, async (req, res) => {
    try {
        const userId = req.user.userId; // FIXED
        const { periodA, periodB } = req.body;

        console.log('⟷ Comparison request:', { userId, periodA, periodB });

        // Period A data
        const [learningA] = await db.query(
            'SELECT * FROM learning_logs WHERE user_id = ? AND log_date BETWEEN ? AND ?',
            [userId, periodA.start, periodA.end]
        );

        const [codingA] = await db.query(
            'SELECT cl.* FROM coding_logs cl WHERE cl.user_id = ? AND cl.log_date BETWEEN ? AND ?',
            [userId, periodA.start, periodA.end]
        );

        const [problemsA] = await db.query(
            'SELECT cp.* FROM coding_problems cp JOIN coding_logs cl ON cp.coding_log_id = cl.id WHERE cl.user_id = ? AND cl.log_date BETWEEN ? AND ?',
            [userId, periodA.start, periodA.end]
        );

        // Period B data
        const [learningB] = await db.query(
            'SELECT * FROM learning_logs WHERE user_id = ? AND log_date BETWEEN ? AND ?',
            [userId, periodB.start, periodB.end]
        );

        const [codingB] = await db.query(
            'SELECT cl.* FROM coding_logs cl WHERE cl.user_id = ? AND cl.log_date BETWEEN ? AND ?',
            [userId, periodB.start, periodB.end]
        );

        const [problemsB] = await db.query(
            'SELECT cp.* FROM coding_problems cp JOIN coding_logs cl ON cp.coding_log_id = cl.id WHERE cl.user_id = ? AND cl.log_date BETWEEN ? AND ?',
            [userId, periodB.start, periodB.end]
        );

        console.log('✅ Comparison data retrieved');

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