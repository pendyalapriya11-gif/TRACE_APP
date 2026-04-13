async function callGeminiAPI(prompt) {
    const API_KEY = process.env.GEMINI_API_KEY;

    const models = [
        // "gemini-2.5-flash",   // try best first
        // "gemini-2.0-flash",   // fallback
        "gemini-flash-latest" // backup
    ];

    for (let model of models) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            const data = await response.json();
            return data.candidates[0].content.parts[0].text;

        } catch (error) {
            console.log(`⚠️ Model ${model} failed, trying next...`);
        }
    }

    throw new Error("All Gemini models failed");
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
        
        const text = await callGeminiAPI(prompt);

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

        const text = await callGeminiAPI(prompt);
        
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

        const text = await callGeminiAPI(prompt);

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
    generateTopicOverview
};