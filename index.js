// ============================================================
// LOCAL STORAGE – no Supabase
// ============================================================
console.log('📦 Using localStorage for data');

// ============================================================
// STATE
// ============================================================
let currentUser = null;
let userProfile = { name: 'Guest', currency: 'PKR', symbol: 'Rs' };
let transactions = [];
let editingId = null;
let myChart = null;

const CURRENCY_SYMBOLS = {
    PKR: 'Rs', USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥'
};

// ============================================================
// HELPERS
// ============================================================
function formatCurrency(amount) {
    const symbol = userProfile.symbol || 'Rs';
    return symbol + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
function escapeHTML(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(40px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
function updateUIWithUser() {
    const nameEl = document.getElementById('sidebarUserName');
    const avatarEl = document.getElementById('userAvatar');
    const currencyEl = document.getElementById('headerCurrencyDisplay');
    if (nameEl) nameEl.textContent = userProfile.name;
    if (avatarEl) {
        const initials = userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        avatarEl.textContent = initials;
    }
    if (currencyEl) currencyEl.textContent = userProfile.currency;
}
function showLoginPage(show) {
    const loginPage = document.getElementById('loginPage');
    const appContainer = document.getElementById('appContainer');
    if (loginPage) loginPage.classList.toggle('hidden', !show);
    if (appContainer) appContainer.style.display = show ? 'none' : 'flex';
}

// ============================================================
// LOCAL STORAGE HELPERS
// ============================================================
function loadUsers() {
    const data = localStorage.getItem('myhisab_users');
    return data ? JSON.parse(data) : {};
}
function saveUsers(users) {
    localStorage.setItem('myhisab_users', JSON.stringify(users));
}
function loadUserProfile(email) {
    const users = loadUsers();
    return users[email] || null;
}
function saveUserProfile(email, profile) {
    const users = loadUsers();
    users[email] = profile;
    saveUsers(users);
}
function loadTransactionsForUser(email) {
    const key = `myhisab_transactions_${email}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
}
function saveTransactionsForUser(email, txs) {
    const key = `myhisab_transactions_${email}`;
    localStorage.setItem(key, JSON.stringify(txs));
}

// ============================================================
// TOGGLE BETWEEN LOGIN AND SIGNUP FORMS
// ============================================================
function toggleForms(showLogin) {
    const loginContainer = document.getElementById('loginFormContainer');
    const signupContainer = document.getElementById('signupFormContainer');
    if (!loginContainer || !signupContainer) return;
    if (showLogin) {
        loginContainer.style.display = 'block';
        signupContainer.style.display = 'none';
    } else {
        loginContainer.style.display = 'none';
        signupContainer.style.display = 'block';
    }
}

// ============================================================
// LOGIN HANDLER
// ============================================================
async function handleLogin() {
    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;
    if (!email || !password) {
        showToast('Please enter email and password.', 'error');
        return;
    }
    const profile = loadUserProfile(email);
    if (!profile) {
        showToast('No account found with this email.', 'error');
        return;
    }
    if (profile.password !== password) {
        showToast('Incorrect password.', 'error');
        return;
    }
    // Login success
    currentUser = email;
    userProfile = {
        name: profile.name,
        currency: profile.currency,
        symbol: CURRENCY_SYMBOLS[profile.currency] || 'Rs'
    };
    transactions = loadTransactionsForUser(email);
    localStorage.setItem('myhisab_last_user', email);

    showLoginPage(false);
    updateUIWithUser();
    renderAll();
    showToast(`Welcome back, ${userProfile.name}!`, 'success');
}

// ============================================================
// SIGNUP HANDLER
// ============================================================
async function handleSignup() {
    const name = document.getElementById('signupName')?.value.trim();
    const email = document.getElementById('signupEmail')?.value.trim();
    const password = document.getElementById('signupPassword')?.value;
    const confirm = document.getElementById('signupConfirm')?.value;
    const currency = document.getElementById('signupCurrency')?.value;
    const balance = parseFloat(document.getElementById('signupBalance')?.value) || 0;
    const termsChecked = document.getElementById('termsCheck')?.checked;

    if (!name || !email || !password || !confirm) {
        showToast('Please fill in all required fields.', 'error');
        return;
    }
    if (password !== confirm) {
        showToast('Passwords do not match.', 'error');
        return;
    }
    if (!termsChecked) {
        showToast('Please accept the terms & conditions.', 'error');
        return;
    }
    if (password.length < 6) {
        showToast('Password must be at least 6 characters.', 'error');
        return;
    }
    if (loadUserProfile(email)) {
        showToast('An account with this email already exists.', 'error');
        return;
    }
    // Create profile
    const profile = { name, password, currency };
    saveUserProfile(email, profile);

    let txs = [];
    if (balance > 0) {
        const today = new Date().toISOString().slice(0, 10);
        txs.push({
            id: Date.now(),
            description: '💰 Initial Deposit (Sign-up)',
            amount: balance,
            category: 'Salary',
            type: 'income',
            date: today
        });
    }
    saveTransactionsForUser(email, txs);

    // Auto-login
    currentUser = email;
    userProfile = { name, currency, symbol: CURRENCY_SYMBOLS[currency] || 'Rs' };
    transactions = txs;
    localStorage.setItem('myhisab_last_user', email);

    showLoginPage(false);
    updateUIWithUser();
    renderAll();
    showToast(`Welcome, ${userProfile.name}! Your account is ready.`, 'success');
}

// ============================================================
// LOGOUT
// ============================================================
function logoutUser() {
    if (confirm('Are you sure you want to logout?')) {
        currentUser = null;
        userProfile = { name: 'Guest', currency: 'PKR', symbol: 'Rs' };
        transactions = [];
        localStorage.removeItem('myhisab_last_user');
        showLoginPage(true);
        toggleForms(false);
        const loginEmail = document.getElementById('loginEmail');
        const loginPassword = document.getElementById('loginPassword');
        if (loginEmail) loginEmail.value = '';
        if (loginPassword) loginPassword.value = '';
    }
}

// ============================================================
// TRANSACTIONS CRUD (localStorage)
// ============================================================
function loadTransactions() {
    if (!currentUser) return;
    transactions = loadTransactionsForUser(currentUser);
}
function saveTransactions() {
    if (!currentUser) return;
    saveTransactionsForUser(currentUser, transactions);
}
function addTransaction(description, amount, category, type, date) {
    const newTx = {
        id: Date.now(),
        description,
        amount,
        category,
        type,
        date
    };
    transactions.push(newTx);
    saveTransactions();
}
function updateTransaction(id, description, amount, category, type, date) {
    const index = transactions.findIndex(tx => tx.id === id);
    if (index !== -1) {
        transactions[index] = { ...transactions[index], description, amount, category, type, date };
        saveTransactions();
    }
}
function deleteTransaction(id) {
    transactions = transactions.filter(tx => tx.id !== id);
    saveTransactions();
}

// ============================================================
// TRANSACTION FORM HANDLING
// ============================================================
function initTransactionForm() {
    const form = document.getElementById('transactionForm');
    if (!form) {
        console.warn('⚠️ Transaction form not found – skipping init.');
        return;
    }
    const descInput = document.getElementById('description');
    const amountInput = document.getElementById('amount');
    const categorySelect = document.getElementById('category');
    const typeRadios = document.querySelectorAll('input[name="type"]');
    const submitBtn = document.getElementById('submitBtn');
    const formTitle = document.getElementById('formTitle');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const description = descInput?.value.trim() || '';
        const amount = parseFloat(amountInput?.value) || 0;
        const category = categorySelect?.value || 'Other';
        let type = 'expense';
        typeRadios.forEach(r => { if (r.checked) type = r.value; });

        if (!description) return showToast('Please enter a description.', 'error');
        if (amount <= 0) return showToast('Please enter a valid positive amount.', 'error');

        const today = new Date().toISOString().slice(0, 10);

        if (editingId !== null) {
            updateTransaction(editingId, description, amount, category, type, today);
            showToast('✅ Transaction updated!', 'success');
            editingId = null;
            if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Transaction';
            if (formTitle) formTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Add Transaction';
        } else {
            addTransaction(description, amount, category, type, today);
            showToast('🎉 Transaction added!', 'success');
        }

        loadTransactions();
        renderAll();
        if (form) form.reset();
        const incomeRadio = document.querySelector('input[name="type"][value="income"]');
        if (incomeRadio) incomeRadio.checked = true;
    });

    window.editTransaction = function(id) {
        const tx = transactions.find(t => t.id === id);
        if (!tx) return;
        if (descInput) descInput.value = tx.description;
        if (amountInput) amountInput.value = tx.amount;
        if (categorySelect) categorySelect.value = tx.category;
        typeRadios.forEach(r => { r.checked = (r.value === tx.type); });
        editingId = tx.id;
        if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-pen"></i> Update Transaction';
        if (formTitle) formTitle.innerHTML = '<i class="fas fa-pen"></i> Edit Transaction';
        document.querySelector('.form-box')?.scrollIntoView({ behavior: 'smooth' });
        if (descInput) descInput.focus();
    };

    window.deleteTransaction = function(id) {
        if (!confirm('Permanently delete this transaction?')) return;
        deleteTransaction(id);
        loadTransactions();
        renderAll();
        showToast('🗑️ Transaction deleted.', 'info');
    };
}

// ============================================================
// RENDER FUNCTIONS (with element checks)
// ============================================================
function getFilteredTransactions() {
    const year = document.getElementById('yearFilter')?.value || 'all';
    const month = document.getElementById('monthFilter')?.value || 'all';
    return transactions.filter(tx => {
        if (!tx.date) return false;
        if (year !== 'all') {
            const txYear = tx.date.slice(0, 4);
            if (txYear !== year) return false;
        }
        if (month !== 'all') {
            const txMonth = tx.date.slice(5, 7);
            return txMonth === month;
        }
        return true;
    });
}

function renderAll() {
    const filtered = getFilteredTransactions();
    let totalIncome = 0, totalExpense = 0;
    filtered.forEach(tx => {
        if (tx.type === 'income') totalIncome += tx.amount;
        else totalExpense += tx.amount;
    });
    const balance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;

    const incomeDisplay = document.getElementById('incomeDisplay');
    const expenseDisplay = document.getElementById('expenseDisplay');
    const balanceDisplay = document.getElementById('balanceDisplay');
    const savingsDisplay = document.getElementById('savingsDisplay');
    const txCountBadge = document.getElementById('txCountBadge');
    const topCategoryBadge = document.getElementById('topCategoryBadge');

    if (incomeDisplay) incomeDisplay.textContent = formatCurrency(totalIncome);
    if (expenseDisplay) expenseDisplay.textContent = formatCurrency(totalExpense);
    if (balanceDisplay) balanceDisplay.textContent = formatCurrency(balance);
    if (savingsDisplay) savingsDisplay.textContent = savingsRate.toFixed(0) + '%';
    if (txCountBadge) txCountBadge.innerHTML = `<i class="fas fa-list"></i> ${filtered.length} Transactions`;

    const expenses = filtered.filter(tx => tx.type === 'expense');
    const catMap = {};
    expenses.forEach(tx => { catMap[tx.category] = (catMap[tx.category] || 0) + tx.amount; });
    let topCat = 'None', topVal = 0;
    for (const [cat, val] of Object.entries(catMap)) {
        if (val > topVal) { topVal = val; topCat = cat; }
    }
    if (topCategoryBadge) {
        topCategoryBadge.innerHTML = topCat !== 'None' ? `<i class="fas fa-tag"></i> Top: ${topCat}` : '<i class="fas fa-tag"></i> Top: None';
    }

    renderChart(expenses);
    renderTransactionList(filtered);
}

function renderChart(expenses) {
    const catMap = {};
    expenses.forEach(tx => { catMap[tx.category] = (catMap[tx.category] || 0) + tx.amount; });
    const labels = Object.keys(catMap);
    const dataValues = Object.values(catMap);
    const chartEmptyMsg = document.getElementById('chartEmptyMsg');
    const canvas = document.getElementById('expenseChart');

    if (!canvas) return; // chart not available

    if (labels.length === 0) {
        if (chartEmptyMsg) chartEmptyMsg.style.display = 'block';
        if (myChart) { myChart.destroy(); myChart = null; }
        return;
    }
    if (chartEmptyMsg) chartEmptyMsg.style.display = 'none';

    const palette = ['#7c3aed', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];
    const colors = labels.map((_, i) => palette[i % palette.length]);

    if (myChart) { myChart.destroy(); myChart = null; }
    const ctx = canvas.getContext('2d');
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{ data: dataValues, backgroundColor: colors, borderColor: '#fff', borderWidth: 3 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#64748b', font: { size: 11, weight: '500' }, padding: 12, usePointStyle: true, pointStyle: 'circle' }
                }
            }
        }
    });
}

function renderTransactionList(filtered) {
    const container = document.getElementById('transactionList');
    if (!container) return;
    if (filtered.length === 0) {
        container.innerHTML = `<p class="empty-msg">No transactions for this period. Add one above!</p>`;
        return;
    }
    const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
    let html = '';
    sorted.forEach(tx => {
        const sign = tx.type === 'income' ? '+' : '-';
        const colorClass = tx.type === 'income' ? 'income-text' : 'expense-text';
        const dateObj = new Date(tx.date + 'T00:00:00');
        const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        html += `
            <div class="transaction-item" data-id="${tx.id}">
                <div class="tx-info">
                    <span class="tx-desc">${escapeHTML(tx.description)}</span>
                    <span class="tx-meta">
                        <span>${dateStr}</span>
                        <span class="tx-category">${escapeHTML(tx.category)}</span>
                    </span>
                </div>
                <span class="tx-amount ${colorClass}">${sign} ${formatCurrency(tx.amount)}</span>
                <div class="tx-actions">
                    <button class="edit-btn" onclick="editTransaction(${tx.id})"><i class="fas fa-pen"></i></button>
                    <button class="delete-btn" onclick="deleteTransaction(${tx.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// ============================================================
// PERIOD LABEL & YEAR DROPDOWN
// ============================================================
function updatePeriodLabel() {
    const year = document.getElementById('yearFilter')?.value || 'all';
    const month = document.getElementById('monthFilter')?.value || 'all';
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    let label = '';
    if (year === 'all') label = 'All Time';
    else if (month !== 'all') label = monthNames[parseInt(month)-1] + ' ' + year;
    else label = 'Full Year ' + year;
    const currentMonthDisplay = document.getElementById('currentMonthDisplay');
    const listMonthLabel = document.getElementById('listMonthLabel');
    if (currentMonthDisplay) currentMonthDisplay.textContent = label + ' Overview';
    if (listMonthLabel) listMonthLabel.textContent = 'Showing ' + label;
}
function populateYearFilter() {
    const currentYear = new Date().getFullYear();
    let earliestYear = currentYear;
    transactions.forEach(tx => {
        if (!tx.date) return;
        const y = parseInt(tx.date.slice(0, 4));
        if (y < earliestYear) earliestYear = y;
    });
    const yearFilter = document.getElementById('yearFilter');
    if (!yearFilter) return;
    yearFilter.innerHTML = '';
    const allOpt = document.createElement('option');
    allOpt.value = 'all';
    allOpt.textContent = 'All Years';
    yearFilter.appendChild(allOpt);
    for (let y = currentYear; y >= earliestYear; y--) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        yearFilter.appendChild(opt);
    }
}

// ============================================================
// SIDEBAR & DARK MODE
// ============================================================
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const menuToggle = document.getElementById('menuToggle');
    const mainContent = document.getElementById('mainContent');

    function toggleSidebar(forceState) {
        if (!sidebar) return;
        const isOpen = forceState !== undefined ? forceState : !sidebar.classList.contains('open');
        sidebar.classList.toggle('open', isOpen);
        if (window.innerWidth < 901 && overlay) overlay.classList.toggle('active', isOpen);
        else if (overlay) overlay.classList.remove('active');
        if (window.innerWidth >= 901 && mainContent) mainContent.classList.toggle('sidebar-open', isOpen);
        else if (mainContent) mainContent.classList.remove('sidebar-open');
        localStorage.setItem('sidebarOpen', isOpen);
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', (e) => { e.stopPropagation(); toggleSidebar(); });
    }
    if (overlay) {
        overlay.addEventListener('click', () => { if (window.innerWidth < 901) toggleSidebar(false); });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar?.classList.contains('open') && window.innerWidth < 901) toggleSidebar(false);
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth >= 901 && sidebar?.classList.contains('open')) {
            if (mainContent) mainContent.classList.add('sidebar-open');
            if (overlay) overlay.classList.remove('active');
        } else {
            if (mainContent) mainContent.classList.remove('sidebar-open');
            if (!sidebar?.classList.contains('open') && overlay) overlay.classList.remove('active');
        }
    });

    return toggleSidebar;
}
function initDarkMode() {
    const toggle = document.getElementById('darkModeToggle');
    if (!toggle) return;
    toggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        const isDark = document.body.classList.contains('dark');
        toggle.innerHTML = isDark ? '<i class="fas fa-sun"></i> Light' : '<i class="fas fa-moon"></i> Dark';
        localStorage.setItem('darkMode', isDark);
        renderAll();
    });
}

// ============================================================
// SETTINGS MODAL
// ============================================================
function initSettingsModal() {
    const settingsModal = document.getElementById('settingsModal');
    const settingsNavTrigger = document.getElementById('settingsNavTrigger');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (settingsNavTrigger) {
        settingsNavTrigger.addEventListener('click', () => {
            const nameInput = document.getElementById('settingsName');
            const currencyInput = document.getElementById('settingsCurrency');
            if (nameInput) nameInput.value = userProfile.name;
            if (currencyInput) currencyInput.value = userProfile.currency;
            if (settingsModal) settingsModal.classList.add('active');
        });
    }
    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', () => settingsModal?.classList.remove('active'));
    }
    if (settingsModal) {
        settingsModal.addEventListener('click', (e) => { if (e.target === settingsModal) settingsModal.classList.remove('active'); });
    }

    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', () => {
            const name = document.getElementById('settingsName')?.value.trim();
            const currency = document.getElementById('settingsCurrency')?.value;
            if (!name) return showToast('Please enter a name.', 'error');

            const profile = loadUserProfile(currentUser);
            if (profile) {
                profile.name = name;
                profile.currency = currency;
                saveUserProfile(currentUser, profile);
            }

            userProfile.name = name;
            userProfile.currency = currency;
            userProfile.symbol = CURRENCY_SYMBOLS[currency] || 'Rs';
            updateUIWithUser();
            renderAll();
            settingsModal?.classList.remove('active');
            showToast('✅ Settings updated!', 'success');
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            settingsModal?.classList.remove('active');
            logoutUser();
        });
    }
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 App initialising (localStorage mode)...');

    // Dark mode
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark');
        const toggle = document.getElementById('darkModeToggle');
        if (toggle) toggle.innerHTML = '<i class="fas fa-sun"></i> Light';
    }

    // Init sidebar
    const toggleSidebar = initSidebar();
    initDarkMode();
    initSettingsModal();
    initTransactionForm(); // safe: checks if form exists

    // Login / Signup buttons
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    if (signupBtn) signupBtn.addEventListener('click', handleSignup);

    // Toggle links
    const switchToSignup = document.getElementById('switchToSignup');
    const switchToLogin = document.getElementById('switchToLogin');
    if (switchToSignup) {
        switchToSignup.addEventListener('click', (e) => {
            e.preventDefault();
            toggleForms(false);
            const email = document.getElementById('loginEmail');
            const password = document.getElementById('loginPassword');
            if (email) email.value = '';
            if (password) password.value = '';
        });
    }
    if (switchToLogin) {
        switchToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            toggleForms(true);
            const name = document.getElementById('signupName');
            const email = document.getElementById('signupEmail');
            const password = document.getElementById('signupPassword');
            const confirm = document.getElementById('signupConfirm');
            const balance = document.getElementById('signupBalance');
            const terms = document.getElementById('termsCheck');
            if (name) name.value = '';
            if (email) email.value = '';
            if (password) password.value = '';
            if (confirm) confirm.value = '';
            if (balance) balance.value = '';
            if (terms) terms.checked = false;
        });
    }

    // Quick add button
    const addQuickBtn = document.getElementById('addQuickBtn');
    if (addQuickBtn) {
        addQuickBtn.addEventListener('click', () => {
            document.querySelector('.form-box')?.scrollIntoView({ behavior: 'smooth' });
            const desc = document.getElementById('description');
            if (desc) desc.focus();
        });
    }

    // Check for saved session
    const lastUser = localStorage.getItem('myhisab_last_user');
    if (lastUser) {
        const profile = loadUserProfile(lastUser);
        if (profile) {
            currentUser = lastUser;
            userProfile = {
                name: profile.name,
                currency: profile.currency,
                symbol: CURRENCY_SYMBOLS[profile.currency] || 'Rs'
            };
            transactions = loadTransactionsForUser(lastUser);
            showLoginPage(false);
            updateUIWithUser();
            populateYearFilter();
            const now = new Date();
            const yearFilter = document.getElementById('yearFilter');
            const monthFilter = document.getElementById('monthFilter');
            if (yearFilter) yearFilter.value = now.getFullYear();
            if (monthFilter) monthFilter.value = 'all';
            updatePeriodLabel();
            renderAll();
            const saved = localStorage.getItem('sidebarOpen');
            const isDesktop = window.innerWidth >= 901;
            let defaultOpen = isDesktop;
            if (saved !== null) defaultOpen = saved === 'true';
            toggleSidebar(defaultOpen);
            console.log('✅ Restored session for:', userProfile.name);
            return;
        }
    }

    // No session: show login page (signup by default)
    showLoginPage(true);
    toggleForms(false);
    console.log('📝 Showing signup page (default)');

    // Filter listeners
    const yearFilter = document.getElementById('yearFilter');
    const monthFilter = document.getElementById('monthFilter');
    if (yearFilter) {
        yearFilter.addEventListener('change', () => {
            updatePeriodLabel();
            renderAll();
        });
    }
    if (monthFilter) {
        monthFilter.addEventListener('change', () => {
            updatePeriodLabel();
            renderAll();
        });
    }

    console.log('✅ App initialised (localStorage)');
});
