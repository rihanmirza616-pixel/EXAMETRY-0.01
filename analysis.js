/* ========================================
   EXAMETRY 0.01 — Analysis Page
   Input Workspace, Timeline, Analytics
   ======================================== */

const AnalysisPage = {
    currentTab: 'input',
    editingEntryId: null,
    charts: {},

    async render() {
        UI.setBreadcrumb(['Analysis Mode']);
        const content = document.getElementById('app-content');
        content.innerHTML = `
      <div class="page-enter">
        <div class="page-header">
          <h1 class="page-title">Analysis Mode</h1>
          <p class="page-subtitle">Log, visualize, and analyze your study sessions</p>
        </div>

        <div class="tabs analysis-tabs">
          <div class="tab active" data-tab="input" onclick="AnalysisPage.switchTab('input')">📝 Input Workspace</div>
          <div class="tab" data-tab="timeline" onclick="AnalysisPage.switchTab('timeline')">📅 Timeline</div>
          <div class="tab" data-tab="analytics" onclick="AnalysisPage.switchTab('analytics')">📊 Analytics</div>
        </div>

        <div id="analysis-content"></div>
      </div>
    `;
        this.switchTab(this.currentTab);
    },

    switchTab(tab) {
        this.currentTab = tab;
        document.querySelectorAll('.analysis-tabs .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
        if (tab === 'input') this.renderInput();
        else if (tab === 'timeline') this.renderTimeline();
        else if (tab === 'analytics') this.renderAnalytics();
    },

    /* ---- INPUT WORKSPACE ---- */
    async renderInput() {
        const container = document.getElementById('analysis-content');
        const today = new Date().toISOString().split('T')[0];

        container.innerHTML = `
      <div class="card no-hover animate-fade-in" style="max-width: 800px;">
        <h3 style="margin-bottom: var(--space-5);">📝 Log Study Session</h3>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Date</label>
            <input type="date" class="form-input" id="entry-date" value="${today}">
          </div>
          <div class="form-group">
            <label class="form-label">Exam Focus</label>
            <select class="form-select" id="entry-exam">
              <option value="NEET">NEET</option>
              <option value="JEE Main">JEE Main</option>
              <option value="JEE Advanced">JEE Advanced</option>
              <option value="CUET">CUET</option>
              <option value="12th Board">12th Board</option>
              <option value="CET">CET</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Subject</label>
            <input type="text" class="form-input" id="entry-subject" placeholder="e.g. Physics">
          </div>
          <div class="form-group">
            <label class="form-label">Chapter</label>
            <input type="text" class="form-input" id="entry-chapter" placeholder="e.g. Mechanics">
          </div>
        </div>

        <div style="margin-bottom: var(--space-4);">
          <div class="flex-between" style="margin-bottom: var(--space-3);">
            <label class="form-label" style="margin: 0;">Topics</label>
            <button class="btn btn-ghost btn-sm" onclick="AnalysisPage.addTopic()">+ Add Topic</button>
          </div>
          <div id="topics-container" class="topic-repeater">
            <div class="topic-row" data-index="0">
              <div class="form-group" style="margin: 0;">
                <input type="text" class="form-input" placeholder="Topic name" data-field="name">
              </div>
              <div class="form-group" style="margin: 0; text-align: center;">
                <input type="range" class="range-slider" min="0" max="100" value="70" data-field="understanding"
                  oninput="this.closest('.topic-row').querySelector('.slider-value').textContent = this.value + '%'">
                <span class="slider-value">70%</span>
              </div>
              <div class="form-group" style="margin: 0;">
                <input type="text" class="form-input" placeholder="Notes (optional)" data-field="notes">
              </div>
              <button class="btn btn-ghost btn-sm" onclick="this.closest('.topic-row').remove()" title="Remove topic">✕</button>
            </div>
          </div>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Test Score</label>
            <div style="display: flex; gap: var(--space-2); align-items: center;">
              <input type="number" class="form-input" id="entry-score" placeholder="Score" style="width: 100px;">
              <span style="color: var(--text-tertiary);">/</span>
              <input type="number" class="form-input" id="entry-total" placeholder="Total" style="width: 100px;">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Time Spent (hours)</label>
            <input type="number" class="form-input" id="entry-time" placeholder="e.g. 3.5" step="0.5" min="0">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Mood</label>
          <div class="mood-selector" id="mood-selector">
            <button class="mood-btn" data-mood="😊 Focused" onclick="AnalysisPage.selectMood(this)">😊 Focused</button>
            <button class="mood-btn" data-mood="😤 Determined" onclick="AnalysisPage.selectMood(this)">😤 Determined</button>
            <button class="mood-btn" data-mood="😴 Tired" onclick="AnalysisPage.selectMood(this)">😴 Tired</button>
            <button class="mood-btn" data-mood="😎 Confident" onclick="AnalysisPage.selectMood(this)">😎 Confident</button>
            <button class="mood-btn" data-mood="😰 Anxious" onclick="AnalysisPage.selectMood(this)">😰 Anxious</button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Tags</label>
          <div class="tag-input-area" id="tags-area">
            <input type="text" class="form-input" id="tag-input" placeholder="Type and press Enter" style="width: 200px;"
              onkeypress="if(event.key==='Enter'){AnalysisPage.addTag(); event.preventDefault();}">
          </div>
        </div>

        <div style="display: flex; gap: var(--space-3); margin-top: var(--space-5);">
          <button class="btn btn-primary" onclick="AnalysisPage.saveEntry()" id="save-entry-btn">💾 Save Entry</button>
          <button class="btn btn-secondary" onclick="AnalysisPage.clearForm()">Clear</button>
        </div>
      </div>
    `;

        // Set profile's exam as default
        const profile = await Settings.getProfile();
        if (profile?.targetExam) {
            const examSelect = document.getElementById('entry-exam');
            if (examSelect) examSelect.value = profile.targetExam;
        }
    },

    addTopic() {
        const container = document.getElementById('topics-container');
        const idx = container.children.length;
        const row = document.createElement('div');
        row.className = 'topic-row';
        row.dataset.index = idx;
        row.innerHTML = `
      <div class="form-group" style="margin: 0;">
        <input type="text" class="form-input" placeholder="Topic name" data-field="name">
      </div>
      <div class="form-group" style="margin: 0; text-align: center;">
        <input type="range" class="range-slider" min="0" max="100" value="70" data-field="understanding"
          oninput="this.closest('.topic-row').querySelector('.slider-value').textContent = this.value + '%'">
        <span class="slider-value">70%</span>
      </div>
      <div class="form-group" style="margin: 0;">
        <input type="text" class="form-input" placeholder="Notes (optional)" data-field="notes">
      </div>
      <button class="btn btn-ghost btn-sm" onclick="this.closest('.topic-row').remove()" title="Remove topic">✕</button>
    `;
        container.appendChild(row);
    },

    selectMood(btn) {
        document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    },

    addTag() {
        const input = document.getElementById('tag-input');
        const tag = input.value.trim();
        if (!tag) return;
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.innerHTML = `${tag} <span class="chip-remove" onclick="this.parentElement.remove()">×</span>`;
        document.getElementById('tags-area').insertBefore(chip, input);
        input.value = '';
    },

    async saveEntry() {
        const subject = document.getElementById('entry-subject').value.trim();
        const chapter = document.getElementById('entry-chapter').value.trim();
        if (!subject) { UI.showToast('Please enter a subject.', 'warning'); return; }

        const topicRows = document.querySelectorAll('.topic-row');
        const topics = [];
        topicRows.forEach(row => {
            const name = row.querySelector('[data-field="name"]').value.trim();
            if (name) {
                topics.push({
                    name,
                    understanding: parseInt(row.querySelector('[data-field="understanding"]').value) || 0,
                    notes: row.querySelector('[data-field="notes"]').value.trim()
                });
            }
        });

        const tags = [];
        document.querySelectorAll('#tags-area .chip').forEach(c => {
            tags.push(c.textContent.replace('×', '').trim());
        });

        const activeMood = document.querySelector('.mood-btn.active');

        const entry = {
            id: this.editingEntryId || ExaDB.generateId(),
            date: document.getElementById('entry-date').value,
            examType: document.getElementById('entry-exam').value,
            subject,
            chapter,
            topics,
            testScore: parseInt(document.getElementById('entry-score').value) || null,
            testTotal: parseInt(document.getElementById('entry-total').value) || null,
            timeSpent: parseFloat(document.getElementById('entry-time').value) || 0,
            mood: activeMood ? activeMood.dataset.mood : '',
            tags,
            createdAt: new Date().toISOString()
        };

        await ExaDB.put('studyEntries', entry);
        UI.showToast(this.editingEntryId ? 'Entry updated! ✏️' : 'Study session saved! 📚', 'success');
        this.editingEntryId = null;
        this.clearForm();
    },

    clearForm() {
        document.getElementById('entry-subject').value = '';
        document.getElementById('entry-chapter').value = '';
        document.getElementById('entry-score').value = '';
        document.getElementById('entry-total').value = '';
        document.getElementById('entry-time').value = '';
        document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('#tags-area .chip').forEach(c => c.remove());
        const container = document.getElementById('topics-container');
        container.innerHTML = '';
        this.addTopic();
        this.editingEntryId = null;
    },

    /* ---- TIMELINE ---- */
    async renderTimeline() {
        const container = document.getElementById('analysis-content');
        const entries = await ExaDB.getAll('studyEntries');

        if (entries.length === 0) {
            container.innerHTML = `
        <div class="empty-state animate-fade-in">
          <div class="empty-state-icon">📅</div>
          <h3 class="empty-state-title">No study sessions yet</h3>
          <p class="empty-state-desc">Start logging your study sessions in the Input Workspace to see them here.</p>
          <button class="btn btn-primary" onclick="AnalysisPage.switchTab('input')">Log Your First Session</button>
        </div>
      `;
            return;
        }

        // Sort by date (newest first)
        entries.sort((a, b) => new Date(b.date) - new Date(a.date));

        container.innerHTML = `
      <div class="animate-fade-in">
        <div class="flex-between" style="margin-bottom: var(--space-4);">
          <div class="flex-row">
            <select class="form-select" style="width: 160px;" id="tl-filter-subject" onchange="AnalysisPage.renderTimeline()">
              <option value="">All Subjects</option>
              ${[...new Set(entries.map(e => e.subject))].map(s => `<option value="${s}">${s}</option>`).join('')}
            </select>
          </div>
          <span style="color: var(--text-tertiary); font-size: 0.85rem;">${entries.length} entries</span>
        </div>

        <div class="timeline-scroll" id="timeline-scroll">
          ${entries.map(e => this.renderTimelineCard(e)).join('')}
        </div>
      </div>
    `;
    },

    renderTimelineCard(entry) {
        const avg = ExaAnalytics.computeAverageUnderstanding(entry.topics || []);
        const scoreText = entry.testScore !== null && entry.testTotal
            ? `${entry.testScore}/${entry.testTotal} (${Math.round(entry.testScore / entry.testTotal * 100)}%)`
            : entry.testScore !== null ? entry.testScore : '—';

        return `
      <div class="card timeline-card" onclick="this.classList.toggle('expanded')" data-id="${entry.id}">
        <div class="timeline-date">${UI.formatDate(entry.date)} ${entry.mood ? '· ' + entry.mood.split(' ')[0] : ''}</div>
        <h4 style="font-size: 0.95rem; margin-bottom: var(--space-2);">${entry.subject} — ${entry.chapter || 'General'}</h4>
        <div class="timeline-summary">
          <div class="timeline-stat">
            <span class="timeline-stat-label">Time</span>
            <span class="timeline-stat-value">${entry.timeSpent || 0}h</span>
          </div>
          <div class="timeline-stat">
            <span class="timeline-stat-label">Score</span>
            <span class="timeline-stat-value">${scoreText}</span>
          </div>
          <div class="timeline-stat">
            <span class="timeline-stat-label">Understanding</span>
            <span class="timeline-stat-value" style="color: ${avg >= 70 ? 'var(--success-500)' : avg >= 50 ? 'var(--warning-500)' : 'var(--danger-500)'}">${avg}%</span>
          </div>
        </div>

        <div class="timeline-topics">
          ${(entry.topics || []).map(t => `
            <div class="timeline-topic">
              <span>${t.name}</span>
              <span style="color: ${t.understanding >= 70 ? 'var(--success-500)' : 'var(--warning-500)'}">${t.understanding}%</span>
            </div>
          `).join('')}
          <div style="display: flex; gap: var(--space-2); margin-top: var(--space-3);">
            <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation(); AnalysisPage.editEntry('${entry.id}')">✏️ Edit</button>
            <button class="btn btn-ghost btn-sm" style="color: var(--danger-500);" onclick="event.stopPropagation(); AnalysisPage.deleteEntry('${entry.id}')">🗑 Delete</button>
          </div>
        </div>
        <div style="text-align: center; margin-top: var(--space-2); color: var(--text-tertiary); font-size: 0.75rem;">▼ Click to expand</div>
      </div>
    `;
    },

    async editEntry(id) {
        const entry = await ExaDB.get('studyEntries', id);
        if (!entry) return;
        this.editingEntryId = id;
        this.switchTab('input');

        // Wait for DOM
        setTimeout(() => {
            document.getElementById('entry-date').value = entry.date;
            document.getElementById('entry-exam').value = entry.examType || '';
            document.getElementById('entry-subject').value = entry.subject || '';
            document.getElementById('entry-chapter').value = entry.chapter || '';
            document.getElementById('entry-score').value = entry.testScore ?? '';
            document.getElementById('entry-total').value = entry.testTotal ?? '';
            document.getElementById('entry-time').value = entry.timeSpent || '';

            // Set mood
            if (entry.mood) {
                document.querySelectorAll('.mood-btn').forEach(b => {
                    b.classList.toggle('active', b.dataset.mood === entry.mood);
                });
            }

            // Set topics
            const container = document.getElementById('topics-container');
            container.innerHTML = '';
            (entry.topics || []).forEach(t => {
                this.addTopic();
                const row = container.lastElementChild;
                row.querySelector('[data-field="name"]').value = t.name;
                row.querySelector('[data-field="understanding"]').value = t.understanding;
                row.querySelector('.slider-value').textContent = t.understanding + '%';
                row.querySelector('[data-field="notes"]').value = t.notes || '';
            });

            // Set tags
            (entry.tags || []).forEach(tag => {
                document.getElementById('tag-input').value = tag;
                this.addTag();
            });
        }, 100);
    },

    async deleteEntry(id) {
        UI.showConfirm('Delete this study entry?', async () => {
            await ExaDB.delete('studyEntries', id);
            UI.showToast('Entry deleted.', 'info');
            this.renderTimeline();
        });
    },

    /* ---- ANALYTICS ---- */
    async renderAnalytics() {
        const container = document.getElementById('analysis-content');
        const entries = await ExaDB.getAll('studyEntries');

        if (entries.length < 2) {
            container.innerHTML = `
        <div class="empty-state animate-fade-in">
          <div class="empty-state-icon">📊</div>
          <h3 class="empty-state-title">Need more data</h3>
          <p class="empty-state-desc">Log at least 2 study sessions to see analytics. Or load sample data from Settings.</p>
        </div>
      `;
            return;
        }

        const insights = ExaAnalytics.getInsights(entries);

        container.innerHTML = `
      <div class="animate-fade-in">
        <div class="analytics-grid">
          <div class="card no-hover">
            <h3 class="card-title" style="margin-bottom: var(--space-4);">📈 Score Trend</h3>
            <div class="chart-container"><canvas id="analytics-scores"></canvas></div>
          </div>
          <div class="card no-hover">
            <h3 class="card-title" style="margin-bottom: var(--space-4);">📊 Time Per Subject</h3>
            <div class="chart-container"><canvas id="analytics-time"></canvas></div>
          </div>
          <div class="card no-hover">
            <h3 class="card-title" style="margin-bottom: var(--space-4);">📚 Chapter Coverage</h3>
            <div class="chart-container"><canvas id="analytics-chapters"></canvas></div>
          </div>
          <div class="card no-hover">
            <h3 class="card-title" style="margin-bottom: var(--space-4);">🎯 Skill Metrics</h3>
            <div class="chart-container"><canvas id="analytics-radar"></canvas></div>
          </div>
        </div>

        <div class="card no-hover" style="margin-top: var(--space-5);">
          <h3 class="card-title" style="margin-bottom: var(--space-4);">🗓 Study Heatmap</h3>
          <div id="heatmap-container" style="overflow-x: auto; padding: var(--space-2);"></div>
        </div>

        <div class="card no-hover" style="margin-top: var(--space-5);">
          <h3 class="card-title" style="margin-bottom: var(--space-4);">💡 Insights</h3>
          <div class="insights-list">
            ${insights.map(i => `
              <div class="insight-item">
                <span class="insight-icon">${i.icon}</span>
                <span>${i.text}</span>
              </div>
            `).join('')}
            ${insights.length === 0 ? '<p style="color: var(--text-tertiary);">Log more sessions to get personalized insights.</p>' : ''}
          </div>
        </div>
      </div>
    `;

        this.renderAnalyticsCharts(entries);
        this.renderHeatmap(entries);
    },

    renderAnalyticsCharts(entries) {
        Object.values(this.charts).forEach(c => c?.destroy?.());
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const gridColor = isDark ? 'rgba(148,163,184,0.1)' : 'rgba(148,163,184,0.15)';
        const textColor = isDark ? '#94a3b8' : '#64748b';
        const colors = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

        // Score trend
        const scoreTrend = ExaAnalytics.getScoreTrend(entries);
        const c1 = document.getElementById('analytics-scores');
        if (c1 && scoreTrend.labels.length) {
            this.charts.s = new Chart(c1, {
                type: 'line',
                data: { labels: scoreTrend.labels, datasets: [{ data: scoreTrend.values, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.08)', fill: true, tension: 0.4, borderWidth: 2 }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: textColor }, grid: { color: gridColor } }, y: { ticks: { color: textColor }, grid: { color: gridColor } } } }
            });
        }

        // Time per subject
        const timeDist = ExaAnalytics.getTimePerSubject(entries);
        const c2 = document.getElementById('analytics-time');
        if (c2 && timeDist.labels.length) {
            this.charts.t = new Chart(c2, {
                type: 'bar',
                data: { labels: timeDist.labels, datasets: [{ data: timeDist.values, backgroundColor: colors.slice(0, timeDist.labels.length), borderRadius: 6 }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: textColor }, grid: { display: false } }, y: { ticks: { color: textColor }, grid: { color: gridColor } } } }
            });
        }

        // Chapter coverage (pie)
        const chapterMap = {};
        entries.forEach(e => { if (e.chapter) chapterMap[e.chapter] = (chapterMap[e.chapter] || 0) + 1; });
        const c3 = document.getElementById('analytics-chapters');
        const chapLabels = Object.keys(chapterMap).slice(0, 8);
        if (c3 && chapLabels.length) {
            this.charts.c = new Chart(c3, {
                type: 'pie',
                data: { labels: chapLabels, datasets: [{ data: chapLabels.map(l => chapterMap[l]), backgroundColor: colors, borderWidth: 0 }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: textColor, usePointStyle: true, font: { size: 10 } } } } }
            });
        }

        // Radar
        const c4 = document.getElementById('analytics-radar');
        if (c4) {
            const consistency = ExaAnalytics.getConsistencyScore(entries);
            const avg = entries.flatMap(e => e.topics || []);
            const ret = avg.length ? Math.round(avg.reduce((s, t) => s + t.understanding, 0) / avg.length) : 50;
            this.charts.r = new Chart(c4, {
                type: 'radar',
                data: {
                    labels: ['Speed', 'Accuracy', 'Confidence', 'Retention', 'Consistency'],
                    datasets: [{ data: [70, ret + 5, ret, ret, consistency], borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.12)', borderWidth: 2, pointBackgroundColor: '#8b5cf6' }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { r: { ticks: { color: textColor, backdropColor: 'transparent' }, grid: { color: gridColor }, angleLines: { color: gridColor }, pointLabels: { color: textColor }, min: 0, max: 100 } } }
            });
        }
    },

    renderHeatmap(entries) {
        const container = document.getElementById('heatmap-container');
        if (!container) return;
        const data = ExaAnalytics.getHeatmapData(entries);
        const maxCount = Math.max(...Object.values(data), 1);

        // Generate last 365 days
        const cells = [];
        for (let i = 364; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            const count = data[key] || 0;
            let level = '';
            if (count > 0) level = count >= maxCount * 0.75 ? 'l4' : count >= maxCount * 0.5 ? 'l3' : count >= maxCount * 0.25 ? 'l2' : 'l1';
            cells.push(`<div class="heatmap-cell ${level}" title="${key}: ${count} entries" data-tooltip="${key}: ${count}"></div>`);
        }

        // Display as 7 rows x 52 cols
        container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(52, 14px); grid-template-rows: repeat(7, 14px); gap: 2px;">
        ${cells.join('')}
      </div>
      <div style="display: flex; align-items: center; gap: var(--space-2); margin-top: var(--space-3); font-size: 0.75rem; color: var(--text-tertiary);">
        Less <div class="heatmap-cell" style="width:12px;height:12px;display:inline-block;"></div>
        <div class="heatmap-cell l1" style="width:12px;height:12px;display:inline-block;"></div>
        <div class="heatmap-cell l2" style="width:12px;height:12px;display:inline-block;"></div>
        <div class="heatmap-cell l3" style="width:12px;height:12px;display:inline-block;"></div>
        <div class="heatmap-cell l4" style="width:12px;height:12px;display:inline-block;"></div> More
      </div>
    `;
    }
};
