/* ========================================
   EXAMETRY 0.01 — Sample Data
   Demo data for testing/showcase
   ======================================== */

const SampleData = {
    async load() {
        // Sample user
        await ExaDB.put('users', {
            id: 'demo_user',
            name: 'Arjun Sharma',
            email: 'arjun@example.com',
            targetExam: 'NEET',
            targetCollege: 'AIIMS Delhi',
            dailyGoal: 8,
            focusSubjects: ['Biology', 'Chemistry', 'Physics'],
            createdAt: new Date().toISOString()
        });
        localStorage.setItem('exa_current_user', 'demo_user');

        // Sample study entries
        const subjects = ['Physics', 'Chemistry', 'Biology'];
        const chapters = {
            'Physics': ['Mechanics', 'Optics', 'Thermodynamics', 'Electrostatics', 'Modern Physics'],
            'Chemistry': ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Coordination Compounds'],
            'Biology': ['Cell Biology', 'Genetics', 'Ecology', 'Human Physiology', 'Plant Physiology']
        };
        const moods = ['😊 Focused', '😤 Determined', '😴 Tired', '😎 Confident', '😰 Anxious'];

        for (let i = 30; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            if (Math.random() < 0.2) continue; // Skip some days

            const subj = subjects[Math.floor(Math.random() * subjects.length)];
            const chapList = chapters[subj];
            const chap = chapList[Math.floor(Math.random() * chapList.length)];

            const topicCount = 2 + Math.floor(Math.random() * 3);
            const topics = [];
            for (let t = 0; t < topicCount; t++) {
                topics.push({
                    name: `${chap} - Topic ${t + 1}`,
                    understanding: 40 + Math.floor(Math.random() * 55),
                    notes: Math.random() > 0.5 ? 'Reviewed key concepts and solved practice problems.' : ''
                });
            }

            await ExaDB.put('studyEntries', {
                id: ExaDB.generateId(),
                date: date.toISOString().split('T')[0],
                examType: 'NEET',
                subject: subj,
                chapter: chap,
                topics: topics,
                testScore: Math.floor(50 + Math.random() * 130),
                testTotal: 180,
                timeSpent: 2 + Math.round(Math.random() * 6 * 10) / 10,
                mood: moods[Math.floor(Math.random() * moods.length)],
                tags: Math.random() > 0.5 ? ['Revision'] : ['Practice'],
                createdAt: date.toISOString()
            });
        }

        // Sample quiz records
        for (let q = 0; q < 5; q++) {
            const results = [];
            const numQ = 10;
            for (let i = 0; i < numQ; i++) {
                results.push({
                    question: `Sample question ${i + 1} for NEET practice`,
                    options: ['Option A', 'Option B', 'Option C', 'Option D'],
                    correctAnswer: 0,
                    userAnswer: Math.random() > 0.3 ? 0 : Math.floor(Math.random() * 4),
                    correct: Math.random() > 0.3,
                    answered: true,
                    explanation: 'This is the explanation for the correct answer.'
                });
            }

            const d = new Date();
            d.setDate(d.getDate() - q * 3);

            await ExaDB.put('quizRecords', {
                id: ExaDB.generateId(),
                subject: 'Biology',
                chapter: 'Cell Biology',
                difficulty: 'Medium',
                examType: 'NEET',
                quantity: numQ,
                results: results,
                score: results.filter(r => r.correct).length,
                total: numQ,
                timestamp: d.toISOString()
            });
        }

        // Sample chat conversations
        await ExaDB.put('chatConversations', {
            id: 'conv_demo',
            title: 'NEET Strategy Discussion',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        await ExaDB.put('chatMessages', {
            id: ExaDB.generateId(),
            conversationId: 'conv_demo',
            role: 'assistant',
            content: 'Hello Arjun! 👋 I\'m Rudius 3.z, your AI mentor for NEET preparation. I see you\'re targeting AIIMS Delhi — excellent goal!\n\nLet me help you strategize. Can you tell me:\n1. Which subjects feel most challenging?\n2. How many hours per day are you studying?\n3. Have you started solving previous year questions?',
            timestamp: new Date().toISOString()
        });

        UI.showToast('Sample data loaded successfully! 🎉', 'success');
    },

    async clear() {
        for (const store of Object.values(ExaDB.STORES)) {
            await ExaDB.clear(store);
        }
        localStorage.removeItem('exa_current_user');
        UI.showToast('All data cleared.', 'info');
    }
};
