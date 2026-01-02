document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - Lior
    const daysLiorEl = document.getElementById('days-lior');
    const hoursLiorEl = document.getElementById('hours-lior');
    const minutesLiorEl = document.getElementById('minutes-lior');

    // DOM Elements - Ethan
    const daysEthanEl = document.getElementById('days-ethan');
    const hoursEthanEl = document.getElementById('hours-ethan');
    const minutesEthanEl = document.getElementById('minutes-ethan');

    const addEntryBtn = document.getElementById('add-entry-btn');
    const entryModal = document.getElementById('entry-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const entryForm = document.getElementById('entry-form');
    const historyListEl = document.getElementById('history-list');
    const clearAllBtn = document.getElementById('clear-all-btn');

    // State
    let sessions = [];

    // Initialize
    init();

    function init() {
        loadData();
        renderHistory();
        updateStats();
        setupEventListeners();
    }

    // --- State Management ---

    function loadData() {
        const storedSessions = localStorage.getItem('watchTrackSessions');
        if (storedSessions) {
            let loadedSessions = JSON.parse(storedSessions);
            // Migrate old 'me'/'brother' records to 'lior'/'ethan' if they exist
            sessions = loadedSessions.map(session => {
                if (!session.user || session.user === 'me') {
                    return { ...session, user: 'lior' };
                }
                if (session.user === 'brother') {
                    return { ...session, user: 'ethan' };
                }
                return session;
            });
        }
    }

    function saveData() {
        localStorage.setItem('watchTrackSessions', JSON.stringify(sessions));
        updateStats();
        renderHistory();
    }

    function addSession(session) {
        sessions.unshift(session);
        saveData();
    }

    function deleteSession(id) {
        sessions = sessions.filter(session => session.id !== id);
        saveData();
    }

    function clearAllSessions() {
        if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
            sessions = [];
            saveData();
        }
    }

    // --- Logic ---

    function calculateTotalTimeForUser(userType) {
        const userSessions = sessions.filter(s => s.user === userType);

        let totalMinutes = userSessions.reduce((total, session) => {
            return total + (parseInt(session.durationHours) * 60) + parseInt(session.durationMinutes);
        }, 0);

        const days = Math.floor(totalMinutes / (60 * 24));
        totalMinutes %= (60 * 24);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        return { days, hours, minutes };
    }

    // --- UI Updates ---

    function updateStats() {
        // Update Lior
        const statsLior = calculateTotalTimeForUser('lior');
        daysLiorEl.textContent = statsLior.days;
        hoursLiorEl.textContent = statsLior.hours;
        minutesLiorEl.textContent = statsLior.minutes;

        // Update Ethan
        const statsEthan = calculateTotalTimeForUser('ethan');
        daysEthanEl.textContent = statsEthan.days;
        hoursEthanEl.textContent = statsEthan.hours;
        minutesEthanEl.textContent = statsEthan.minutes;
    }

    function renderHistory() {
        historyListEl.innerHTML = '';

        if (sessions.length === 0) {
            historyListEl.innerHTML = `
                <div class="empty-state">
                    <p>No watching history yet.</p>
                </div>
            `;
            return;
        }

        sessions.forEach(session => {
            const item = document.createElement('div');
            item.className = 'history-item';

            const typeLabel = session.type.charAt(0).toUpperCase() + session.type.slice(1);

            // User Badge
            const userBadges = {
                'lior': '<span style="color: #3b82f6; font-size: 0.75rem; border: 1px solid #3b82f6; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">LIOR</span>',
                'ethan': '<span style="color: #10b981; font-size: 0.75rem; border: 1px solid #10b981; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">ETHAN</span>'
            };
            const userBadge = userBadges[session.user] || '';

            // Duration
            let durationStr = '';
            if (session.durationHours > 0) durationStr += `${session.durationHours}h `;
            if (session.durationMinutes > 0) durationStr += `${session.durationMinutes}m`;
            if (durationStr === '') durationStr = '0m';

            item.innerHTML = `
                <div class="item-info">
                    <div class="item-title">
                        ${escapeHtml(session.title)}
                        ${userBadge}
                    </div>
                    <div class="item-meta">
                        <span>${session.date}</span>
                        <div class="dot-separator"></div>
                        <span>${typeLabel}</span>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div class="item-duration">${durationStr}</div>
                    <button class="icon-btn delete-btn" data-id="${session.id}" aria-label="Delete">
                        &times;
                    </button>
                </div>
            `;
            historyListEl.appendChild(item);
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                deleteSession(id);
            });
        });
    }

    // --- Event Listeners ---

    function setupEventListeners() {
        addEntryBtn.addEventListener('click', () => {
            document.getElementById('date').valueAsDate = new Date();
            entryModal.classList.remove('hidden');
        });

        closeModalBtn.addEventListener('click', () => {
            entryModal.classList.add('hidden');
        });

        entryModal.addEventListener('click', (e) => {
            if (e.target === entryModal) {
                entryModal.classList.add('hidden');
            }
        });

        entryForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const title = document.getElementById('title').value;
            const user = document.getElementById('user').value;
            const type = document.getElementById('type').value;
            const date = document.getElementById('date').value;
            const hours = document.getElementById('duration-hours').value || 0;
            const minutes = document.getElementById('duration-minutes').value || 0;

            if (hours == 0 && minutes == 0) {
                alert('Please enter a duration.');
                return;
            }

            const newSession = {
                id: Date.now().toString(),
                user,
                title,
                type,
                date,
                durationHours: parseInt(hours),
                durationMinutes: parseInt(minutes),
                createdAt: new Date().toISOString()
            };

            addSession(newSession);

            entryForm.reset();
            entryModal.classList.add('hidden');
        });

        clearAllBtn.addEventListener('click', clearAllSessions);
    }

    function escapeHtml(text) {
        if (!text) return text;
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
