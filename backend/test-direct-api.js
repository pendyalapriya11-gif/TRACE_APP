require('dotenv').config();

async function testDirectAPI() {
    const API_KEY = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
    console.log("🧪 Testing direct API call...");
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: "Say hello!" }]
                }]
            })
        });
        
        const data = await response.json();
        
        if (data.candidates) {
            console.log("✅ Success!");
            console.log("Response:", data.candidates[0].content.parts[0].text);
        } else {
            console.log("❌ Error:", JSON.stringify(data, null, 2));
        }
        
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

testDirectAPI();