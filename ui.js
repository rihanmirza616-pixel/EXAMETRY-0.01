/* ========================================
   EXAMETRY 0.01 — UI Module
   Modals, Toasts, Theme, Skeletons
   ======================================== */

const UI = {
    /* ---------- Theme ---------- */
    initTheme() {
        const saved = localStorage.getItem('exa_theme') || 'light';
        document.documentElement.setAttribute('data-theme', saved);
        this.updateThemeIcon(saved);
    },

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('exa_theme', next);
        this.updateThemeIcon(next);
        // Re-render charts with new theme colors if needed
        if (window.ExaCharts && typeof ExaCharts.updateTheme === 'function') {
            ExaCharts.updateTheme();
        }
    },

    updateThemeIcon(theme) {
        const btn = document.getElementById('theme-toggle');
        if (btn) btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    },

    /* ---------- Toasts ---------- */
    showToast(message, type = 'info', duration = 4000) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span>${message}</span>
    `;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), duration);
    },

    /* ---------- Modals ---------- */
    showModal(title, bodyHTML, actions = []) {
        let overlay = document.getElementById('modal-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'modal-overlay';
            overlay.className = 'modal-overlay';
            document.body.appendChild(overlay);
        }

        const actionsHTML = actions.map(a =>
            `<button class="btn ${a.class || 'btn-secondary'}" onclick="${a.onclick}">${a.label}</button>`
        ).join('');

        overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close" onclick="UI.closeModal()">&times;</button>
        </div>
        <div class="modal-body">${bodyHTML}</div>
        <div class="modal-footer">${actionsHTML}</div>
      </div>
    `;
        overlay.classList.add('active');
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.closeModal();
        });
    },

    closeModal() {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) overlay.classList.remove('active');
    },

    showConfirm(message, onConfirm) {
        this.showModal('Confirm', `<p>${message}</p>`, [
            { label: 'Cancel', class: 'btn-secondary', onclick: 'UI.closeModal()' },
            { label: 'Confirm', class: 'btn-danger', onclick: `UI.closeModal(); (${onConfirm.toString()})()` }
        ]);
    },

    /* ---------- Skeletons ---------- */
    showSkeleton(container, count = 3) {
        if (typeof container === 'string') container = document.getElementById(container);
        if (!container) return;
        container.innerHTML = Array(count).fill(`
      <div class="card no-hover" style="padding: var(--space-5);">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text short"></div>
      </div>
    `).join('');
    },

    hideSkeleton(container) {
        if (typeof container === 'string') container = document.getElementById(container);
        if (container) container.innerHTML = '';
    },

    /* ---------- Sidebar ---------- */
    initSidebar() {
        const collapsed = localStorage.getItem('exa_sidebar_collapsed') === 'true';
        const sidebar = document.getElementById('sidebar');
        if (collapsed && sidebar) sidebar.classList.add('collapsed');
    },

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;
        sidebar.classList.toggle('collapsed');
        localStorage.setItem('exa_sidebar_collapsed', sidebar.classList.contains('collapsed'));
    },

    toggleMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (!sidebar) return;
        sidebar.classList.toggle('mobile-open');
        if (overlay) overlay.style.display = sidebar.classList.contains('mobile-open') ? 'block' : 'none';
    },

    closeMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar) sidebar.classList.remove('mobile-open');
        if (overlay) overlay.style.display = 'none';
    },

    /* ---------- Loading States ---------- */
    showLoading(elementId) {
        const el = document.getElementById(elementId);
        if (el) {
            el.dataset.originalContent = el.innerHTML;
            el.innerHTML = '<div class="spinner" style="margin: 0 auto;"></div>';
            el.disabled = true;
        }
    },

    hideLoading(elementId) {
        const el = document.getElementById(elementId);
        if (el) {
            el.innerHTML = el.dataset.originalContent || '';
            el.disabled = false;
        }
    },

    /* ---------- Avatar ---------- */
    getInitials(name) {
        if (!name) return '?';
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    },

    /* ---------- Breadcrumbs ---------- */
    setBreadcrumb(sections) {
        const el = document.getElementById('breadcrumb');
        if (!el) return;
        el.innerHTML = sections.map((s, i) =>
            i < sections.length - 1
                ? `${s} <span style="margin: 0 4px; opacity: 0.5;">›</span>`
                : `<span>${s}</span>`
        ).join('');
    },

    /* ---------- Time Greeting ---------- */
    getGreeting() {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    },

    /* ---------- Format helpers ---------- */
    formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    },

    formatTime(dateStr) {
        return new Date(dateStr).toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit'
        });
    },

    timeAgo(dateStr) {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    }
};
