/* ========================================
   EXAMETRY 0.01 — Audio Module
   Web Speech API Helpers
   ======================================== */

const ExaAudio = {
    recognition: null,
    synthesis: window.speechSynthesis || null,
    isListening: false,

    /** Check if speech recognition is supported */
    isRecognitionSupported() {
        return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    },

    /** Check if speech synthesis is supported */
    isSynthesisSupported() {
        return !!window.speechSynthesis;
    },

    /**
     * Start speech recognition
     * @param {Function} onResult - Callback with transcript text
     * @param {Function} onError - Error callback
     */
    startRecognition(onResult, onError) {
        if (!this.isRecognitionSupported()) {
            if (onError) onError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-IN';

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.isListening = false;
            if (onResult) onResult(transcript);
        };

        this.recognition.onerror = (event) => {
            this.isListening = false;
            if (onError) onError(`Speech recognition error: ${event.error}`);
        };

        this.recognition.onend = () => {
            this.isListening = false;
            // Update mic button visual
            const micBtn = document.getElementById('mic-btn');
            if (micBtn) micBtn.classList.remove('active');
        };

        try {
            this.recognition.start();
            this.isListening = true;
            const micBtn = document.getElementById('mic-btn');
            if (micBtn) micBtn.classList.add('active');
        } catch (e) {
            if (onError) onError('Could not start speech recognition. Please try again.');
        }
    },

    /** Stop recognition */
    stopRecognition() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        }
    },

    /**
     * Speak text using Speech Synthesis
     * @param {string} text - Text to speak
     * @param {Object} options - voice options
     */
    speak(text, options = {}) {
        if (!this.isSynthesisSupported()) {
            UI.showToast('Text-to-speech is not supported in this browser.', 'warning');
            return;
        }

        // Cancel any ongoing speech
        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = options.rate || 1;
        utterance.pitch = options.pitch || 1;
        utterance.volume = options.volume || 1;
        utterance.lang = options.lang || 'en-IN';

        // Try to find an Indian English voice
        const voices = this.synthesis.getVoices();
        const indianVoice = voices.find(v => v.lang.includes('en-IN'));
        const englishVoice = voices.find(v => v.lang.includes('en'));
        utterance.voice = indianVoice || englishVoice || voices[0];

        this.synthesis.speak(utterance);
    },

    /** Stop speaking */
    stopSpeaking() {
        if (this.synthesis) this.synthesis.cancel();
    },

    /** Check if currently speaking */
    isSpeaking() {
        return this.synthesis ? this.synthesis.speaking : false;
    }
};

// Load voices when available
if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
}
