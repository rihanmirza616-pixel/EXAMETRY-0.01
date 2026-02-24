/* ========================================
   EXAMETRY 0.01 — Main App Router
   SPA Navigation, Init, Event Delegation
   ======================================== */

const App = {
    currentPage: 'dashboard',

    async init() {
        // Initialize IndexedDB
        await ExaDB.init();

        // Initialize theme
        UI.initTheme();
        UI.initSidebar();

        // Check authentication
        const userId = localStorage.getItem('exa_current_user');
        if (!userId) {
            this.showAuth();
            return;
        }

        // Verify user exists
        const user = await ExaDB.get('users', userId);
        if (!user) {
            localStorage.removeItem('exa_current_user');
            this.showAuth();
            return;
        }

        this.showApp();

        // Handle hash-based routing
        const hash = window.location.hash.slice(1) || 'dashboard';
        this.navigate(hash);

        // Listen for hash changes
        window.addEventListener('hashchange', () => {
            const page = window.location.hash.slice(1) || 'dashboard';
            this.navigate(page);
        });

        // Update topbar avatar
        const avatar = document.getElementById('topbar-avatar-text');
        if (avatar) avatar.textContent = UI.getInitials(user.name);
    },

    showAuth() {
        document.getElementById('app-content').innerHTML = '';
        AuthPage.render();
    },

    showApp() {
        // Show sidebar & topbar
        const sidebar = document.getElementById('sidebar');
        const topbar = document.querySelector('.topbar');
        const mainWrapper = document.querySelector('.main-wrapper');
        if (sidebar) sidebar.style.display = 'flex';
        if (topbar) topbar.style.display = 'flex';
        if (mainWrapper) mainWrapper.style.marginLeft = '';
    },

    navigate(page) {
        this.currentPage = page;
        window.location.hash = page;

        // Update sidebar active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // Close mobile menu if open
        UI.closeMobileMenu();

        // Route to page
        switch (page) {
            case 'dashboard': DashboardPage.render(); break;
            case 'analysis': AnalysisPage.render(); break;
            case 'rudius': RudiusPage.render(); break;
            case 'spekle': SpeklePage.render(); break;
            case 'tictactoe': TicTacToePage.render(); break;
            case 'settings': SettingsPage.render(); break;
            default: DashboardPage.render();
        }
    },

    logout() {
        UI.showConfirm('Log out of Exametry?', () => {
            localStorage.removeItem('exa_current_user');
            location.reload();
        });
    }
};

// Debounce utility
function debounce(fn, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
