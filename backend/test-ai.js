require('dotenv').config();
const aiService = require('./services/aiService');

async function test() {
    console.log("🧪 Testing AI Service...");
    console.log("API Key exists:", !!process.env.GEMINI_API_KEY);
    
    // Test summary
    const testLogs = [
        {
            type: 'learning',
            topic: 'JavaScript Arrays',
            content: 'Learned map, filter, reduce',
            challenges: 'Had trouble with reduce',
            log_date: '2026-04-05'
        }
    ];
    
    const summary = await aiService.generateSummary(testLogs);
    console.log("\n✅ Summary Result:", summary);
    
    // Test checklist
    const checklist = await aiService.generateChecklist(['JavaScript Arrays', 'React Hooks']);
    console.log("\n✅ Checklist Result:", checklist);
    
    // Test overview
    const overview = await aiService.generateTopicOverview(['Promises', 'Async/Await']);
    console.log("\n✅ Overview Result:", overview);
}

test();