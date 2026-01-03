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

    // --- Logic ---

    function calculateTotalTimeForUser(userType) {
        const userSessions = sessions.filter(s => s.user === userType);

        let totalMinutes = userSessions.reduce((total, session) => {
            return total + (parseInt(session.durationHours) * 60) + parseInt(session.durationMinutes);
        }, 0);

        const isNegative = totalMinutes < 0;
        const absTotalMinutes = Math.abs(totalMinutes);

        const days = Math.floor(absTotalMinutes / (60 * 24));
        const remainingMinutesAfterDays = absTotalMinutes % (60 * 24);
        const hours = Math.floor(remainingMinutesAfterDays / 60);
        const minutes = remainingMinutesAfterDays % 60;

        // Return values. If negative, we might want to indicate it in the UI, 
        // but for now the UI just shows numbers. Let's make the numbers negative if needed or handle it in UI updates.
        // Actually, usually "Days: -1" looks weird. Let's return the sign separately or apply it to the largest unit?
        // Let's keep it simple: if negative, apply "-" to the first non-zero unit or just returning positive numbers 
        // and handle the sign in `updateStats`.

        return {
            days,
            hours,
            minutes,
            isNegative
        };
    }

    // --- UI Updates ---

    function updateStats() {
        // Helper to format with sign
        const formatStat = (val, isNegative, isLeading) => {
            if (isNegative && isLeading) return `-${val}`;
            return val;
        };

        // Update Lior
        const statsLior = calculateTotalTimeForUser('lior');

        // Logic for sign display: 
        // If total is negative, we want the display to show it. 
        // E.g. -1 Days 2 Hours... or just - (1 Day ...). 
        // The current UI has separate blocks. 
        // Let's add a class or color if negative? Or just put the minus sign on the Days (or Hours if Days is 0).

        let liorSign = statsLior.isNegative ? '-' : '';
        // Only show sign on the largest unit that is non-zero, or the first one if all are zero?
        // Actually simplest is: -1 Days, 5 Hours... (meaning total is negative).
        // But if Days is 0, then -5 Hours. 

        // Let's try applyign negative class to the container if negative
        const liorContainer = document.getElementById('total-time-lior');
        if (statsLior.isNegative) liorContainer.classList.add('negative-balance');
        else liorContainer.classList.remove('negative-balance');

        daysLiorEl.textContent = (statsLior.isNegative && statsLior.days > 0 ? '-' : '') + statsLior.days;
        hoursLiorEl.textContent = (statsLior.isNegative && statsLior.days === 0 && statsLior.hours > 0 ? '-' : '') + statsLior.hours;
        minutesLiorEl.textContent = (statsLior.isNegative && statsLior.days === 0 && statsLior.hours === 0 ? '-' : '') + statsLior.minutes;


        // Update Ethan
        const statsEthan = calculateTotalTimeForUser('ethan');
        const ethanContainer = document.getElementById('total-time-ethan');
        if (statsEthan.isNegative) ethanContainer.classList.add('negative-balance');
        else ethanContainer.classList.remove('negative-balance');

        daysEthanEl.textContent = (statsEthan.isNegative && statsEthan.days > 0 ? '-' : '') + statsEthan.days;
        hoursEthanEl.textContent = (statsEthan.isNegative && statsEthan.days === 0 && statsEthan.hours > 0 ? '-' : '') + statsEthan.hours;
        minutesEthanEl.textContent = (statsEthan.isNegative && statsEthan.days === 0 && statsEthan.hours === 0 ? '-' : '') + statsEthan.minutes;
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
            // Check if it's a deduction (negative duration)
            const isDeduction = session.durationHours < 0 || session.durationMinutes < 0; // Or check if total is negative
            // Actually, we store negative values.
            // We can check if either is negative.
            // Note: `parseInt("-5")` is -5.

            item.className = `history-item ${isDeduction ? 'deduction' : ''}`;

            const typeLabel = session.type.charAt(0).toUpperCase() + session.type.slice(1);

            // User Badge
            const userBadges = {
                'lior': '<span style="color: #3b82f6; font-size: 0.75rem; border: 1px solid #3b82f6; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">LIOR</span>',
                'ethan': '<span style="color: #10b981; font-size: 0.75rem; border: 1px solid #10b981; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">ETHAN</span>'
            };
            const userBadge = userBadges[session.user] || '';

            // Duration Display
            // We want to show positive numbers usually, maybe with a minus sign if it's a deduction?
            // The logic: if stored as -1h, show "-1h".
            let h = session.durationHours;
            let m = session.durationMinutes;

            // For display, we want something like "- 1h 30m" or "-1h -30m"? 
            // Usually simpler: "-1h 30m" if both were subtracted. 
            // Let's just raw display carefully.

            let durationStr = '';

            // Logic to format nicely:
            // If it's a deduction, the values are negative.
            // e.g. h = -1, m = -30.
            // We want to display "- 1h 30m" or just "-1h 30m" 

            const isNeg = h < 0 || m < 0;
            const absH = Math.abs(h);
            const absM = Math.abs(m);

            if (isNeg) durationStr += '- ';

            if (absH > 0) durationStr += `${absH}h `;
            if (absM > 0) durationStr += `${absM}m`;
            if (absH === 0 && absM === 0) durationStr = '0m';

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
            // Reset radio to Add
            const radios = document.getElementsByName('action');
            if (radios.length > 0) radios[0].checked = true;

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
            let hours = parseInt(document.getElementById('duration-hours').value || 0);
            let minutes = parseInt(document.getElementById('duration-minutes').value || 0);

            // Get Action
            const action = document.querySelector('input[name="action"]:checked').value;

            if (hours == 0 && minutes == 0) {
                alert('Please enter a duration.');
                return;
            }

            if (action === 'subtract') {
                hours = -Math.abs(hours);
                minutes = -Math.abs(minutes);
            } else {
                hours = Math.abs(hours);
                minutes = Math.abs(minutes);
            }

            const newSession = {
                id: Date.now().toString(),
                user,
                title,
                type,
                date,
                durationHours: hours,
                durationMinutes: minutes,
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
