/* ========================================
   EXAMETRY 0.01 — Settings & Profile Page
   ======================================== */

const SettingsPage = {
  currentSection: 'profile',

  async render() {
    UI.setBreadcrumb(['Settings']);
    const profile = await Settings.getProfile() || {};
    const content = document.getElementById('app-content');

    content.innerHTML = `
      <div class="page-enter">
        <div class="page-header"><h1 class="page-title">Settings</h1></div>
        <div class="settings-layout">
          <div class="settings-nav">
            <div class="settings-nav-item active" data-section="profile" onclick="SettingsPage.showSection('profile')">👤 Profile</div>
            <div class="settings-nav-item" data-section="study" onclick="SettingsPage.showSection('study')">📚 Study Preferences</div>
            <div class="settings-nav-item" data-section="theme" onclick="SettingsPage.showSection('theme')">🎨 Theme & Accessibility</div>
            <div class="settings-nav-item" data-section="integrations" onclick="SettingsPage.showSection('integrations')">🔑 Integrations</div>
            <div class="settings-nav-item" data-section="data" onclick="SettingsPage.showSection('data')">💾 Data Management</div>
          </div>
          <div id="settings-content">
            ${this.renderProfile(profile)}
          </div>
        </div>
      </div>`;
  },

  showSection(s) {
    this.currentSection = s;
    document.querySelectorAll('.settings-nav-item').forEach(el => el.classList.toggle('active', el.dataset.section === s));
    const container = document.getElementById('settings-content');
    if (s === 'profile') Settings.getProfile().then(p => container.innerHTML = this.renderProfile(p || {}));
    else if (s === 'study') this.renderStudy(container);
    else if (s === 'theme') this.renderTheme(container);
    else if (s === 'integrations') this.renderIntegrations(container);
    else if (s === 'data') this.renderData(container);
  },

  renderProfile(p) {
    return `
      <div class="settings-section active animate-fade-in">
        <h2 class="settings-section-title">Profile Settings</h2>
        <div style="display:flex;align-items:center;gap:var(--space-5);margin-bottom:var(--space-6);">
          <div class="avatar xl">${UI.getInitials(p.name)}</div>
          <div><h3>${p.name || 'Student'}</h3><p style="color:var(--text-tertiary);">${p.email || ''}</p></div>
        </div>
        <div class="grid-2">
          <div class="form-group"><label class="form-label">Full Name</label><input type="text" class="form-input" id="prof-name" value="${p.name || ''}"></div>
          <div class="form-group"><label class="form-label">Email</label><input type="email" class="form-input" id="prof-email" value="${p.email || ''}"></div>
          <div class="form-group"><label class="form-label">Target Exam</label>
<div class="form-group">
  <label class="form-label">Target Exam</label>
  <select class="form-select" id="prof-exam">
    ${['NEET', 'JEE Main', 'JEE Advanced', 'CUET', '12th Board', 'CET', 'Other']
        .map(exam => `
        <option value="${exam}" ${p.targetExam === exam ? 'selected' : ''}>
          ${exam}
        </option>
      `).join('')}
  </select>
</div>
          <div class="form-group"><label class="form-label">Target College / Rank</label><input type="text" class="form-input" id="prof-college" value="${p.targetCollege || ''}"></div>
          <div class="form-group"><label class="form-label">Daily Goal (hours)</label><input type="number" class="form-input" id="prof-goal" value="${p.dailyGoal || 6}" min="1" max="16"></div>
          <div class="form-group"><label class="form-label">Focus Subjects</label><input type="text" class="form-input" id="prof-subjects" value="${(p.focusSubjects || []).join(', ')}" placeholder="Physics, Chemistry, Biology"></div>
        </div>
        <button class="btn btn-primary" onclick="SettingsPage.saveProfile()" style="margin-top:var(--space-4);">Save Changes</button>
      </div>`;
  },

  async saveProfile() {
    await Settings.updateProfile({
      name: document.getElementById('prof-name').value.trim(),
      email: document.getElementById('prof-email').value.trim(),
      targetExam: document.getElementById('prof-exam').value,
      targetCollege: document.getElementById('prof-college').value.trim(),
      dailyGoal: parseFloat(document.getElementById('prof-goal').value) || 6,
      focusSubjects: document.getElementById('prof-subjects').value.split(',').map(s => s.trim()).filter(Boolean)
    });
    // Update topbar avatar
    const name = document.getElementById('prof-name').value.trim();
    const avatar = document.getElementById('topbar-avatar-text');
    if (avatar) avatar.textContent = UI.getInitials(name);
    UI.showToast('Profile saved! ✓', 'success');
  },

  async renderStudy(container) {
    const profile = await Settings.getProfile() || {};
    const savedBooks = profile.books || [];
    const presetBooks = [
      'NCERT', 'NCERT Exemplar', 'HC Verma', 'RD Sharma', 'RS Aggarwal',
      'DC Pandey', 'Irodov', 'ML Khanna', 'SL Arora', 'Pradeep\'s',
      'OP Tandon', 'MS Chauhan', 'Morrison & Boyd', 'Trueman\'s Biology',
      'Dinesh Objective', 'Arihant', 'Cengage', 'MTG', 'Oswaal', 'S Chand'
    ];

    container.innerHTML = `
      <div class="settings-section active animate-fade-in">
        <h2 class="settings-section-title">Study Preferences</h2>

        <div class="setting-row"><div class="setting-info"><div class="setting-name">Weak Chapter Threshold</div><div class="setting-desc">Understanding below this % is flagged as weak</div></div>
          <input type="number" class="form-input" style="width:80px;" id="pref-weak" value="${await Settings.get('weak_threshold', 60)}" min="0" max="100"></div>
        <div class="setting-row"><div class="setting-info"><div class="setting-name">Strong Chapter Threshold</div><div class="setting-desc">Understanding above this % is marked as strong</div></div>
          <input type="number" class="form-input" style="width:80px;" id="pref-strong" value="${await Settings.get('strong_threshold', 80)}" min="0" max="100"></div>

        <hr class="divider" style="margin:var(--space-5) 0;">

        <h3 style="margin-bottom:var(--space-3);font-size:1rem;">📚 Books & Textbooks</h3>
        <p style="font-size:0.8rem;color:var(--text-tertiary);margin-bottom:var(--space-4);">Select the books you're studying from. Rudius AI will tailor its references & explanations to match your books.</p>

        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:var(--space-2);margin-bottom:var(--space-4);">
          ${presetBooks.map(b => `
            <label style="display:flex;align-items:center;gap:var(--space-2);padding:var(--space-2) var(--space-3);border-radius:var(--radius-md);cursor:pointer;font-size:0.85rem;border:1px solid var(--border-primary);transition:all 0.2s ease;" class="book-checkbox-label">
              <input type="checkbox" class="book-checkbox" value="${b}" ${savedBooks.includes(b) ? 'checked' : ''} onchange="this.parentElement.style.borderColor=this.checked?'var(--primary-400)':'var(--border-primary)';"
                style="accent-color:var(--primary-500);">
              ${b}
            </label>
          `).join('')}
        </div>

        <div class="form-group" style="margin-bottom:var(--space-4);">
          <label class="form-label">Custom Books (comma-separated)</label>
          <input type="text" class="form-input" id="custom-books" value="${savedBooks.filter(b => !presetBooks.includes(b)).join(', ')}" placeholder="e.g. Lakhmir Singh, Concepts of Physics">
        </div>

        <button class="btn btn-primary" onclick="SettingsPage.saveStudyPrefs()" style="margin-top:var(--space-4);">Save Study Preferences</button>
      </div>`;

    // Apply initial checked styling
    container.querySelectorAll('.book-checkbox').forEach(cb => {
      if (cb.checked) {
        cb.parentElement.style.borderColor = 'var(--primary-400)';
        cb.parentElement.style.background = 'var(--primary-50)';
      }
    });
  },

  async saveStudyPrefs() {
    await Settings.set('weak_threshold', parseInt(document.getElementById('pref-weak').value));
    await Settings.set('strong_threshold', parseInt(document.getElementById('pref-strong').value));

    // Collect selected books
    const checked = Array.from(document.querySelectorAll('.book-checkbox:checked')).map(cb => cb.value);
    const custom = document.getElementById('custom-books').value.split(',').map(s => s.trim()).filter(Boolean);
    const allBooks = [...new Set([...checked, ...custom])];

    // Save to profile
    await Settings.updateProfile({ books: allBooks });
    UI.showToast(`Preferences saved! ${allBooks.length} book${allBooks.length !== 1 ? 's' : ''} selected.`, 'success');
  },

  renderTheme(container) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    container.innerHTML = `
      <div class="settings-section active animate-fade-in">
        <h2 class="settings-section-title">Theme & Accessibility</h2>
        <div class="setting-row"><div class="setting-info"><div class="setting-name">Dark Mode</div><div class="setting-desc">Switch between light and dark themes</div></div>
          <label class="toggle"><input type="checkbox" ${isDark ? 'checked' : ''} onchange="UI.toggleTheme()"><span class="toggle-slider"></span></label></div>
        <div class="setting-row"><div class="setting-info"><div class="setting-name">Reduce Animations</div><div class="setting-desc">Minimize motion for better performance or accessibility</div></div>
          <label class="toggle"><input type="checkbox" id="reduce-motion" onchange="document.body.classList.toggle('reduced-motion',this.checked)"><span class="toggle-slider"></span></label></div>
        <div class="setting-row"><div class="setting-info"><div class="setting-name">Font Size</div><div class="setting-desc">Adjust base font size</div></div>
          <select class="form-select" style="width:120px;" onchange="document.documentElement.style.fontSize=this.value">
            <option value="14px">Small</option><option value="16px" selected>Default</option><option value="18px">Large</option><option value="20px">Extra Large</option></select></div>
      </div>`;
  },

  async renderIntegrations(container) {
    const groqKey = await KeyVault.getKey('groq');
    container.innerHTML = `
      <div class="settings-section active animate-fade-in">
        <h2 class="settings-section-title">API Integrations</h2>
        <div class="card no-hover">
          <h4 style="margin-bottom:var(--space-3);">🟢 Groq API Key</h4>
          <p style="font-size:0.8rem;color:var(--text-tertiary);margin-bottom:var(--space-3);">Powers all AI features — Rudius 3.z Mentor, Spekle Quizzes, Flashcards & Questions.</p>
          <div class="api-key-input">
            <input type="password" class="form-input" id="groq-key" value="${groqKey}" placeholder="gsk_...">
            <button class="btn btn-secondary btn-sm" onclick="this.previousElementSibling.type=this.previousElementSibling.type==='password'?'text':'password'">👁</button>
            <button class="btn btn-primary btn-sm" onclick="SettingsPage.saveAndTestKey()">Save & Test</button>
          </div>
          <div id="groq-status" style="margin-top:var(--space-2);font-size:0.8rem;"></div>
        </div>
      </div>`;
  },

  async saveAndTestKey() {
    const key = document.getElementById('groq-key').value.trim();
    if (!key) { UI.showToast('Please enter an API key.', 'warning'); return; }

    await KeyVault.saveKey('groq', key);
    document.getElementById('groq-status').innerHTML = '<span style="color:var(--text-tertiary);">Testing connection...</span>';

    const ok = await ExaAPI.testApiKey('groq');
    document.getElementById('groq-status').innerHTML = ok
      ? '<span style="color:var(--success-500);">✅ Connected successfully!</span>'
      : '<span style="color:var(--danger-500);">❌ Invalid key or connection failed.</span>';
    UI.showToast(ok ? 'Groq key saved & verified!' : 'Groq key test failed.', ok ? 'success' : 'error');
  },

  renderData(container) {
    container.innerHTML = `
      <div class="settings-section active animate-fade-in">
        <h2 class="settings-section-title">Data Management</h2>
        <div class="setting-row"><div class="setting-info"><div class="setting-name">Export All Data</div><div class="setting-desc">Download all your data as a JSON file</div></div>
          <button class="btn btn-secondary" onclick="SettingsPage.exportData()">📥 Export</button></div>
        <div class="setting-row"><div class="setting-info"><div class="setting-name">Import Data</div><div class="setting-desc">Restore from a previously exported JSON file</div></div>
          <div><input type="file" id="import-file" accept=".json" style="display:none;" onchange="SettingsPage.importData(event)">
          <button class="btn btn-secondary" onclick="document.getElementById('import-file').click()">📤 Import</button></div></div>
        <div class="setting-row"><div class="setting-info"><div class="setting-name">Load Sample Data</div><div class="setting-desc">Load demo data for testing features</div></div>
          <button class="btn btn-secondary" onclick="SettingsPage.loadSample()">🧪 Load</button></div>
        <div class="setting-row"><div class="setting-info"><div class="setting-name" style="color:var(--danger-500);">Delete All Data</div><div class="setting-desc">Permanently remove all stored data</div></div>
          <button class="btn btn-danger" onclick="SettingsPage.deleteAll()">🗑 Delete</button></div>
      </div>`;
  },

  async exportData() {
    const json = await DataManager.exportAll();
    DataManager.downloadJSON(json, `exametry-backup-${new Date().toISOString().split('T')[0]}.json`);
    UI.showToast('Data exported! 📥', 'success');
  },

  async importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const text = await file.text();
    const ok = await DataManager.importAll(text);
    UI.showToast(ok ? 'Data imported successfully! 🎉' : 'Import failed. Check file format.', ok ? 'success' : 'error');
    if (ok) App.navigate('dashboard');
  },

  async loadSample() {
    UI.showConfirm('Load sample data? This will add demo entries for testing.', async () => {
      await SampleData.load();
      App.navigate('dashboard');
    });
  },

  async deleteAll() {
    UI.showConfirm('⚠️ Delete ALL data? This cannot be undone!', async () => {
      await DataManager.deleteAll();
      UI.showToast('All data deleted.', 'info');
      location.reload();
    });
  }
};
