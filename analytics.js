/* ========================================
   EXAMETRY 0.01 — Analytics Module
   Calculations, Averages, Streaks
   ======================================== */

const ExaAnalytics = {
    /**
     * Compute average understanding for a set of topics
     * Average = Σ(topic scores) / number of topics
     */
    computeAverageUnderstanding(topics) {
        if (!topics || topics.length === 0) return 0;
        const sum = topics.reduce((acc, t) => acc + (t.understanding || 0), 0);
        return Math.round(sum / topics.length);
    },

    /**
     * Get weak chapters (below threshold, default 60%)
     * @param {Array} entries - Study entries
     * @param {number} threshold - Weakness threshold
     * @returns {Array} Weak chapter objects
     */
    getWeakChapters(entries, threshold = 60) {
        const chapterMap = {};
        entries.forEach(entry => {
            if (!entry.chapter) return;
            if (!chapterMap[entry.chapter]) {
                chapterMap[entry.chapter] = { name: entry.chapter, subject: entry.subject, scores: [] };
            }
            const avg = this.computeAverageUnderstanding(entry.topics || []);
            if (avg > 0) chapterMap[entry.chapter].scores.push(avg);
        });

        return Object.values(chapterMap)
            .filter(ch => {
                if (ch.scores.length === 0) return false;
                const avg = ch.scores.reduce((a, b) => a + b, 0) / ch.scores.length;
                ch.average = Math.round(avg);
                return avg < threshold;
            })
            .sort((a, b) => a.average - b.average);
    },

    /**
     * Get strong chapters (above threshold, default 80%)
     */
    getStrongChapters(entries, threshold = 80) {
        const chapterMap = {};
        entries.forEach(entry => {
            if (!entry.chapter) return;
            if (!chapterMap[entry.chapter]) {
                chapterMap[entry.chapter] = { name: entry.chapter, subject: entry.subject, scores: [] };
            }
            const avg = this.computeAverageUnderstanding(entry.topics || []);
            if (avg > 0) chapterMap[entry.chapter].scores.push(avg);
        });

        return Object.values(chapterMap)
            .filter(ch => {
                if (ch.scores.length === 0) return false;
                const avg = ch.scores.reduce((a, b) => a + b, 0) / ch.scores.length;
                ch.average = Math.round(avg);
                return avg >= threshold;
            })
            .sort((a, b) => b.average - a.average);
    },

    /**
     * Calculate study streak (consecutive days with entries)
     */
    getStudyStreak(entries) {
        if (!entries.length) return 0;
        const dates = [...new Set(entries.map(e => {
            const d = new Date(e.date);
            return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        }))].sort().reverse();

        let streak = 0;
        const today = new Date();
        let checkDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        for (const dateStr of dates) {
            const key = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
            if (dateStr === key) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else if (streak === 0) {
                // Allow checking yesterday if today has no entry yet
                checkDate.setDate(checkDate.getDate() - 1);
                const yKey = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
                if (dateStr === yKey) {
                    streak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            } else {
                break;
            }
        }
        return streak;
    },

    /**
     * Get total study hours for a time period
     */
    getStudyHours(entries, days = 7) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return entries
            .filter(e => new Date(e.date) >= cutoff)
            .reduce((sum, e) => sum + (e.timeSpent || 0), 0);
    },

    /**
     * Get subject distribution
     * @returns {{ labels: string[], values: number[] }}
     */
    getSubjectDistribution(entries) {
        const dist = {};
        entries.forEach(e => {
            if (!e.subject) return;
            dist[e.subject] = (dist[e.subject] || 0) + 1;
        });
        return {
            labels: Object.keys(dist),
            values: Object.values(dist)
        };
    },

    /**
     * Get test score trend over time
     * @returns {{ labels: string[], values: number[] }}
     */
    getScoreTrend(entries) {
        const sorted = entries
            .filter(e => e.testScore !== undefined && e.testScore !== null)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        return {
            labels: sorted.map(e => UI.formatDate(e.date)),
            values: sorted.map(e => {
                if (e.testTotal) return Math.round((e.testScore / e.testTotal) * 100);
                return e.testScore;
            })
        };
    },

    /**
     * Get time spent per subject
     * @returns {{ labels: string[], values: number[] }}
     */
    getTimePerSubject(entries) {
        const dist = {};
        entries.forEach(e => {
            if (!e.subject) return;
            dist[e.subject] = (dist[e.subject] || 0) + (e.timeSpent || 0);
        });
        return {
            labels: Object.keys(dist),
            values: Object.values(dist).map(v => Math.round(v * 10) / 10)
        };
    },

    /**
     * Get consistency score (0-100)
     * Weighted blend: 40% log frequency, 30% avg score, 30% daily hours
     */
    getConsistencyScore(entries, days = 30) {
        if (!entries.length) return 0;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        const recent = entries.filter(e => new Date(e.date) >= cutoff);

        // Log frequency (what % of days had entries)
        const uniqueDays = new Set(recent.map(e => new Date(e.date).toDateString())).size;
        const freqScore = Math.min((uniqueDays / days) * 100, 100);

        // Average understanding
        let totalUnd = 0, undCount = 0;
        recent.forEach(e => {
            (e.topics || []).forEach(t => {
                totalUnd += t.understanding || 0;
                undCount++;
            });
        });
        const avgScore = undCount > 0 ? totalUnd / undCount : 0;

        // Daily hours avg
        const totalHours = recent.reduce((s, e) => s + (e.timeSpent || 0), 0);
        const avgHours = totalHours / days;
        const hourScore = Math.min(avgHours / 6 * 100, 100); // 6 hours/day = 100%

        return Math.round(freqScore * 0.4 + avgScore * 0.3 + hourScore * 0.3);
    },

    /**
     * Get heatmap data for the last year
     * @returns {Object} date -> count mapping
     */
    getHeatmapData(entries) {
        const map = {};
        entries.forEach(e => {
            const d = new Date(e.date).toISOString().split('T')[0];
            map[d] = (map[d] || 0) + 1;
        });
        return map;
    },

    /**
     * Generate insights from entries
     */
    getInsights(entries) {
        const insights = [];
        const weak = this.getWeakChapters(entries);
        const strong = this.getStrongChapters(entries);
        const streak = this.getStudyStreak(entries);
        const consistency = this.getConsistencyScore(entries);

        if (weak.length > 0) {
            insights.push({
                icon: '⚠️',
                type: 'warning',
                text: `${weak[0].name} understanding is at ${weak[0].average}% — schedule a revision session.`
            });
        }

        if (strong.length > 0) {
            insights.push({
                icon: '🌟',
                type: 'success',
                text: `${strong[0].name} is your strongest chapter at ${strong[0].average}%! Keep it up.`
            });
        }

        if (streak >= 7) {
            insights.push({ icon: '🔥', type: 'success', text: `Amazing ${streak}-day streak! Consistency wins exams.` });
        } else if (streak === 0) {
            insights.push({ icon: '📚', type: 'info', text: `No study logged today yet. Start now to begin a streak!` });
        }

        if (consistency < 40) {
            insights.push({ icon: '📊', type: 'warning', text: `Consistency score is ${consistency}% — try logging daily.` });
        }

        if (entries.length > 10) {
            const recentScores = entries.slice(-5).filter(e => e.testScore);
            const olderScores = entries.slice(-10, -5).filter(e => e.testScore);
            if (recentScores.length && olderScores.length) {
                const recentAvg = recentScores.reduce((s, e) => s + e.testScore, 0) / recentScores.length;
                const olderAvg = olderScores.reduce((s, e) => s + e.testScore, 0) / olderScores.length;
                if (recentAvg > olderAvg) {
                    insights.push({ icon: '📈', type: 'success', text: `Your scores are trending up! Great progress.` });
                } else if (recentAvg < olderAvg * 0.9) {
                    insights.push({ icon: '📉', type: 'warning', text: `Recent scores dropping — consider revisiting fundamentals.` });
                }
            }
        }

        return insights;
    },

    /**
     * Get quiz accuracy from records
     */
    getQuizAccuracy(quizRecords) {
        if (!quizRecords.length) return 0;
        const latest = quizRecords[quizRecords.length - 1];
        if (!latest.results) return 0;
        const correct = latest.results.filter(r => r.correct).length;
        return Math.round((correct / latest.results.length) * 100);
    },

    /**
     * Exam scoring rules
     */
    SCORING_RULES: {
        'CUET': { correct: 5, wrong: -1, unanswered: 0 },
        'NEET': { correct: 4, wrong: -1, unanswered: 0 },
        'JEE Main': { correct: 4, wrong: -1, unanswered: 0 },
        'JEE Advanced': { correct: 4, wrong: -1, unanswered: 0 },
        '12th Board': { correct: 1, wrong: 0, unanswered: 0 },
        'CET': { correct: 1, wrong: 0, unanswered: 0 },
        'Other': { correct: 1, wrong: 0, unanswered: 0 }
    },

    calculateQuizScore(results, examType = 'Other') {
        const rules = this.SCORING_RULES[examType] || this.SCORING_RULES['Other'];
        let score = 0;
        let maxScore = 0;
        results.forEach(r => {
            maxScore += rules.correct;
            if (r.correct) score += rules.correct;
            else if (r.answered) score += rules.wrong;
            // unanswered: add 0
        });
        return { score, maxScore, percentage: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0 };
    }
};
