require('dotenv').config();

console.log("🔑 Checking Gemini API Key...");
console.log("API Key exists:", !!process.env.GEMINI_API_KEY);
console.log("API Key length:", process.env.GEMINI_API_KEY?.length || 0);
console.log("API Key preview:", process.env.GEMINI_API_KEY?.substring(0, 10) + "...");

const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testAPI() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // Try different model names
        const models = [
            "gemini-1.5-flash-latest",
            "gemini-pro",
            "gemini-1.5-pro-latest"
        ];
        
        for (const modelName of models) {
            try {
                console.log(`\n🧪 Testing model: ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });
                
                const result = await model.generateContent("Say 'Hello, API is working!'");
                const text = result.response.text();
                
                console.log("✅ API Response:", text);
                console.log(`\n✅ SUCCESS! Use this model: ${modelName}`);
                return;
                
            } catch (error) {
                console.log(`❌ ${modelName} failed:`, error.message);
            }
        }
        
        console.log("\n❌ All models failed");
        
    } catch (error) {
        console.error("\n❌ API ERROR:", error.message);
    }
}

testAPI();