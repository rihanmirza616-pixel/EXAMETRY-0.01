/* ========================================
   EXAMETRY 0.01 — Dashboard Page
   Home Overview with KPIs & Charts
   ======================================== */

const DashboardPage = {
    charts: {},

    async render() {
        UI.setBreadcrumb(['Home', 'Dashboard']);
        const content = document.getElementById('app-content');
        const profile = await Settings.getProfile();
        const entries = await ExaDB.getAll('studyEntries');
        const quizRecords = await ExaDB.getAll('quizRecords');

        const greeting = UI.getGreeting();
        const name = profile?.name || 'Student';
        const streak = ExaAnalytics.getStudyStreak(entries);
        const weekHours = ExaAnalytics.getStudyHours(entries, 7);
        const allTopics = entries.flatMap(e => e.topics || []);
        const avgUnderstanding = allTopics.length > 0
            ? Math.round(allTopics.reduce((s, t) => s + (t.understanding || 0), 0) / allTopics.length)
            : 0;
        const quizAccuracy = ExaAnalytics.getQuizAccuracy(quizRecords);

        content.innerHTML = `
      <div class="page-enter">
        <div class="dashboard-greeting">
          <h1 class="greeting-text">${greeting}, ${name.split(' ')[0]}! 👋</h1>
          <p class="greeting-sub">Here's your study overview. Keep pushing towards your goals!</p>
        </div>

        <div class="kpi-grid stagger-children">
          <div class="card kpi-card blue">
            <div class="card-header">
              <span class="card-label">Study Hours (7 days)</span>
              <div class="card-icon" style="background: rgba(59,130,246,0.1); color: var(--primary-500);">📚</div>
            </div>
            <div class="card-value">${weekHours.toFixed(1)}h</div>
            <div class="card-trend up">📈 This week</div>
          </div>

          <div class="card kpi-card purple">
            <div class="card-header">
              <span class="card-label">Avg. Understanding</span>
              <div class="card-icon" style="background: rgba(139,92,246,0.1); color: var(--accent-500);">🧠</div>
            </div>
            <div class="card-value">${avgUnderstanding}%</div>
            <div class="progress-bar" style="margin-top: var(--space-2);"><div class="progress-fill" style="width: ${avgUnderstanding}%"></div></div>
          </div>

          <div class="card kpi-card green">
            <div class="card-header">
              <span class="card-label">Current Streak</span>
              <div class="card-icon" style="background: rgba(34,197,94,0.1); color: var(--success-500);">🔥</div>
            </div>
            <div class="card-value">${streak} days</div>
            <div class="card-trend ${streak > 0 ? 'up' : ''}">${streak > 0 ? 'Keep going!' : 'Start today!'}</div>
          </div>

          <div class="card kpi-card orange">
            <div class="card-header">
              <span class="card-label">Last Quiz Accuracy</span>
              <div class="card-icon" style="background: rgba(245,158,11,0.1); color: var(--warning-500);">🎯</div>
            </div>
            <div class="card-value">${quizAccuracy}%</div>
            <div class="card-trend ${quizAccuracy >= 70 ? 'up' : 'down'}">${quizAccuracy >= 70 ? 'Great job!' : 'Keep practicing'}</div>
          </div>
        </div>

        <div class="chart-row">
          <div class="card no-hover">
            <div class="card-header">
              <h3 class="card-title">Score Trend</h3>
            </div>
            <div class="chart-container"><canvas id="chart-scores"></canvas></div>
          </div>
          <div class="card no-hover">
            <div class="card-header">
              <h3 class="card-title">Subject Distribution</h3>
            </div>
            <div class="chart-container"><canvas id="chart-subjects"></canvas></div>
          </div>
        </div>

        <div class="chart-row">
          <div class="card no-hover">
            <div class="card-header">
              <h3 class="card-title">Skill Radar</h3>
            </div>
            <div class="chart-container"><canvas id="chart-radar"></canvas></div>
          </div>
          <div class="card no-hover">
            <div class="card-header">
              <h3 class="card-title">Quick Actions</h3>
            </div>
            <div class="flex-col" style="gap: var(--space-3);">
              <div class="quick-action-card card" onclick="App.navigate('analysis')">
                <div class="quick-action-icon" style="background: rgba(59,130,246,0.1); color: var(--primary-500);">📝</div>
                <div>
                  <div style="font-weight: 600; font-size: 0.9rem;">Log Today's Study</div>
                  <div style="font-size: 0.8rem; color: var(--text-tertiary);">Record your progress</div>
                </div>
              </div>
              <div class="quick-action-card card" onclick="App.navigate('rudius')">
                <div class="quick-action-icon" style="background: rgba(139,92,246,0.1); color: var(--accent-500);">🤖</div>
                <div>
                  <div style="font-weight: 600; font-size: 0.9rem;">Chat with Mentor</div>
                  <div style="font-size: 0.8rem; color: var(--text-tertiary);">Get AI guidance</div>
                </div>
              </div>
              <div class="quick-action-card card" onclick="App.navigate('spekle')">
                <div class="quick-action-icon" style="background: rgba(34,197,94,0.1); color: var(--success-500);">⚡</div>
                <div>
                  <div style="font-weight: 600; font-size: 0.9rem;">Start Spekle Quiz</div>
                  <div style="font-size: 0.8rem; color: var(--text-tertiary);">Practice with AI</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

        this.renderCharts(entries, quizRecords);
    },

    renderCharts(entries, quizRecords) {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const gridColor = isDark ? 'rgba(148,163,184,0.1)' : 'rgba(148,163,184,0.15)';
        const textColor = isDark ? '#94a3b8' : '#64748b';

        // Destroy old charts
        Object.values(this.charts).forEach(c => c?.destroy?.());

        // Score trend line chart
        const scoreTrend = ExaAnalytics.getScoreTrend(entries);
        const ctx1 = document.getElementById('chart-scores');
        if (ctx1 && scoreTrend.labels.length > 0) {
            this.charts.scores = new Chart(ctx1, {
                type: 'line',
                data: {
                    labels: scoreTrend.labels,
                    datasets: [{
                        label: 'Test Score %',
                        data: scoreTrend.values,
                        borderColor: '#3b82f6',
                        backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.08)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3,
                        pointBackgroundColor: '#3b82f6'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { ticks: { color: textColor, maxTicksLimit: 7 }, grid: { color: gridColor } },
                        y: { ticks: { color: textColor }, grid: { color: gridColor }, min: 0 }
                    }
                }
            });
        }

        // Subject distribution doughnut
        const subjDist = ExaAnalytics.getSubjectDistribution(entries);
        const ctx2 = document.getElementById('chart-subjects');
        if (ctx2 && subjDist.labels.length > 0) {
            const colors = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];
            this.charts.subjects = new Chart(ctx2, {
                type: 'doughnut',
                data: {
                    labels: subjDist.labels,
                    datasets: [{
                        data: subjDist.values,
                        backgroundColor: colors.slice(0, subjDist.labels.length),
                        borderWidth: 0,
                        spacing: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { color: textColor, padding: 12, usePointStyle: true } } },
                    cutout: '65%'
                }
            });
        }

        // Skill radar
        const ctx3 = document.getElementById('chart-radar');
        if (ctx3) {
            const consistency = ExaAnalytics.getConsistencyScore(entries);
            const accuracy = quizRecords.length > 0 ? ExaAnalytics.getQuizAccuracy(quizRecords) : 50;
            const avgUnd = entries.flatMap(e => e.topics || []);
            const retention = avgUnd.length > 0 ? Math.round(avgUnd.reduce((s, t) => s + t.understanding, 0) / avgUnd.length) : 50;
            const completionRate = Math.min(entries.length * 3, 100);

            this.charts.radar = new Chart(ctx3, {
                type: 'radar',
                data: {
                    labels: ['Speed', 'Accuracy', 'Confidence', 'Retention', 'Consistency'],
                    datasets: [{
                        label: 'Your Skills',
                        data: [
                            Math.min(70 + Math.random() * 20, 100),
                            accuracy,
                            Math.min(retention + 10, 100),
                            retention,
                            consistency
                        ],
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139,92,246,0.15)',
                        borderWidth: 2,
                        pointBackgroundColor: '#8b5cf6'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        r: {
                            ticks: { color: textColor, backdropColor: 'transparent' },
                            grid: { color: gridColor },
                            angleLines: { color: gridColor },
                            pointLabels: { color: textColor, font: { size: 11 } },
                            min: 0, max: 100
                        }
                    }
                }
            });
        }
    }
};
