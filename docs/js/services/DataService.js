// ==========================================
// HOW TO ADD NEW QUESTIONS
// ==========================================
// 1. Scroll down to "RAW_DATA".
// 2. Copy an existing line (everything between { and },).
// 3. Paste it on a new line.
// 4. Update the "topicId" to match the topic you want (see TOPICS list below).
//    - 1: Fundamentals
//    - 2: Energy Storage
//    - ... etc
// 5. Change the "question", "optionA", "optionB", "optionC", and "answer".
// 6. Save this file and reload index.html.

// MASTER DATA "SHEET"
// topicId must match the TOPICS list below.

const TOPICS = [
    { id: 1, name: "Fundamentals & Theorems" },
    { id: 2, name: "Energy Storage Elements" },
    { id: 3, name: "Transient & Steady-State" },
    { id: 4, name: "Ideal Op-Amps" },
    { id: 5, name: "Laplace Transforms" },
    { id: 6, name: "Network Functions" },
    { id: 7, name: "DC vs. AC" },
    { id: 8, name: "Three-Phase Circuits" },
    { id: 9, name: "Test (Beta)" }
];

const STORAGE_KEY = 'circuitly_data';

// Data Service
window.DataService = {
    questions: [], // In-memory store

    getTopics: () => TOPICS,

    init: async () => {
        // Force clear cache so new difficulty data is loaded
        localStorage.removeItem(STORAGE_KEY);

        // Try to connect to backend
        try {
            const healthRes = await fetch(`${window.CONFIG.API_BASE_URL}/api/health`);
            const healthData = await healthRes.json();
            if (healthData.success) {
                console.log("Connected to Backend:", healthData.message);
                window.DataService.isOnline = true;
            }
        } catch (e) {
            console.warn("Backend unreachable, using offline mode:", e);
            window.DataService.isOnline = false;
        }

        if (!window.DataService.isOnline) {
            try {
                const timestamp = new Date().getTime();
                const response = await fetch(`questions/QuestionBank.csv?t=${timestamp}`, { cache: 'no-store' });
                if (!response.ok) throw new Error('Failed to load Question Bank CSV');
                const text = await response.text();
                window.DataService.questions = window.DataService.parseCSV(text);
                console.log(`Loaded ${window.DataService.questions.length} questions from CSV.`);
            } catch (e) {
                console.log("CSV load failed (likely local file:// protocol). Switching to embedded data fallback.");
                if (window.QuestionBankData) {
                    window.DataService.questions = window.DataService.parseCSV(window.QuestionBankData);
                    console.log(`Loaded ${window.DataService.questions.length} questions from Embedded Data.`);
                } else {
                    // Fallback if even embedded data is missing
                    window.DataService.questions = [
                        { id: 991, topicId: 1, question: "Critical Error: Data Missing.", optionA: "OK", optionB: "Retry", optionC: "Help", answer: "OK", explanation: "Please check QuestionBankData.js." }
                    ];
                }
            }
        }
    },

    // ... parseCSV remains same ...

    getQuestions: async (topicId) => {
        // Helper to shuffle array (Fisher-Yates)
        const shuffle = (array) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        };

        // Helper to randomize options if safe
        const mapAndRandomize = (row) => {
            let opts = [row.optionA, row.optionB, row.optionC];
            if (row.optionD) {
                opts.push(row.optionD);
            } else if (opts.length < 4) {
                // Inject 4th option if missing (Static questions only have 3)
                opts.push("None of the above");
            }

            // Check for positional answers (e.g. "Both A and B", "All of the above")
            // If found, preserve order.
            const hasPositional = opts.some(opt => /Both|All|None|A and B/i.test(opt));

            if (!hasPositional) {
                opts = shuffle([...opts]);
            }

            // Map text difficulty to numbers if needed
            let diffNum = Number(row.difficulty);
            if (isNaN(diffNum)) {
                if (typeof row.difficulty === 'string') {
                    const lc = row.difficulty.toLowerCase().trim();
                    if (lc === 'easy') diffNum = 1;
                    else if (lc === 'medium' || lc === 'med') diffNum = 2;
                    else if (lc === 'hard') diffNum = 3;
                    else diffNum = 1;
                } else {
                    diffNum = 1;
                }
            }

            return {
                id: row.id,
                prompt: row.question,
                options: opts,
                correctAnswer: row.answer,
                image: row.image || null,
                explanation: row.explanation || null,
                difficulty: diffNum
            };
        };

        let questions = [];

        if (window.DataService.isOnline) {
            try {
                const res = await fetch(`${window.CONFIG.API_BASE_URL}/api/questions/${topicId}`);
                const data = await res.json();
                if (data.success) {
                    questions = data.questions.map(q => ({
                        id: q.id,
                        topicId: q.topicId,
                        question: q.question,
                        optionA: q.optionA,
                        optionB: q.optionB,
                        optionC: q.optionC,
                        optionD: q.optionD,
                        answer: q.answer,
                        image: q.image,
                        explanation: q.explanation,
                        difficulty: q.difficulty
                    }));
                }
            } catch (e) {
                console.error("Failed to fetch questions from API, using local fallback", e);
            }
        }

        if (questions.length === 0) {
            let qs = window.DataService.questions;
            questions = qs.filter(q => q.topicId === Number(topicId));
        }

        // Shuffle ALL available questions first
        shuffle(questions);

        const MAX_QUESTIONS = 10;

        // If Three-Phase Topic (8), ensure 30% Theory (Static) and 70% Circuits (Generated)
        if (Number(topicId) === 8 && window.ThreePhaseCircuitGenerator) {

            // 1. Get Theory Questions (Static)
            // Map them to standardized format with randomization
            let standardizedQs = questions.map(mapAndRandomize);

            // Limit theory part to 30% of Target (approx 5)
            const theoryCount = Math.round(MAX_QUESTIONS * 0.3);
            if (standardizedQs.length > theoryCount) {
                standardizedQs = standardizedQs.slice(0, theoryCount);
            }

            // 2. Fill rest with Generated
            const needed = Math.max(0, MAX_QUESTIONS - standardizedQs.length);

            // Track prompts to ensure uniqueness in this session
            const existingPrompts = new Set(standardizedQs.map(q => q.prompt));

            for (let i = 0; i < needed; i++) {
                let attempts = 0;
                let newQ = null;

                // Retry generation up to 5 times if duplicate prompt found
                do {
                    newQ = window.ThreePhaseCircuitGenerator.generate();
                    if (newQ && newQ.options) {
                        const hasPos = newQ.options.some(opt => /Both|All|None/i.test(opt));
                        if (!hasPos) {
                            newQ.options = shuffle([...newQ.options]);
                        }
                    }
                    attempts++;
                } while (existingPrompts.has(newQ.prompt) && attempts < 5);

                if (newQ) {
                    standardizedQs.push(newQ);
                    existingPrompts.add(newQ.prompt);
                }
            }

            return shuffle(standardizedQs); // Reshuffle to mix theory and generated

        } else if (String(topicId).startsWith('9')) {
             // ... existing Test logic ...
            const testQs = [];
            let subTopic = null;
            if (String(topicId).includes('_')) {
                subTopic = String(topicId).split('_').slice(1).join('_');
            }

            if (window.TestCircuitGenerator) {
                for (let i = 0; i < 15; i++) {
                    try {
                        let newQ = window.TestCircuitGenerator.generate(subTopic);
                        if (newQ && newQ.options && newQ.correctAnswer) {
                            testQs.push(newQ);
                        }
                    } catch (e) {
                        console.warn("Problem generating test circuit question:", e);
                    }
                }
            }
            return shuffle(testQs);

        } else {
            if (questions.length > MAX_QUESTIONS) {
                questions = questions.slice(0, MAX_QUESTIONS);
            }
            return questions.map(mapAndRandomize);
        }
    },

    // Adaptive Helpers
    getTheoryQuestion: (topicId) => {
        let theoryQs = [];
        if (window.DataService.questions) {
            theoryQs = window.DataService.questions.filter(d => d.topicId === Number(topicId));
        }

        if (theoryQs.length === 0) return null;

        const row = theoryQs[Math.floor(Math.random() * theoryQs.length)];
        return {
            id: row.id,
            prompt: row.question,
            options: [row.optionA, row.optionB, row.optionC],
            correctAnswer: row.answer,
            image: null,
            explanation: row.explanation
        };
    },

    getCircuitQuestion: (topicId) => {
        if (Number(topicId) === 8 && window.ThreePhaseCircuitGenerator) {
            return window.ThreePhaseCircuitGenerator.generate();
        }
        return null;
    },

    getQuestionByDifficulty: (topicId, targetDifficulty, excludeIds = []) => {
        let qs = window.DataService.questions.filter(q =>
            q.topicId === Number(topicId) &&
            q.difficulty === targetDifficulty &&
            !excludeIds.includes(q.id)
        );

        // Fallback if no questions found at this difficulty
        if (qs.length === 0) {
            qs = window.DataService.questions.filter(q =>
                q.topicId === Number(topicId) &&
                !excludeIds.includes(q.id)
            );
        }

        if (qs.length === 0) return null;

        // Helper to shuffle array (Fisher-Yates) - simplified for here
        const shuffleOptions = (opts) => {
            const arr = [...opts];
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        };

        // Pick a random one and format it
        const row = qs[Math.floor(Math.random() * qs.length)];

        let opts = [row.optionA, row.optionB, row.optionC];
        if (opts.length < 4) opts.push("None of the above");

        const hasPositional = opts.some(opt => /Both|All|None|A and B/i.test(opt));
        if (!hasPositional) opts = shuffleOptions(opts);

        return {
            id: row.id,
            prompt: row.question,
            options: opts,
            correctAnswer: row.answer,
            image: row.image || null,
            explanation: row.explanation || null,
            difficulty: row.difficulty
        };
    },

    importCSV: (csvText) => {
        try {
            const lines = csvText.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());

            const results = [];

            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;

                // Simple regex to handle commas inside quotes would be better, 
                // but for simple Excel CSV export this split is standard for browser-based simple tools.
                // Assuming standard CSV without escaped commas for this MVP.
                const currentline = lines[i].split(',');

                if (currentline.length < 9) continue; // Updated to expect 9 columns (0-8)

                const obj = {};
                obj.id = currentline[0].trim();
                obj.topicId = Number(currentline[1].trim());
                obj.question = currentline[2].trim();
                obj.optionA = currentline[3].trim();
                obj.optionB = currentline[4].trim();
                obj.optionC = currentline[5].trim();
                obj.answer = currentline[6].trim();
                // Column 8 is image (index 7)
                if (currentline[7] && currentline[7].trim() !== '') {
                    obj.image = currentline[7].trim();
                } else {
                    obj.image = null;
                }
                // Column 9 is explanation (index 8)
                if (currentline[8] && currentline[8].trim() !== '') {
                    obj.explanation = currentline[8].trim();
                } else {
                    obj.explanation = null;
                }
                // Column 10 is difficulty (index 9)
                if (currentline[9] && currentline[9].trim() !== '') {
                    let diffVal = currentline[9].trim();
                    let diffNum = Number(diffVal);
                    if (isNaN(diffNum)) {
                        diffVal = diffVal.toLowerCase();
                        if (diffVal === 'easy') diffNum = 1;
                        else if (diffVal === 'medium' || diffVal === 'med') diffNum = 2;
                        else if (diffVal === 'hard') diffNum = 3;
                        else diffNum = 1;
                    }
                    obj.difficulty = diffNum;
                } else {
                    obj.difficulty = 1;
                }

                results.push(obj);
            }

            if (results.length > 0) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
                return { success: true, count: results.length };
            } else {
                return { success: false, error: "No valid rows found" };
            }
        } catch (e) {
            return { success: false, error: e.message };
        }
    },

    resetToDefault: () => {
        localStorage.removeItem(STORAGE_KEY);
    }
};
