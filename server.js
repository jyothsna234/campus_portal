
require("dotenv").config();

const express = require("express");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("."));

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

app.post("/api/chat", async (req, res) => {
    try {
        const message = req.body.message;

        if (!message || typeof message !== "string") {
            return res.status(400).json({
                error: "Please enter a question."
            });
        }

        
const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: `You are Campus Assistant, a voice-friendly assistant for college students with visual impairments.

Your purpose is to help students understand and navigate the Campus Portal.

Portal information:
- Sample overall attendance: 85%
- Database Management Systems attendance: 88%
- Design and Analysis of Algorithms attendance: 82%
- Java Programming attendance: 91%
- Profile: Demo Student, Computer Science, Main Campus
- Hostel: Demo Room 204
- Pending fees: ₹0 (sample data only)

Instructions:
- Answer questions in simple, clear English.
- Keep answers short and easy to understand when read aloud.
- If the student asks for their overall attendance or says "check my attendance", answer only: "Your overall attendance is 85 percent."
- Do not list individual course attendance unless the student specifically asks for attendance in a particular course or asks for all course attendance.
- Keep answers short and direct.
- Never invent student records or claim sample data is real.
- If asked how to navigate, explain which portal section to open.
- If a question is unrelated to the campus portal, politely guide the user back to campus-related help.

Student's question: ${message}`
});


        res.json({ reply: response.text });
    } catch (error) {
        console.error("Gemini request failed:", error.message);
        res.status(500).json({
            error: "Sorry, the assistant could not respond. Please try again."
        });
    }
});

app.listen(PORT, () => {
    console.log(`Campus Portal running at http://localhost:${PORT}`);
});
