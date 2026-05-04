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
            const logDetails = logs.map(log => {
                if (log.type === 'learning') {
                    return `  • ${log.log_date}: Learned → ${log.content}`;
                } else {
                    return `  • ${log.log_date}: Solved ${log.problem_name || ''} (${log.difficulty || ''}) on ${log.platform || ''}. ${
                    log.challenges ? `Mistakes: ${log.challenges}` : ''
                }`;
                }
            }).join('\n');
            
            return `Topic: ${topic}\n${logDetails}`;
        }).join('\n\n');

       const prompt = `
            You are an expert coding mentor.

            Analyze the student's learning activity logs:

            ${topicSummaries}

            -----------------------------------
            PART 1: CONCEPT SUMMARY (DETAILED)
            -----------------------------------
            For EACH topic:

            Explain clearly in 5–6 lines:

            - What the topic is (definition)
            - Key concepts involved
            - What the student practiced (based on logs)
            - How the concept is used in problem solving

            Do NOT give short answers.
            Do NOT say "learned syntax".
            Explain like teaching a beginner properly.

            -----------------------------------
            PART 2: PROGRESS ANALYSIS
            -----------------------------------
            For EACH topic:

            📈 Progress Level:
            (Beginner / Improving / Strong)

            Explain WHY based on logs (2–3 lines).

            -----------------------------------
            PART 3: WEAK AREAS (DEEP ANALYSIS)
            -----------------------------------
            Weak topics data:
            ${JSON.stringify(weakTopics)}

            For EACH topic:

            ⚠️ Mistake:
            - What mistake the student is making

            🧠 Why it happens:
            - Explain root cause (concept gap / misunderstanding / lack of practice)
            - Give real reasoning, not generic

            💡 How to fix:
            - Exact concept or pattern to learn

            🚀 Next Step:
            - Specific practice (type of problems)

            -----------------------------------
            OUTPUT FORMAT:

            **[TOPIC NAME]**

            📘 Concept Summary:
            (5–6 lines detailed explanation)

            📈 Progress:
            (level + reason)

            ⚠️ Mistake:
            (if exists)

            🧠 Why it happens:
            (clear reasoning)

            💡 Fix:
            (actionable solution)

            🚀 Next Step:
            (practice guidance)

            -----------------------------------
            RULES:
            - Minimum 5 lines for concept summary
            - No generic statements
            - Explain concepts, not just mention them
            - Weak areas must include WHY + FIX
            - Be specific and practical
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
