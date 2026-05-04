async function callGroqAPI(prompt) {
    const API_KEY = process.env.GROQ_API_KEY;  // ← changed

    const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',  // ← changed
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`  // ← changed
            },
            body: JSON.stringify({
                model:  'llama-3.3-70b-versatile',  // ← changed
                messages: [{ role: 'user', content: prompt }],  // ← changed
                max_tokens: 1500
            })
        }
    );

    const raw = await response.text();
    console.log("🔥 RAW RESPONSE:", raw);

    if (!response.ok) {
        throw new Error(raw);
    }

    const data = JSON.parse(raw);

    return data.choices?.[0]?.message?.content || "";  // ← changed
}

// Generate Topic-Wise Summary
async function generateTopicWiseSummary(groupedLogs, weakTopics = []) {
    try {
        console.log("📊 AI Summary - Starting...");
        
        const topicSummaries = Object.entries(groupedLogs).map(([topic, logs]) => {
            const logDetails = logs.map((log, index) => {
                if (log.type === 'learning') {
                    return `  ${index + 1}. ${log.log_date}: Learned → ${log.content}`;
                } else {
                    return `  ${index + 1}. ${log.log_date}: Solved ${log.problem_name || ''} (${log.difficulty || ''}) on ${log.platform || ''}.
                ${log.challenges ? `⚠️ Mistake: ${log.challenges}` : 'No mistakes recorded'}`;
                }
            }).join('\n');
            
            return `Topic: ${topic}\n${logDetails}`;
        }).join('\n\n');

       const prompt = `
You are an expert coding mentor analyzing a student's learning logs.

========================
STUDENT LOGS
========================
${topicSummaries}

========================
WEAK TOPICS DATA
========================
${JSON.stringify(weakTopics)}

====================================================
TASK: ANALYZE IN DEPTH (DO NOT SKIP ANY SECTION)
====================================================

For EACH topic, you MUST generate ALL sections below.

-----------------------------------
PART 1: CONCEPT SUMMARY (DETAILED)
-----------------------------------
Write a clear explanation in 5–6 lines:

- What the topic is (definition)
- Key concepts involved
- What the student practiced (based on logs)
- How it is used in problem solving
- Keep it simple but informative

STRICT RULES:
- Do NOT say "learned syntax"
- Do NOT be generic
- Minimum 5 lines

-----------------------------------
PART 2: PROGRESS ANALYSIS
-----------------------------------
📈 Progress Level: Beginner / Improving / Strong

Explain in 2–3 lines WHY:
- Based on repetition
- Based on complexity of problems
- Based on consistency

-----------------------------------
PART 3: MISTAKE PATTERN DETECTION (VERY IMPORTANT)
-----------------------------------

From the logs, identify REAL patterns in mistakes.

You MUST:
- Combine similar mistakes
- Identify recurring issues (not one-time mistakes)
-If very few mistakes exist, infer likely weaknesses from learning behavior

Examples of patterns:
- Edge case handling issues
- Incorrect logic application
- Confusion between concepts
- Syntax vs logic gap

-----------------------------------
PART 4: ROOT CAUSE ANALYSIS
-----------------------------------

🧠 Why it happens:

For each mistake pattern:
- Explain the actual reason
- Choose one:
  - Concept gap
  - Lack of practice
  - Misunderstanding problem
  - Pattern recognition failure

NO generic answers like "needs practice"

-----------------------------------
PART 5: FIX STRATEGY
-----------------------------------

💡 How to fix:

- Give specific actions
- Mention exact concepts/patterns
- Mention what to study or revise

-----------------------------------
PART 6: NEXT STEP
-----------------------------------

🚀 Next Step:

- Suggest concrete practice:
  - type of problems
  - difficulty level
  - pattern (e.g., sliding window, DFS)

-----------------------------------
FINAL OUTPUT FORMAT (STRICT)
-----------------------------------

**[TOPIC NAME]**

📘 Concept Summary:
(5–6 lines explanation)

📈 Progress:
(level + reason)

⚠️ Mistake Pattern:
(identified pattern OR "No clear pattern detected")

🧠 Why it happens:
(deep explanation)

💡 Fix:
(actionable solution)

🚀 Next Step:
(practical guidance)

-----------------------------------
GLOBAL RULES:
-----------------------------------
- DO NOT skip any section
- DO NOT give generic advice
- MUST extract patterns (not individual mistakes)
- MUST explain WHY mistakes happen
- MUST be specific and structured
- Minimum depth required in each section
`;
        const text = await callGroqAPI(prompt);

        console.log("✅ Summary generated");

        return {
            success: true,
            summary: text
        };

    } catch (error) {
        console.error("❌ Summary error:", error.message);
        return {
            success: false,
            summary: "Failed to generate summary. Check API key and internet."
        };
    }
}

// Generate Checklist
async function generateComprehensiveChecklist(topics) {
    try {
        console.log("📋 Generating checklist...");
        
        const prompt = `Student studied: ${topics.join(', ')}

Generate a comprehensive learning checklist including related topics.

Return ONLY valid JSON:
{
  "checklist": [
    {
      "mainTopic": "Topic Name",
      "subtopics": ["Sub1", "Sub2", "Sub3"]
    }
  ]
}`;

        const text = await callGroqAPI(prompt);
        
        // Clean and parse
        let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);

        return {
            success: true,
            checklist: parsed.checklist
        };

    } catch (error) {
        console.error("❌ Checklist error:", error.message);
        
        return {
            success: true,
            checklist: topics.map(topic => ({
                mainTopic: topic,
                subtopics: [
                    `Fundamentals of ${topic}`,
                    `Common patterns in ${topic}`,
                    `Best practices for ${topic}`
                ]
            }))
        };
    }
}

// Generate Overview
async function generateTopicOverview(topics) {
    try {
        console.log("📖 Generating overview...");
        
        const prompt = `Student needs to learn: ${topics.join(', ')}

For EACH topic provide:

**[Topic Name]**
📝 Overview: (2-3 sentences)
🎯 Why Important: (brief)
🔑 Key Concepts: (list)
📚 Learning Path: (steps)

Keep concise.`;

        const text = await callGroqAPI(prompt);

        return {
            success: true,
            overview: text
        };

    } catch (error) {
        console.error("❌ Overview error:", error.message);
        return {
            success: false,
            overview: "Failed to generate overview."
        };
    }
}

module.exports = {
    generateTopicWiseSummary,
    generateComprehensiveChecklist,
    generateTopicOverview,
};
