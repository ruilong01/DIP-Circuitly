// GeminiService.js - Natively handles communication with the Google Gemini API

window.GeminiService = {
    // =========================================================================
    // ⚠️ IMPORTANT: Replace 'YOUR_API_KEY_HERE' with your real Gemini API key
    // You can get one for free at: https://aistudio.google.com/app/apikey
    // =========================================================================
    API_KEY: 'AIzaSyBaWntaFAeV9PC6V1ICfXC5DqPqkhRYY18',
    MODEL: 'gemini-2.5-flash',
    BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/models',

    // Maintain a simple array of messages to give the model conversation history
    history: [],

    // Current quiz question context (set by Quiz.js on each new question)
    quizContext: null,

    // System instructions to guide the AI's behavior
    systemInstruction: {
        role: "user",
        parts: [{ text: "You are an expert electrical engineering tutor assisting a student in a quiz application called 'Lingo Quest'. Your primary goal is to guide the student toward the correct answer EVENTUALLY giving it away directly after 2 to 3 prompts. You should analyze their question, identify any misconceptions in basic circuit laws (KVL, KCL, Ohm's Law) or advanced topics (Laplace, Thevenin, Op-Amps, etc.), and provide step-by-step hints. Always encourage the student and use an educational, Socratic teaching style. Keep your explanations short and concise." }]
    },

    /**
     * Sends a message to the Gemini API and returns the response.
     * @param {string} userMessage - The text message from the user.
     * @returns {string} - The response text from the AI.
     */
    sendMessage: async function (userMessage) {
        if (!this.API_KEY || this.API_KEY.includes('YOUR_API_KEY')) {
            return "Please configure your Gemini API Key in `js/services/GeminiService.js` to use the AI Tutor.";
        }

        const endpoint = `${this.BASE_URL}/${this.MODEL}:generateContent?key=${this.API_KEY}`;

        // Build the system instruction string
        let systemText = this.systemInstruction.parts[0].text;
        if (this.quizContext) {
            const ctx = this.quizContext;
            systemText += `\n\n--- CURRENT QUESTION CONTEXT ---\nThe student is answering Question ${ctx.questionNumber} of ${ctx.totalQuestions} in: ${ctx.topic}.\nQuestion: ${ctx.question}\nOptions: ${ctx.options}\n\nHelp them step-by-step. Don't spoil the answer immediately.`;
        }

        // Add user message to history
        this.history.push({
            role: "user",
            parts: [{ text: userMessage }]
        });

        // Payloads for v1beta use the 'system_instruction' field
        const payload = {
            system_instruction: {
                parts: [{ text: systemText }]
            },
            contents: this.history,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048
            }
        };

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Gemini API Error:", errorData);
                // Remove the failed user message from history
                this.history.pop();
                throw new Error(errorData.error?.message || "Failed to reach Gemini API.");
            }

            const data = await response.json();

            // Extract the model's text response safely
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
                const botResponse = data.candidates[0].content.parts[0].text;

                // Add the bot's response to the history so it remembers what it said
                this.history.push({
                    role: "model",
                    parts: [{ text: botResponse }]
                });

                return botResponse;
            } else {
                throw new Error("Unexpected response format from Gemini API.");
            }

        } catch (error) {
            console.error("Chatbot Request Failed:", error);
            return `AI Error: ${error.message}`;
        }
    },

    /**
     * Sets the current quiz question context so the AI can tailor its responses.
     * Called by Quiz.js on each new question render.
     */
    setContext: function (ctx) {
        this.quizContext = ctx;
        // Start fresh history for the new question so the AI isn't confused by prior Q&A
        this.history = [];
    },

    /**
     * Clears the question context (called when quiz ends).
     */
    clearContext: function () {
        this.quizContext = null;
        this.history = [];
    },

    /**
     * Clears the current conversation history (useful if the user wants to start fresh or logs out)
     */
    clearSession: function () {
        this.history = [];
    }
};
