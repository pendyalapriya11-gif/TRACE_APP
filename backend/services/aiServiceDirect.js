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
                max_tokens: 1000
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
                    return `  • ${log.log_date}: ${log.content}`;
                } else {
                    return `  • ${log.log_date}: Solved problem (${log.question_name || ''}) [${log.platform || ''}, ${log.difficulty || ''}]. ${
                        log.challenges ? `Mistakes: ${log.challenges}` : ''
                    }`;
                }
            }).join('\n');
            
            return `Topic: ${topic}\n${logDetails}`;
        }).join('\n\n');

        const prompt = `
            You are an expert coding mentor.

            Analyze the student's learning activity:

            ${topicSummaries}

            Weak areas:
            ${JSON.stringify(weakTopics)}

            Focus strongly on mistakes. Give specific problem patterns to practice.
            Avoid generic advice.

            For EACH topic provide:

            **[TOPIC NAME]**
            📊 Progress Level: (Beginner / Intermediate / Strong)
            ⚠️ Key Weakness: (based on mistakes)
            💡 What to Improve: (specific actionable advice)
            🚀 Next Step: (what to practice next)

            Be precise. Avoid generic advice.
            `;

        console.log("🤖 Calling Gemini API...");
        
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
