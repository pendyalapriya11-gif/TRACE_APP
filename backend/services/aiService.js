const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use the model that works from your test
const MODEL_NAME = "gemini-1.5-flash-latest"; // or "gemini-pro"

// Generate Topic-Wise Summary
async function generateTopicWiseSummary(groupedLogs) {
    try {
        console.log("📊 AI Summary - Starting...");
        console.log("📊 Topics to analyze:", Object.keys(groupedLogs));
        
        const model = genAI.getGenerativeModel({ 
            model: MODEL_NAME,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2000,
            }
        });

        // Format logs by topic
        const topicSummaries = Object.entries(groupedLogs).map(([topic, logs]) => {
            const logDetails = logs.map(log => {
                if (log.type === 'learning') {
                    return `  • ${log.log_date}: Learned ${log.content}. ${log.challenges ? `Challenges: ${log.challenges}` : ''}`;
                } else {
                    return `  • ${log.log_date}: Coding practice (${log.problem_count || 0} problems). ${log.challenges_mistakes ? `Issues: ${log.challenges_mistakes}` : ''}`;
                }
            }).join('\n');
            
            return `Topic: ${topic}\n${logDetails}`;
        }).join('\n\n');

        const prompt = `You are an AI learning assistant analyzing a student's study logs.

STUDENT'S LEARNING LOGS (GROUPED BY TOPIC):
${topicSummaries}

For EACH topic above, provide a detailed analysis in this EXACT format:

**[TOPIC NAME]**
📝 **What You Learned:**
- Summarize the key concepts and skills covered
- Highlight main achievements

⚠️ **Challenges & Weakpoints:**
- List specific difficulties encountered
- Identify patterns in struggles
- Note areas needing more practice

💡 **Suggestions:**
- Specific topics to revise
- Recommended next steps
- Practice exercises to try

---

Repeat for each topic. Be specific, actionable, and encouraging.`;

        console.log("🤖 Calling Gemini API...");
        
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        console.log("✅ AI Summary generated successfully");

        return {
            success: true,
            summary: text
        };

    } catch (error) {
        console.error("❌ AI Summary error:", error.message);
        
        return {
            success: false,
            summary: `Failed to generate summary.\n\nError: ${error.message}\n\nPlease check:\n1. Your internet connection\n2. Backend terminal for details`
        };
    }
}

// Generate Comprehensive Checklist
async function generateComprehensiveChecklist(topics) {
    try {
        console.log("📋 AI Checklist - Starting for topics:", topics);
        
        const model = genAI.getGenerativeModel({ 
            model: MODEL_NAME,
            generationConfig: {
                temperature: 0.5,
                maxOutputTokens: 1500,
            }
        });

        const topicsText = topics.join(', ');

        const prompt = `You are an AI learning assistant for programming and technology.

The student has studied: ${topicsText}

Generate a COMPREHENSIVE learning checklist that includes:
1. Topics they studied
2. RELATED topics they should learn (expand the scope)

Example expansions:
- Arrays → Strings, Objects, Hash Maps, Sets
- React Hooks → State Management, Context API, useEffect, Custom Hooks
- CSS Flexbox → Grid, Positioning, Responsive Design

Return ONLY valid JSON (no markdown, no explanation):

{
  "checklist": [
    {
      "mainTopic": "JavaScript Fundamentals",
      "subtopics": [
        "Variables and Data Types",
        "Arrays and Array Methods",
        "Objects and Properties",
        "Functions and Closures",
        "ES6+ Features"
      ]
    }
  ]
}

Include 6-10 subtopics per main topic.`;

        console.log("🤖 Calling Gemini API for checklist...");

        const result = await model.generateContent(prompt);
        let text = result.response.text();

        console.log("📥 Raw response:", text.substring(0, 100));

        // Clean markdown
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        let parsed;
        try {
            parsed = JSON.parse(text);
        } catch (parseError) {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
            } else {
                throw parseError;
            }
        }

        console.log("✅ Checklist generated:", parsed.checklist.length, "topics");

        return {
            success: true,
            checklist: parsed.checklist
        };

    } catch (error) {
        console.error("❌ AI Checklist error:", error.message);
        
        return {
            success: true,
            checklist: topics.map(topic => ({
                mainTopic: topic,
                subtopics: [
                    `Fundamentals of ${topic}`,
                    `Common operations and methods`,
                    `Best practices and patterns`,
                    `Real-world applications`,
                    `Advanced techniques`,
                    `Common problems and solutions`
                ]
            }))
        };
    }
}

// Generate Topic Overview
async function generateTopicOverview(topics) {
    try {
        console.log("📖 AI Overview - Starting for topics:", topics);
        
        const model = genAI.getGenerativeModel({ 
            model: MODEL_NAME,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2000,
            }
        });

        const topicsText = topics.join(', ');

        const prompt = `You are an AI learning assistant. The student needs to learn these topics: ${topicsText}

For EACH topic, provide a learning guide in this format:

**[Topic Name]**

📝 **Overview:**
Clear 2-3 sentence explanation of what this topic is about.

🎯 **Why It Matters:**
Why this is important in programming/development.

🔑 **Key Concepts to Master:**
- Concept 1
- Concept 2
- Concept 3

📚 **Learning Path:**
Step-by-step approach to learning this topic.

🎓 **Practice Ideas:**
Hands-on exercises to try.

---

Repeat for each topic. Keep each topic 150-200 words.`;

        console.log("🤖 Calling Gemini API for overview...");

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        console.log("✅ Overview generated successfully");

        return {
            success: true,
            overview: text
        };

    } catch (error) {
        console.error("❌ AI Overview error:", error.message);
        
        return {
            success: false,
            overview: `Failed to generate overview.\n\nError: ${error.message}`
        };
    }
}

module.exports = {
    generateTopicWiseSummary,
    generateComprehensiveChecklist,
    generateTopicOverview
};