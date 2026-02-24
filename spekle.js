/* ========================================
   EXAMETRY 0.01 — Spekle Page
   AI Practice Suite: Quiz, Flashcards, Questions
   Powered by Groq API
   ======================================== */

const SpeklePage = {
    currentTab: 'quiz',
    quizState: null,
    flashcardState: null,

    async render() {
        UI.setBreadcrumb(['Spekle', 'AI Practice']);
        const content = document.getElementById('app-content');
        content.innerHTML = `
      <div class="page-enter">
        <div class="page-header">
          <h1 class="page-title">Spekle — AI Practice Suite</h1>
          <p class="page-subtitle">Generate quizzes, flashcards & questions powered by Groq AI</p>
        </div>
        <div class="tabs">
          <div class="tab active" data-tab="quiz" onclick="SpeklePage.switchTab('quiz')">🎯 Quiz</div>
          <div class="tab" data-tab="flashcards" onclick="SpeklePage.switchTab('flashcards')">🃏 Flashcards</div>
          <div class="tab" data-tab="questions" onclick="SpeklePage.switchTab('questions')">✍️ Questions</div>
          <div class="tab" data-tab="history" onclick="SpeklePage.switchTab('history')">📜 History</div>
        </div>
        <div id="spekle-content"></div>
      </div>
    `;
        this.switchTab(this.currentTab);
    },

    switchTab(tab) {
        this.currentTab = tab;
        document.querySelectorAll('.tabs .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
        if (tab === 'quiz') this.renderQuizConfig();
        else if (tab === 'flashcards') this.renderFlashcardConfig();
        else if (tab === 'questions') this.renderQuestionsConfig();
        else if (tab === 'history') this.renderHistory();
    },

    /* ========== QUIZ ========== */
    renderQuizConfig() {
        const container = document.getElementById('spekle-content');
        container.innerHTML = `
      <div class="animate-fade-in">
        <div class="spekle-config card no-hover">
          <div class="form-group"><label class="form-label">Subject</label><input type="text" class="form-input" id="quiz-subject" placeholder="e.g. Biology"></div>
          <div class="form-group"><label class="form-label">Chapter / Topic</label><input type="text" class="form-input" id="quiz-chapter" placeholder="e.g. Cell Biology"></div>
          <div class="form-group"><label class="form-label">Exam Type</label>
            <select class="form-select" id="quiz-exam"><option>NEET</option><option>JEE Main</option><option>JEE Advanced</option><option>CUET</option><option>12th Board</option><option>CET</option><option>Other</option></select></div>
          <div class="form-group"><label class="form-label">Difficulty</label>
            <select class="form-select" id="quiz-difficulty"><option>Easy</option><option selected>Hard</option><option>Impossible</option></select></div>
          <div class="form-group"><label class="form-label">Questions</label>
            <select class="form-select" id="quiz-count"><option>5</option><option selected>10</option><option>20</option></select></div>
          <div style="display:flex;align-items:end;"><button class="btn btn-primary" onclick="SpeklePage.generateQuiz()">⚡ Generate Quiz</button></div>
        </div>
        <div id="quiz-area"></div>
      </div>`;
    },

    async generateQuiz() {
        const subject = document.getElementById('quiz-subject').value.trim();
        const chapter = document.getElementById('quiz-chapter').value.trim();
        const examType = document.getElementById('quiz-exam').value;
        const difficulty = document.getElementById('quiz-difficulty').value;
        const count = parseInt(document.getElementById('quiz-count').value);
        if (!subject || !chapter) { UI.showToast('Please enter subject and chapter.', 'warning'); return; }

        const area = document.getElementById('quiz-area');
        area.innerHTML = '<div style="text-align:center;padding:var(--space-8);"><div class="spinner lg" style="margin:0 auto var(--space-4);"></div><p>Generating quiz with AI...</p></div>';

        const prompt = `Generate exactly ${count} MCQ for ${examType} exam. Subject: ${subject}, Chapter: ${chapter}, Difficulty: ${difficulty}. Focus on PYQ patterns. Return ONLY a JSON array. Each: {"question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."}`;

        try {
            const response = await ExaAPI.callCerebras([
                { role: 'system', content: 'Expert exam question generator for Indian exams. Return ONLY valid JSON array.' },
                { role: 'user', content: prompt }
            ], { temperature: 0.7, max_tokens: 4096 });

            let questions;
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            questions = JSON.parse(jsonMatch ? jsonMatch[0] : response);
            if (!Array.isArray(questions) || !questions.length) throw new Error('API_ERROR:No questions generated.');

            this.quizState = { questions, currentIndex: 0, answers: new Array(questions.length).fill(null), flagged: new Set(), startTime: Date.now(), examType, subject, chapter, difficulty };
            this.renderQuizQuestion();
        } catch (error) {
            ExaAPI.handleError(error);
            area.innerHTML = '<div class="empty-state"><p>Failed to generate quiz. Check your API key.</p></div>';
        }
    },

    renderQuizQuestion() {
        const area = document.getElementById('quiz-area');
        const { questions, currentIndex, answers, flagged, startTime } = this.quizState;
        const q = questions[currentIndex];
        const elapsed = Math.floor((Date.now() - startTime) / 1000);

        area.innerHTML = `
      <div class="card no-hover quiz-interface animate-fade-in">
        <div class="quiz-header-bar">
          <span class="quiz-progress">Q ${currentIndex + 1}/${questions.length}</span>
          <span class="quiz-timer">⏱ ${Math.floor(elapsed / 60)}:${(elapsed % 60).toString().padStart(2, '0')}</span>
          <button class="btn btn-ghost btn-sm" onclick="SpeklePage.toggleFlag()" style="${flagged.has(currentIndex) ? 'color:var(--warning-500);' : ''}">${flagged.has(currentIndex) ? '🚩' : '🏳️'} Flag</button>
        </div>
        <div class="progress-bar" style="margin-bottom:var(--space-5);"><div class="progress-fill" style="width:${((currentIndex + 1) / questions.length) * 100}%"></div></div>
        <div class="quiz-question">${currentIndex + 1}. ${q.question}</div>
        <div class="quiz-options">
          ${q.options.map((opt, i) => `<div class="quiz-option ${answers[currentIndex] === i ? 'selected' : ''}" onclick="SpeklePage.selectAnswer(${i})"><span class="quiz-option-label">${String.fromCharCode(65 + i)}</span><span>${opt}</span></div>`).join('')}
        </div>
        <div class="quiz-nav">
          <button class="btn btn-secondary" ${currentIndex === 0 ? 'disabled' : ''} onclick="SpeklePage.prevQ()">← Previous</button>
          ${currentIndex === questions.length - 1
                ? '<button class="btn btn-primary" onclick="SpeklePage.submitQuiz()">Submit ✓</button>'
                : '<button class="btn btn-primary" onclick="SpeklePage.nextQ()">Next →</button>'}
        </div>
      </div>`;
    },

    selectAnswer(i) { this.quizState.answers[this.quizState.currentIndex] = i; this.renderQuizQuestion(); },
    toggleFlag() { const idx = this.quizState.currentIndex; this.quizState.flagged.has(idx) ? this.quizState.flagged.delete(idx) : this.quizState.flagged.add(idx); this.renderQuizQuestion(); },
    nextQ() { if (this.quizState.currentIndex < this.quizState.questions.length - 1) { this.quizState.currentIndex++; this.renderQuizQuestion(); } },
    prevQ() { if (this.quizState.currentIndex > 0) { this.quizState.currentIndex--; this.renderQuizQuestion(); } },

    async submitQuiz() {
        const { questions, answers, examType, subject, chapter, difficulty, startTime } = this.quizState;
        const results = questions.map((q, i) => ({ question: q.question, options: q.options, correctAnswer: q.correct, userAnswer: answers[i], correct: answers[i] === q.correct, answered: answers[i] !== null, explanation: q.explanation || '' }));
        const scoring = ExaAnalytics.calculateQuizScore(results, examType);
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const correct = results.filter(r => r.correct).length, wrong = results.filter(r => r.answered && !r.correct).length, unanswered = results.filter(r => !r.answered).length;

        await ExaDB.put('quizRecords', { id: ExaDB.generateId(), subject, chapter, difficulty, examType, quantity: questions.length, results, score: correct, total: questions.length, examScore: scoring.score, examMaxScore: scoring.maxScore, timeTaken: elapsed, timestamp: new Date().toISOString() });

        const area = document.getElementById('quiz-area');
        area.innerHTML = `
      <div class="card no-hover quiz-interface animate-scale-in">
        <div class="quiz-result-score">
          <p style="color:var(--text-tertiary);">Your Score</p>
          <div class="result-percentage">${scoring.percentage}%</div>
          <p style="color:var(--text-secondary);">${examType}: ${scoring.score}/${scoring.maxScore} marks</p>
          <div class="result-breakdown">
            <div class="result-stat"><div class="result-stat-value" style="color:var(--success-500);">${correct}</div><div class="result-stat-label">Correct</div></div>
            <div class="result-stat"><div class="result-stat-value" style="color:var(--danger-500);">${wrong}</div><div class="result-stat-label">Wrong</div></div>
            <div class="result-stat"><div class="result-stat-value">${unanswered}</div><div class="result-stat-label">Skipped</div></div>
          </div>
          <p style="margin-top:var(--space-4);font-size:0.85rem;color:var(--text-tertiary);">⏱ ${Math.floor(elapsed / 60)}m ${elapsed % 60}s</p>
        </div>
        <hr class="divider"><h3 style="margin-bottom:var(--space-4);">Review</h3>
        ${results.map((r, i) => `<div style="margin-bottom:var(--space-4);padding:var(--space-3);background:var(--bg-secondary);border-radius:var(--radius-md);">
          <p style="font-weight:500;margin-bottom:var(--space-2);">${i + 1}. ${r.question}</p>
          ${r.options.map((o, j) => `<div style="padding:var(--space-1) var(--space-2);border-radius:4px;font-size:0.9rem;${j === r.correctAnswer ? 'background:rgba(34,197,94,0.1);color:var(--success-600);' : ''}${j === r.userAnswer && j !== r.correctAnswer ? 'background:rgba(239,68,68,0.1);color:var(--danger-600);' : ''}">${String.fromCharCode(65 + j)}. ${o}${j === r.correctAnswer ? ' ✓' : ''}${j === r.userAnswer && j !== r.correctAnswer ? ' ✕' : ''}</div>`).join('')}
          ${r.explanation ? `<p style="margin-top:var(--space-2);font-size:0.8rem;color:var(--text-secondary);border-left:3px solid var(--primary-300);padding-left:var(--space-3);">💡 ${r.explanation}</p>` : ''}
        </div>`).join('')}
        <div style="display:flex;gap:var(--space-3);"><button class="btn btn-primary" onclick="SpeklePage.renderQuizConfig()">New Quiz</button><button class="btn btn-secondary" onclick="App.navigate('dashboard')">Dashboard</button></div>
      </div>`;
        UI.showToast(`Quiz done! ${scoring.percentage}%`, scoring.percentage >= 70 ? 'success' : 'warning');
    },

    /* ========== FLASHCARDS ========== */
    renderFlashcardConfig() {
        document.getElementById('spekle-content').innerHTML = `
      <div class="animate-fade-in">
        <div class="spekle-config card no-hover">
          <div class="form-group"><label class="form-label">Subject</label><input type="text" class="form-input" id="fc-subject" placeholder="e.g. Chemistry"></div>
          <div class="form-group"><label class="form-label">Chapter</label><input type="text" class="form-input" id="fc-chapter" placeholder="e.g. Organic Chemistry"></div>
          <div class="form-group"><label class="form-label">Difficulty</label><select class="form-select" id="fc-difficulty"><option>Easy</option><option selected>Hard</option><option>Impossible</option></select></div>
          <div class="form-group"><label class="form-label">Cards</label><select class="form-select" id="fc-count"><option>10</option><option selected>20</option><option>50</option></select></div>
          <div style="display:flex;align-items:end;"><button class="btn btn-primary" onclick="SpeklePage.generateFlashcards()">🃏 Generate</button></div>
        </div>
        <div id="flashcard-area"></div>
      </div>`;
    },

    async generateFlashcards() {
        const subject = document.getElementById('fc-subject').value.trim(), chapter = document.getElementById('fc-chapter').value.trim(), difficulty = document.getElementById('fc-difficulty').value, count = parseInt(document.getElementById('fc-count').value);
        if (!subject || !chapter) { UI.showToast('Please enter subject and chapter.', 'warning'); return; }
        const area = document.getElementById('flashcard-area');
        area.innerHTML = '<div style="text-align:center;padding:var(--space-8);"><div class="spinner lg" style="margin:0 auto var(--space-4);"></div><p>Generating flashcards...</p></div>';

        try {
            const response = await ExaAPI.callCerebras([
                { role: 'system', content: 'Create exam flashcards. Return ONLY valid JSON array.' },
                { role: 'user', content: `Generate ${count} flashcards for ${subject} - ${chapter}. Difficulty: ${difficulty}. JSON array: [{"front":"...","back":"..."}]` }
            ]);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            const cards = JSON.parse(jsonMatch ? jsonMatch[0] : response);
            this.flashcardState = { cards, currentIndex: 0, mastered: new Set(), review: new Set() };
            this.renderFlashcards();
            await ExaDB.put('flashcardRecords', { id: ExaDB.generateId(), subject, chapter, difficulty, cards, timestamp: new Date().toISOString() });
        } catch (e) { ExaAPI.handleError(e); area.innerHTML = '<div class="empty-state"><p>Failed. Check API key.</p></div>'; }
    },

    renderFlashcards() {
        const area = document.getElementById('flashcard-area');
        const { cards, currentIndex, mastered, review } = this.flashcardState;
        const card = cards[currentIndex];
        const pct = cards.length > 0 ? Math.round((mastered.size / cards.length) * 100) : 0;

        // Build progress dots HTML
        const dotsHtml = cards.map((_, i) => {
            let cls = 'fc-dot';
            if (i === currentIndex) cls += ' current';
            else if (mastered.has(i)) cls += ' mastered';
            else if (review.has(i)) cls += ' review-dot';
            return `<div class="${cls}" onclick="SpeklePage.goToFC(${i})" title="Card ${i + 1}"></div>`;
        }).join('');

        area.innerHTML = `
      <div style="max-width:640px;margin:0 auto;">
        <!-- Mastery bar -->
        <div class="mastery-meter">
          <span style="font-size:0.9rem;font-weight:600;color:var(--text-primary);">Card ${currentIndex + 1} / ${cards.length}</span>
          <div class="progress-bar" style="flex:1;">
            <div class="progress-fill" style="width:${pct}%;background:var(--gradient-success);transition:width 0.4s ease;"></div>
          </div>
          <span class="pill pill-success" style="font-weight:600;">${mastered.size} ✓</span>
          <span class="pill pill-warning" style="font-weight:600;">${review.size} 🔄</span>
        </div>

        <!-- Flashcard -->
        <div class="flashcard-container" style="margin:var(--space-5) 0;">
          <div class="flashcard card" id="fc-card">
            <div class="flashcard-face">
              <div style="width:100%;">
                <div style="margin-bottom:var(--space-4);">
                  <span style="font-size:0.7rem;text-transform:uppercase;letter-spacing:1.5px;color:var(--text-tertiary);font-weight:600;">Front</span>
                </div>
                <p style="font-size:1.15rem;font-weight:500;line-height:1.7;color:var(--text-primary);">${card.front}</p>
              </div>
            </div>
            <div class="flashcard-face flashcard-back">
              <div style="width:100%;">
                <div style="margin-bottom:var(--space-4);">
                  <span style="font-size:0.7rem;text-transform:uppercase;letter-spacing:1.5px;color:var(--text-tertiary);font-weight:600;">Answer</span>
                </div>
                <p style="font-size:1.05rem;line-height:1.7;color:var(--text-primary);">${card.back}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div class="fc-controls">
          <button class="fc-nav-btn" ${currentIndex === 0 ? 'disabled' : ''} onclick="SpeklePage.prevFC()" title="Previous (← key)">←</button>
          <button class="fc-action-btn mastered" onclick="SpeklePage.markFC('m')" title="I know this">✓ Got it</button>
          <button class="fc-nav-btn" onclick="SpeklePage.flipFC()" title="Flip card (Space key)" style="background:var(--gradient-primary);color:#fff;border-color:transparent;font-size:1rem;">🔃</button>
          <button class="fc-action-btn review" onclick="SpeklePage.markFC('r')" title="Need to review">🔄 Review</button>
          <button class="fc-nav-btn" ${currentIndex === cards.length - 1 ? 'disabled' : ''} onclick="SpeklePage.nextFC()" title="Next (→ key)">→</button>
        </div>

        <!-- Progress dots -->
        <div class="fc-dots">${dotsHtml}</div>

        <!-- Keyboard hint -->
        <p style="text-align:center;font-size:0.75rem;color:var(--text-tertiary);margin-top:var(--space-3);">
          ← → Navigate &nbsp;·&nbsp; Space = Flip &nbsp;·&nbsp; G = Got it &nbsp;·&nbsp; R = Review
        </p>
      </div>`;

        // Add keyboard listener (remove old first)
        this._fcKeyHandler && document.removeEventListener('keydown', this._fcKeyHandler);
        this._fcKeyHandler = (e) => {
            if (!this.flashcardState) return;
            // Don't intercept when user is typing in an input field
            const tag = document.activeElement?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || document.activeElement?.isContentEditable) return;
            if (e.key === 'ArrowRight') this.nextFC();
            else if (e.key === 'ArrowLeft') this.prevFC();
            else if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); document.getElementById('fc-card')?.classList.toggle('flipped'); }
            else if (e.key === 'g' || e.key === 'G') this.markFC('m');
            else if (e.key === 'r' || e.key === 'R') this.markFC('r');
        };
        document.addEventListener('keydown', this._fcKeyHandler);
    },

    flipFC() {
        document.getElementById('fc-card')?.classList.toggle('flipped');
    },

    goToFC(index) {
        this.flashcardState.currentIndex = index;
        this.renderFlashcards();
    },

    markFC(t) {
        const i = this.flashcardState.currentIndex;
        if (t === 'm') { this.flashcardState.mastered.add(i); this.flashcardState.review.delete(i); }
        else { this.flashcardState.review.add(i); this.flashcardState.mastered.delete(i); }

        // Check if all done
        const { cards, mastered, review } = this.flashcardState;
        if (mastered.size + review.size === cards.length) {
            UI.showToast(`All ${cards.length} cards reviewed! ${mastered.size} mastered, ${review.size} to review.`, 'success');
        }
        if (i < cards.length - 1) this.nextFC(); else this.renderFlashcards();
    },

    nextFC() {
        if (this.flashcardState.currentIndex < this.flashcardState.cards.length - 1) {
            this.flashcardState.currentIndex++;
            this.renderFlashcards();
        }
    },

    prevFC() {
        if (this.flashcardState.currentIndex > 0) {
            this.flashcardState.currentIndex--;
            this.renderFlashcards();
        }
    },

    /* ========== QUESTIONS ========== */
    renderQuestionsConfig() {
        document.getElementById('spekle-content').innerHTML = `
      <div class="animate-fade-in">
        <div class="spekle-config card no-hover">
          <div class="form-group"><label class="form-label">Subject</label><input type="text" class="form-input" id="wq-subject" placeholder="e.g. Physics"></div>
          <div class="form-group"><label class="form-label">Topic</label><input type="text" class="form-input" id="wq-topic" placeholder="e.g. Newton's Laws"></div>
          <div class="form-group"><label class="form-label">Difficulty</label><select class="form-select" id="wq-difficulty"><option>Easy</option><option selected>Hard</option><option>Impossible</option></select></div>
          <div class="form-group"><label class="form-label">Quantity</label><select class="form-select" id="wq-count"><option>5</option><option selected>10</option></select></div>
          <div style="display:flex;align-items:end;"><button class="btn btn-primary" onclick="SpeklePage.generateQuestions()">✍️ Generate</button></div>
        </div>
        <div id="questions-area"></div>
      </div>`;
    },

    async generateQuestions() {
        const subject = document.getElementById('wq-subject').value.trim(), topic = document.getElementById('wq-topic').value.trim(), difficulty = document.getElementById('wq-difficulty').value, count = parseInt(document.getElementById('wq-count').value);
        if (!subject || !topic) { UI.showToast('Enter subject and topic.', 'warning'); return; }
        const area = document.getElementById('questions-area');
        area.innerHTML = '<div style="text-align:center;padding:var(--space-8);"><div class="spinner lg" style="margin:0 auto var(--space-4);"></div><p>Generating questions...</p></div>';

        try {
            const response = await ExaAPI.callCerebras([
                { role: 'system', content: 'Generate descriptive exam questions. Return ONLY valid JSON array.' },
                { role: 'user', content: `Generate ${count} descriptive questions for ${subject} - ${topic}. Difficulty: ${difficulty}. PYQ-style. JSON: [{"question":"...","keyPoints":["..."]}]` }
            ]);
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            const questions = JSON.parse(jsonMatch ? jsonMatch[0] : response);

            area.innerHTML = `<div class="animate-fade-in"><h3 style="margin-bottom:var(--space-4);">✍️ Write Your Answers</h3>
        ${questions.map((q, i) => `<div class="card no-hover question-card" id="qcard-${i}">
          <div class="question-text">${i + 1}. ${q.question}</div>
          <textarea class="answer-editor" id="answer-${i}" placeholder="Write your answer..."></textarea>
          <div style="margin-top:var(--space-3);"><button class="btn btn-primary btn-sm" onclick="SpeklePage.checkAnswer(${i}, \`${q.question.replace(/`/g, "'")}\`)">🔍 Check</button></div>
          <div id="feedback-${i}"></div></div>`).join('')}</div>`;

            await ExaDB.put('questionRecords', { id: ExaDB.generateId(), subject, topic, difficulty, questions, timestamp: new Date().toISOString() });
        } catch (e) { ExaAPI.handleError(e); area.innerHTML = '<div class="empty-state"><p>Failed. Check API key.</p></div>'; }
    },

    async checkAnswer(index, question) {
        const answer = document.getElementById(`answer-${index}`).value.trim();
        if (!answer) { UI.showToast('Write an answer first.', 'warning'); return; }
        const fb = document.getElementById(`feedback-${index}`);
        fb.innerHTML = '<div class="spinner sm" style="margin:var(--space-3) 0;"></div>';

        try {
            const response = await ExaAPI.callCerebras([
                { role: 'system', content: 'Evaluate student answers. Focus on concepts, ignore spelling. Return JSON: {"score":1-5,"feedback":"...","missing":[]}' },
                { role: 'user', content: `Question: ${question}\nAnswer: ${answer}\nEvaluate conceptual accuracy, structure, depth. JSON only.` }
            ]);
            let result;
            try { const m = response.match(/\{[\s\S]*\}/); result = JSON.parse(m ? m[0] : response); } catch { result = { score: 3, feedback: response, missing: [] }; }
            const colors = ['', 'var(--danger-500)', 'var(--warning-500)', 'var(--warning-400)', 'var(--success-400)', 'var(--success-500)'];
            fb.innerHTML = `<div class="feedback-rubric animate-slide-up">
        <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-2);"><div class="rubric-score" style="color:${colors[result.score] || 'var(--primary-500)'};">${result.score}/5</div></div>
        <p style="font-size:0.9rem;">${result.feedback}</p>
        ${result.missing?.length ? `<p style="font-size:0.8rem;color:var(--text-tertiary);margin-top:var(--space-2);"><strong>Missing:</strong> ${result.missing.join(', ')}</p>` : ''}</div>`;
        } catch (e) { ExaAPI.handleError(e); fb.innerHTML = '<p style="color:var(--danger-500);font-size:0.85rem;">Evaluation failed.</p>'; }
    },

    /* ========== HISTORY ========== */
    _historyCache: {},

    async renderHistory() {
        const container = document.getElementById('spekle-content');
        container.innerHTML = '<div style="text-align:center;padding:var(--space-8);"><div class="spinner lg" style="margin:0 auto;"></div></div>';

        const [quizzes, flashcards, questions] = await Promise.all([
            ExaDB.getAll('quizRecords'),
            ExaDB.getAll('flashcardRecords'),
            ExaDB.getAll('questionRecords')
        ]);

        // Cache for click-to-view
        this._historyCache = {};
        quizzes.forEach(r => this._historyCache[r.id] = { ...r, _type: 'quiz' });
        flashcards.forEach(r => this._historyCache[r.id] = { ...r, _type: 'flashcard' });
        questions.forEach(r => this._historyCache[r.id] = { ...r, _type: 'question' });

        const all = Object.values(this._historyCache);

        if (all.length === 0) {
            container.innerHTML = `<div class="empty-state animate-fade-in" style="padding:var(--space-8);text-align:center;">
                <div style="font-size:2.5rem;margin-bottom:var(--space-3);">📜</div>
                <h3>No History Yet</h3>
                <p style="color:var(--text-tertiary);font-size:0.9rem;margin-top:var(--space-2);">Generate a quiz, flashcards, or questions to see your history here.</p>
            </div>`;
            return;
        }

        all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const grouped = {};
        all.forEach(r => {
            const day = new Date(r.timestamp).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            if (!grouped[day]) grouped[day] = [];
            grouped[day].push(r);
        });

        const icons = { quiz: '🎯', flashcard: '🃏', question: '✍️' };
        const labels = { quiz: 'Quiz', flashcard: 'Flashcards', question: 'Questions' };

        let html = '<div class="animate-fade-in">';
        for (const [day, records] of Object.entries(grouped)) {
            html += `<div style="margin-bottom:var(--space-6);">`;
            html += `<h3 style="margin-bottom:var(--space-3);font-size:0.95rem;color:var(--text-secondary);border-bottom:1px solid var(--border-primary);padding-bottom:var(--space-2);">${day}</h3>`;

            for (const r of records) {
                const time = new Date(r.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                const icon = icons[r._type];
                const label = labels[r._type];

                if (r._type === 'quiz') {
                    const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
                    const color = pct >= 70 ? 'var(--success-500)' : pct >= 40 ? 'var(--warning-500)' : 'var(--danger-500)';
                    html += `<div class="card" style="margin-bottom:var(--space-3);padding:var(--space-4);cursor:pointer;" onclick="SpeklePage.viewHistoryItem('${r.id}')">
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <div style="display:flex;align-items:center;gap:var(--space-3);">
                                <span style="font-size:1.3rem;">${icon}</span>
                                <div>
                                    <div style="font-weight:600;font-size:0.9rem;">${label} — ${r.subject || '?'}: ${r.chapter || '?'}</div>
                                    <div style="font-size:0.8rem;color:var(--text-tertiary);">${r.difficulty || ''} · ${r.examType || ''} · ${r.total} Qs · ${time}</div>
                                </div>
                            </div>
                            <div style="display:flex;align-items:center;gap:var(--space-3);">
                                <div style="text-align:right;">
                                    <div style="font-size:1.3rem;font-weight:700;color:${color};">${pct}%</div>
                                    <div style="font-size:0.75rem;color:var(--text-tertiary);">${r.score}/${r.total}</div>
                                </div>
                                <span style="color:var(--text-tertiary);">→</span>
                            </div>
                        </div>
                    </div>`;
                } else if (r._type === 'flashcard') {
                    const count = r.cards ? r.cards.length : 0;
                    html += `<div class="card" style="margin-bottom:var(--space-3);padding:var(--space-4);cursor:pointer;" onclick="SpeklePage.viewHistoryItem('${r.id}')">
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <div style="display:flex;align-items:center;gap:var(--space-3);">
                                <span style="font-size:1.3rem;">${icon}</span>
                                <div>
                                    <div style="font-weight:600;font-size:0.9rem;">${label} — ${r.subject || '?'}: ${r.chapter || '?'}</div>
                                    <div style="font-size:0.8rem;color:var(--text-tertiary);">${r.difficulty || ''} · ${count} cards · ${time}</div>
                                </div>
                            </div>
                            <span style="color:var(--text-tertiary);">→</span>
                        </div>
                    </div>`;
                } else {
                    const count = r.questions ? r.questions.length : 0;
                    html += `<div class="card" style="margin-bottom:var(--space-3);padding:var(--space-4);cursor:pointer;" onclick="SpeklePage.viewHistoryItem('${r.id}')">
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <div style="display:flex;align-items:center;gap:var(--space-3);">
                                <span style="font-size:1.3rem;">${icon}</span>
                                <div>
                                    <div style="font-weight:600;font-size:0.9rem;">${label} — ${r.subject || '?'}: ${r.topic || '?'}</div>
                                    <div style="font-size:0.8rem;color:var(--text-tertiary);">${r.difficulty || ''} · ${count} questions · ${time}</div>
                                </div>
                            </div>
                            <span style="color:var(--text-tertiary);">→</span>
                        </div>
                    </div>`;
                }
            }
            html += '</div>';
        }
        html += '</div>';
        container.innerHTML = html;
    },

    viewHistoryItem(id) {
        const r = this._historyCache[id];
        if (!r) { UI.showToast('Record not found.', 'warning'); return; }
        if (r._type === 'quiz') this.viewQuizHistory(r);
        else if (r._type === 'flashcard') this.viewFlashcardHistory(r);
        else if (r._type === 'question') this.viewQuestionHistory(r);
    },

    viewQuizHistory(r) {
        const container = document.getElementById('spekle-content');
        const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
        const results = r.results || [];
        const correct = results.filter(x => x.correct).length;
        const wrong = results.filter(x => x.answered && !x.correct).length;
        const unanswered = results.filter(x => !x.answered).length;

        container.innerHTML = `
        <div class="animate-fade-in">
            <button class="btn btn-ghost" onclick="SpeklePage.switchTab('history')" style="margin-bottom:var(--space-4);">← Back to History</button>
            <div class="card no-hover quiz-interface">
                <div class="quiz-result-score">
                    <p style="font-size:0.85rem;color:var(--text-tertiary);">${r.subject}: ${r.chapter} · ${r.examType} · ${r.difficulty}</p>
                    <div class="result-percentage">${pct}%</div>
                    <p style="color:var(--text-secondary);">${r.examScore || r.score}/${r.examMaxScore || r.total} marks</p>
                    <div class="result-breakdown">
                        <div class="result-stat"><div class="result-stat-value" style="color:var(--success-500);">${correct}</div><div class="result-stat-label">Correct</div></div>
                        <div class="result-stat"><div class="result-stat-value" style="color:var(--danger-500);">${wrong}</div><div class="result-stat-label">Wrong</div></div>
                        <div class="result-stat"><div class="result-stat-value">${unanswered}</div><div class="result-stat-label">Skipped</div></div>
                    </div>
                    ${r.timeTaken ? `<p style="margin-top:var(--space-3);font-size:0.8rem;color:var(--text-tertiary);">⏱ ${Math.floor(r.timeTaken / 60)}m ${r.timeTaken % 60}s</p>` : ''}
                </div>
                <hr class="divider"><h3 style="margin-bottom:var(--space-4);">Answer Review</h3>
                ${results.map((q, i) => `<div style="margin-bottom:var(--space-4);padding:var(--space-3);background:var(--bg-secondary);border-radius:var(--radius-md);">
                    <p style="font-weight:500;margin-bottom:var(--space-2);">${i + 1}. ${q.question}</p>
                    ${(q.options || []).map((o, j) => `<div style="padding:var(--space-1) var(--space-2);border-radius:4px;font-size:0.9rem;${j === q.correctAnswer ? 'background:rgba(34,197,94,0.1);color:var(--success-600);' : ''}${j === q.userAnswer && j !== q.correctAnswer ? 'background:rgba(239,68,68,0.1);color:var(--danger-600);' : ''}">${String.fromCharCode(65 + j)}. ${o}${j === q.correctAnswer ? ' ✓' : ''}${j === q.userAnswer && j !== q.correctAnswer ? ' ✕' : ''}</div>`).join('')}
                    ${q.explanation ? `<p style="margin-top:var(--space-2);font-size:0.8rem;color:var(--text-secondary);border-left:3px solid var(--primary-300);padding-left:var(--space-3);">💡 ${q.explanation}</p>` : ''}
                </div>`).join('')}
            </div>
        </div>`;
    },

    viewFlashcardHistory(r) {
        const cards = r.cards || [];
        if (cards.length === 0) { UI.showToast('No cards saved in this record.', 'warning'); return; }

        // Load into flashcard viewer
        this.flashcardState = { cards, currentIndex: 0, mastered: new Set(), review: new Set() };

        const container = document.getElementById('spekle-content');
        container.innerHTML = `
        <div class="animate-fade-in">
            <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-4);">
                <button class="btn btn-ghost" onclick="SpeklePage.switchTab('history')">← Back to History</button>
                <span style="font-size:0.85rem;color:var(--text-tertiary);">${r.subject}: ${r.chapter} · ${r.difficulty} · ${cards.length} cards</span>
            </div>
            <div id="flashcard-area"></div>
        </div>`;
        this.renderFlashcards();
    },

    viewQuestionHistory(r) {
        const questions = r.questions || [];
        if (questions.length === 0) { UI.showToast('No questions saved.', 'warning'); return; }

        const container = document.getElementById('spekle-content');
        container.innerHTML = `
        <div class="animate-fade-in">
            <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-4);">
                <button class="btn btn-ghost" onclick="SpeklePage.switchTab('history')">← Back to History</button>
                <span style="font-size:0.85rem;color:var(--text-tertiary);">${r.subject}: ${r.topic} · ${r.difficulty} · ${questions.length} questions</span>
            </div>
            <h3 style="margin-bottom:var(--space-4);">✍️ Questions — Try Again</h3>
            ${questions.map((q, i) => `<div class="card no-hover question-card" id="qcard-${i}">
                <div class="question-text">${i + 1}. ${q.question}</div>
                ${q.keyPoints && q.keyPoints.length ? `<div style="margin-bottom:var(--space-3);">
                    <p style="font-size:0.8rem;color:var(--text-tertiary);margin-bottom:var(--space-1);"><strong>Key points to cover:</strong></p>
                    <ul style="font-size:0.8rem;color:var(--text-secondary);padding-left:var(--space-4);margin:0;">${q.keyPoints.map(k => `<li>${k}</li>`).join('')}</ul>
                </div>` : ''}
                <textarea class="answer-editor" id="answer-${i}" placeholder="Write your answer..."></textarea>
                <div style="margin-top:var(--space-3);"><button class="btn btn-primary btn-sm" onclick="SpeklePage.checkAnswer(${i}, \`${q.question.replace(/`/g, "'")}\`)">🔍 Check Answer</button></div>
                <div id="feedback-${i}"></div>
            </div>`).join('')}
        </div>`;
    }
};
