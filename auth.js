/* ========================================
   EXAMETRY 0.01 — Auth Page
   Login / Signup with local persistence
   ======================================== */

const AuthPage = {
    render() {
        const content = document.getElementById('app-content');
        // Hide sidebar/topbar for auth
        document.getElementById('sidebar').style.display = 'none';
        document.querySelector('.topbar').style.display = 'none';
        document.querySelector('.main-wrapper').style.marginLeft = '0';

        content.innerHTML = `
      <div class="auth-page">
        <div class="auth-container">
          <div class="auth-header">
            <div class="auth-logo">Ex</div>
            <h1 class="auth-title">Exametry</h1>
            <p class="auth-subtitle">Your AI-powered study companion for CUET, NEET, JEE & more</p>
          </div>

          <div class="auth-card" id="auth-card">
            <div id="login-form">
              <h2 style="margin-bottom: var(--space-5); font-size: 1.2rem;">Welcome back</h2>

              <div class="form-group" id="fg-email">
                <label class="form-label">Email</label>
                <input type="email" class="form-input" id="auth-email" placeholder="you@example.com" aria-label="Email address">
                <span class="form-error">Please enter a valid email</span>
              </div>

              <div class="form-group" id="fg-password">
                <label class="form-label">Password</label>
                <input type="password" class="form-input" id="auth-password" placeholder="Enter password" aria-label="Password">
                <span class="form-error">Password must be at least 6 characters</span>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-5);">
                <label class="form-checkbox">
                  <input type="checkbox" id="remember-me" checked>
                  <span style="font-size: 0.85rem; color: var(--text-secondary);">Remember me</span>
                </label>
              </div>

              <button class="btn btn-primary" style="width: 100%; padding: var(--space-3);" onclick="AuthPage.login()" id="login-btn">
                Sign In
              </button>

              <div class="auth-toggle">
                Don't have an account? <a onclick="AuthPage.showSignup()">Sign up</a>
              </div>
            </div>

            <div id="signup-form" style="display: none;">
              <h2 style="margin-bottom: var(--space-5); font-size: 1.2rem;">Create account</h2>

              <div class="form-group" id="fg-signup-name">
                <label class="form-label">Full Name</label>
                <input type="text" class="form-input" id="signup-name" placeholder="Your name" aria-label="Full name">
                <span class="form-error">Please enter your name</span>
              </div>

              <div class="form-group" id="fg-signup-email">
                <label class="form-label">Email</label>
                <input type="email" class="form-input" id="signup-email" placeholder="you@example.com" aria-label="Email">
                <span class="form-error">Please enter a valid email</span>
              </div>

              <div class="form-group" id="fg-signup-password">
                <label class="form-label">Password</label>
                <input type="password" class="form-input" id="signup-password" placeholder="Create a password" aria-label="Password">
                <span class="form-error">Password must be at least 6 characters</span>
              </div>

              <div class="form-group">
                <label class="form-label">Target Exam</label>
                <select class="form-select" id="signup-exam" aria-label="Target exam">
                  <option value="">Select exam</option>
                  <option value="NEET">NEET</option>
                  <option value="JEE Main">JEE Main</option>
                  <option value="JEE Advanced">JEE Advanced</option>
                  <option value="CUET">CUET</option>
                  <option value="12th Board">12th Board</option>
                  <option value="CET">CET</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <button class="btn btn-primary" style="width: 100%; padding: var(--space-3);" onclick="AuthPage.signup()" id="signup-btn">
                Create Account
              </button>

              <div class="auth-toggle">
                Already have an account? <a onclick="AuthPage.showLogin()">Sign in</a>
              </div>
            </div>
          </div>

          <div class="auth-notice">
            🔒 This is a prototype. Credentials are stored locally in your browser for demo purposes.
          </div>
        </div>
      </div>
    `;

        // Enter key support
        document.getElementById('auth-password')?.addEventListener('keypress', e => { if (e.key === 'Enter') AuthPage.login(); });
        document.getElementById('signup-password')?.addEventListener('keypress', e => { if (e.key === 'Enter') AuthPage.signup(); });
    },

    showSignup() {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('signup-form').style.display = 'block';
    },

    showLogin() {
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('signup-form').style.display = 'none';
    },

    async login() {
        const email = document.getElementById('auth-email').value.trim();
        const password = document.getElementById('auth-password').value;

        // Validate
        let valid = true;
        if (!email || !email.includes('@')) { document.getElementById('fg-email').classList.add('error'); valid = false; }
        else document.getElementById('fg-email').classList.remove('error');
        if (!password || password.length < 6) { document.getElementById('fg-password').classList.add('error'); valid = false; }
        else document.getElementById('fg-password').classList.remove('error');
        if (!valid) return;

        // Check if user exists
        const users = await ExaDB.getAll('users');
        const user = users.find(u => u.email === email);
        if (!user || user.password !== password) {
            UI.showToast('Invalid credentials. Please check your email and password.', 'error');
            return;
        }

        localStorage.setItem('exa_current_user', user.id);
        if (document.getElementById('remember-me').checked) {
            localStorage.setItem('exa_remember', 'true');
        }
        UI.showToast(`Welcome back, ${user.name}!`, 'success');
        App.showApp();
        App.navigate('dashboard');
    },

    async signup() {
        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const exam = document.getElementById('signup-exam').value;

        // Validate
        let valid = true;
        if (!name) { document.getElementById('fg-signup-name').classList.add('error'); valid = false; }
        else document.getElementById('fg-signup-name').classList.remove('error');
        if (!email || !email.includes('@')) { document.getElementById('fg-signup-email').classList.add('error'); valid = false; }
        else document.getElementById('fg-signup-email').classList.remove('error');
        if (!password || password.length < 6) { document.getElementById('fg-signup-password').classList.add('error'); valid = false; }
        else document.getElementById('fg-signup-password').classList.remove('error');
        if (!valid) return;

        // Check duplicate
        const users = await ExaDB.getAll('users');
        if (users.find(u => u.email === email)) {
            UI.showToast('An account with this email already exists.', 'warning');
            return;
        }

        const userId = ExaDB.generateId();
        await ExaDB.put('users', {
            id: userId,
            name, email, password,
            targetExam: exam,
            targetCollege: '',
            dailyGoal: 6,
            focusSubjects: [],
            createdAt: new Date().toISOString()
        });

        localStorage.setItem('exa_current_user', userId);
        UI.showToast(`Account created! Welcome to Exametry, ${name}! 🎉`, 'success');
        App.showApp();
        App.navigate('dashboard');
    }
};
