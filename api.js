/* ========================================
   EXAMETRY 0.01 — API Module
   Groq-powered AI for all features
   ======================================== */

const ExaAPI = {
    GROQ_ENDPOINT: 'https://api.groq.com/openai/v1/chat/completions',
    GROQ_MODEL: 'meta-llama/llama-4-scout-17b-16e-instruct',
    SPEKLE_MODEL: 'meta-llama/llama-4-scout-17b-16e-instruct',

    /** System prompt for Rudius 3.z AI mentor */
    MENTOR_SYSTEM_PROMPT: `You are Rudius 3.z — a world-class academic mentor and coach specialized in Indian competitive exams: CUET, NEET, JEE (Main & Advanced), 12th Board exams, CET, and similar entrance exams.

Your role:
- Provide expert, exam-focused guidance with clarity and encouragement
- Create personalized study plans, revision schedules, and mock test strategies
- Explain complex concepts in simple terms with examples
- Analyze student performance data and identify weak areas
- Share exam-specific tips, marking schemes, and time management strategies
- Reference NCERT syllabus, previous year question patterns, and NTA guidelines
- Keep responses concise, actionable, and motivating

Personality: Warm, knowledgeable, supportive but honest. You balance encouragement with realistic feedback. Use bullet points and structured formatting for clarity. Address the student personally.

Important: Always tailor advice to the specific exam the student is preparing for. Reference official syllabus, marking schemes, and exam patterns accurately.`,

    /**
     * Call Groq API (for Rudius 3.z Mentor)
     * @param {Array} messages - Chat messages in OpenAI format
     * @param {Object} options - Optional overrides
     * @returns {Promise<string>} AI response text
     */
    async callGroq(messages, options = {}) {
        const apiKey = await KeyVault.getKey('groq');
        if (!apiKey) {
            throw new Error('MISSING_KEY:Groq API key not found. Please add it in Settings > Integrations.');
        }

        const body = {
            model: options.model || this.GROQ_MODEL,
            messages: messages,
            temperature: options.temperature ?? 0.3,
            max_tokens: options.max_tokens ?? 900,
            stream: false
        };

        try {
            const response = await fetch(this.GROQ_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                if (response.status === 401) throw new Error('INVALID_KEY:Groq API key is invalid. Please check Settings > Integrations.');
                throw new Error(`API_ERROR:Groq API error (${response.status}): ${errData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || 'No response generated.';
        } catch (e) {
            if (e.message.startsWith('MISSING_KEY:') || e.message.startsWith('INVALID_KEY:') || e.message.startsWith('API_ERROR:')) {
                throw e;
            }
            throw new Error(`NETWORK_ERROR:Unable to reach Groq API. Check your internet connection.`);
        }
    },

    /**
     * Call Groq API for Spekle features (Quiz, Flashcards, Questions)
     * Uses the same Groq endpoint with higher token limits for content generation.
     * @param {Array} messages - Chat messages in OpenAI format
     * @param {Object} options - Optional overrides
     * @returns {Promise<string>} AI response text
     */
    async callCerebras(messages, options = {}) {
        // Spekle now also uses Groq — same API key, higher default max_tokens
        const apiKey = await KeyVault.getKey('groq');
        if (!apiKey) {
            throw new Error('MISSING_KEY:Groq API key not found. Please add it in Settings > Integrations.');
        }

        const body = {
            model: options.model || this.SPEKLE_MODEL,
            messages: messages,
            temperature: options.temperature ?? 0.5,
            max_tokens: options.max_tokens ?? 4096,
            stream: false
        };

        try {
            const response = await fetch(this.GROQ_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                if (response.status === 401) throw new Error('INVALID_KEY:Groq API key is invalid. Please check Settings > Integrations.');
                throw new Error(`API_ERROR:Groq API error (${response.status}): ${errData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || 'No response generated.';
        } catch (e) {
            if (e.message.startsWith('MISSING_KEY:') || e.message.startsWith('INVALID_KEY:') || e.message.startsWith('API_ERROR:')) {
                throw e;
            }
            throw new Error(`NETWORK_ERROR:Unable to reach Groq API. Check your internet connection.`);
        }
    },

    /**
     * Test API key validity
     * @param {string} provider - 'groq'
     * @returns {Promise<boolean>}
     */
    async testApiKey(provider) {
        try {
            const testMessages = [{ role: 'user', content: 'Say "OK" only.' }];
            await this.callGroq(testMessages, { max_tokens: 10 });
            return true;
        } catch {
            return false;
        }
    },

    /** Handle API errors uniformly */
    handleError(error) {
        const msg = error.message || '';
        if (msg.startsWith('MISSING_KEY:')) {
            UI.showToast(msg.replace('MISSING_KEY:', ''), 'warning');
            return 'missing_key';
        }
        if (msg.startsWith('INVALID_KEY:')) {
            UI.showToast(msg.replace('INVALID_KEY:', ''), 'error');
            return 'invalid_key';
        }
        if (msg.startsWith('API_ERROR:')) {
            UI.showToast(msg.replace('API_ERROR:', ''), 'error');
            return 'api_error';
        }
        if (msg.startsWith('NETWORK_ERROR:')) {
            UI.showToast(msg.replace('NETWORK_ERROR:', ''), 'error');
            return 'network_error';
        }
        UI.showToast('An unexpected error occurred. Please try again.', 'error');
        return 'unknown_error';
    }
};
