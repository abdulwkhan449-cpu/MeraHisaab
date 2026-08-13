// ============================================================
// 0. USER PROFILE MANAGEMENT
// ============================================================
let userProfile = { name: 'Guest', currency: 'PKR', symbol: 'Rs' };

const CURRENCY_SYMBOLS = {
    PKR: 'Rs',
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    JPY: '¥'
};

function loadUserProfile() {
    const stored = localStorage.getItem('userProfile');
    if (stored) {
        userProfile = JSON.parse(stored);
        if (!userProfile.symbol || !CURRENCY_SYMBOLS[userProfile.currency]) {
            userProfile.symbol = CURRENCY_SYMBOLS[userProfile.currency] || 'Rs';
        }
        console.log('✅ Profile loaded:', userProfile);
        return true;
    }
    return false;
}

function saveUserProfile(name, currency, initialBalance = 0) {
    userProfile = {
        name: name,
        currency: currency,
        symbol: CURRENCY_SYMBOLS[currency] || 'Rs'
    };
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    console.log('✅ Profile saved:', userProfile);
    
    if (initialBalance > 0) {
        const today = new Date().toISOString().slice(0, 10);
        const newTx = {
            id: Date.now(),
            description: '💰 Initial Deposit (Sign-up)',
            amount: parseFloat(initialBalance),
            category: 'Salary',
            type: 'income',
            date: today
        };
        let txs = JSON.parse(localStorage.getItem('financeData') || '[]');
        txs.push(newTx);
        localStorage.setItem('financeData', JSON.stringify(txs));
    }
    
    showLoginPage(false);
    initApp();
    renderAll();
    updateUIWithUser();
}

function updateUIWithUser() {
    document.getElementById('sidebarUserName').textContent = userProfile.name;
    const initials = userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    document.getElementById('userAvatar').textContent = initials;
    document.getElementById('headerCurrencyDisplay').textContent = userProfile.currency;
    console.log('🔄 UI updated with currency:', userProfile.currency, 'symbol:', userProfile.symbol);
}

// ============================================================
// LOGIN PAGE (with force-clear)
// ============================================================
function showLoginPage(show) {
    const loginPage = document.getElementById('loginPage');
    const appContainer = document.getElementById('appContainer');
    if (show) {
        loginPage.classList.remove('hidden');
        appContainer.style.display = 'none';

        const nameInput = document.getElementById('loginName');
        const balanceInput = document.getElementById('loginBalance');
        nameInput.value = '';
        balanceInput.value = '';
        nameInput.setAttribute('autocomplete', 'off');
        balanceInput.setAttribute('autocomplete', 'off');
        setTimeout(() => {
            nameInput.value = '';
            balanceInput.value = '';
        }, 50);
    } else {
        loginPage.classList.add('hidden');
        appContainer.style.display = 'flex';
    }
}

function logoutUser() {
    if (confirm('Are you sure you want to logout? Your data will remain saved.')) {
        localStorage.removeItem('userProfile');
        location.reload();
    }
}

// ============================================================
// 1. SIDEBAR LOGIC
// ============================================================
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebarOverlay');
const menuToggle = document.getElementById('menuToggle');
const mainContent = document.getElementById('mainContent');

function toggleSidebar(forceState) {
    const isOpen = forceState !== undefined ? forceState : !sidebar.classList.contains('open');
    sidebar.classList.toggle('open', isOpen);

    if (window.innerWidth < 901) {
        overlay.classList.toggle('active', isOpen);
    } else {
        overlay.classList.remove('active');
    }

    if (window.innerWidth >= 901) {
        mainContent.classList.toggle('sidebar-open', isOpen);
    } else {
        mainContent.classList.remove('sidebar-open');
    }
    localStorage.setItem('sidebarOpen', isOpen);
}

menuToggle.addEventListener('click', (e) => { e.stopPropagation(); toggleSidebar(); });
overlay.addEventListener('click', () => { if (window.innerWidth < 901) toggleSidebar(false); });
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open') && window.innerWidth < 901) {
        toggleSidebar(false);
    }
});

let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        const isDesktop = window.innerWidth >= 901;
        if (isDesktop && sidebar.classList.contains('open')) {
            mainContent.classList.add('sidebar-open');
            overlay.classList.remove('active');
        } else {
            mainContent.classList.remove('sidebar-open');
        }
        if (!isDesktop && sidebar.classList.contains('open')) {
            overlay.classList.add('active');
        } else if (!isDesktop) {
            overlay.classList.remove('active');
        }
    }, 150);
});

// ============================================================
// 2. SETTINGS MODAL
// ============================================================
const settingsModal = document.getElementById('settingsModal');
const settingsNavTrigger = document.getElementById('settingsNavTrigger');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const logoutBtn = document.getElementById('logoutBtn');
const settingsName = document.getElementById('settingsName');
const settingsCurrency = document.getElementById('settingsCurrency');

function openSettings() {
    settingsName.value = userProfile.name;
    settingsCurrency.value = userProfile.currency;
    settingsModal.classList.add('active');
}
function closeSettings() {
    settingsModal.classList.remove('active');
}

if (settingsNavTrigger) {
    settingsNavTrigger.addEventListener('click', openSettings);
}

closeSettingsBtn.addEventListener('click', closeSettings);
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) closeSettings();
});

saveSettingsBtn.addEventListener('click', () => {
    const name = settingsName.value.trim();
    const currency = settingsCurrency.value;
    if (!name) return showToast('Please enter a name.', 'error');
    
    userProfile.name = name;
    userProfile.currency = currency;
    userProfile.symbol = CURRENCY_SYMBOLS[currency] || 'Rs';
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    updateUIWithUser();
    renderAll();
    closeSettings();
    showToast('✅ Settings updated successfully!', 'success');
});

logoutBtn.addEventListener('click', () => {
    closeSettings();
    logoutUser();
});

// ============================================================
// 3. LOGIN HANDLER
// ============================================================
const loginBtn = document.getElementById('loginBtn');
const loginName = document.getElementById('loginName');
const loginBalance = document.getElementById('loginBalance');
const loginCurrency = document.getElementById('loginCurrency');

loginName.value = '';
loginBalance.value = '';

loginBtn.addEventListener('click', () => {
    const name = loginName.value.trim();
    const currency = loginCurrency.value;
    const balance = parseFloat(loginBalance.value) || 0;
    
    if (!name) {
        showToast('Please enter your name.', 'error');
        return;
    }
    saveUserProfile(name, currency, balance);
});

loginBalance.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loginBtn.click();
});
loginName.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loginBtn.click();
});

// ============================================================
// 4. MAIN APP STATE
// ============================================================
let transactions = [];
let editingId = null;
let myChart = null;

// ============================================================
// 5. DOM REFS
// ============================================================
const form = document.getElementById('transactionForm');
const descInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const typeRadios = document.querySelectorAll('input[name="type"]');
const submitBtn = document.getElementById('submitBtn');
const formTitle = document.getElementById('formTitle');

const balanceDisplay = document.getElementById('balanceDisplay');
const incomeDisplay = document.getElementById('incomeDisplay');
const expenseDisplay = document.getElementById('expenseDisplay');
const savingsDisplay = document.getElementById('savingsDisplay');
const transactionList = document.getElementById('transactionList');
const yearFilter = document.getElementById('yearFilter');
const monthFilter = document.getElementById('monthFilter');
const darkToggle = document.getElementById('darkModeToggle');
const chartCanvas = document.getElementById('expenseChart');
const chartEmptyMsg = document.getElementById('chartEmptyMsg');
const currentMonthDisplay = document.getElementById('currentMonthDisplay');
const listMonthLabel = document.getElementById('listMonthLabel');
const txCountBadge = document.getElementById('txCountBadge');
const topCategoryBadge = document.getElementById('topCategoryBadge');
const toastContainer = document.getElementById('toastContainer');

// ============================================================
// 6. INIT (load data first, populate year dropdown)
// ============================================================
function initApp() {
    loadFromLocalStorage();
    populateYearFilter();
    const now = new Date();
    const currentYear = now.getFullYear();
    yearFilter.value = currentYear;
    monthFilter.value = 'all';
    updatePeriodLabel();
    renderAll();

    form.addEventListener('submit', handleFormSubmit);
    yearFilter.addEventListener('change', () => {
        updatePeriodLabel();
        renderAll();
    });
    monthFilter.addEventListener('change', () => {
        updatePeriodLabel();
        renderAll();
    });
    darkToggle.addEventListener('click', toggleDarkMode);
    document.getElementById('addQuickBtn').addEventListener('click', () => {
        document.querySelector('.form-box').scrollIntoView({ behavior: 'smooth' });
        descInput.focus();
    });

    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark');
        darkToggle.innerHTML = '<i class="fas fa-sun"></i> Light';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const hasUser = loadUserProfile();
    if (hasUser) {
        showLoginPage(false);
        initApp();
        updateUIWithUser();
        const savedSidebarState = localStorage.getItem('sidebarOpen');
        const isDesktop = window.innerWidth >= 901;
        let defaultOpen = isDesktop;
        if (savedSidebarState !== null) defaultOpen = savedSidebarState === 'true';
        toggleSidebar(defaultOpen);
    } else {
        showLoginPage(true);
        document.getElementById('loginName').value = '';
        document.getElementById('loginBalance').value = '';
        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark');
        }
    }
});

// ============================================================
// 7. TOAST
// ============================================================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(40px)';
        toast.style.transition = '0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================================
// 8. LOCAL STORAGE (Data)
// ============================================================
function saveToLocalStorage() {
    localStorage.setItem('financeData', JSON.stringify(transactions));
}

function loadFromLocalStorage() {
    const stored = localStorage.getItem('financeData');
    if (stored) {
        transactions = JSON.parse(stored);
        return;
    }
    transactions = [];
    saveToLocalStorage();
}

// ============================================================
// 9. HELPERS
// ============================================================
function populateYearFilter() {
    const currentYear = new Date().getFullYear();
    let earliestYear = currentYear;
    transactions.forEach(tx => {
        if (!tx.date) return;
        const y = parseInt(tx.date.slice(0, 4));
        if (y < earliestYear) earliestYear = y;
    });
    if (earliestYear > currentYear) earliestYear = currentYear;

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

function updatePeriodLabel() {
    const year = yearFilter.value;
    const month = monthFilter.value;
    const monthNames = ['January','February','March','April','May','June',
                        'July','August','September','October','November','December'];
    let label = '';
    if (year === 'all') {
        label = 'All Time';
    } else if (month !== 'all') {
        label = monthNames[parseInt(month)-1] + ' ' + year;
    } else {
        label = 'Full Year ' + year;
    }
    currentMonthDisplay.textContent = label + ' Overview';
    listMonthLabel.textContent = 'Showing ' + label;
}

function formatCurrency(amount) {
    const symbol = userProfile.symbol || 'Rs';
    return symbol + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function getFilteredTransactions() {
    const year = yearFilter.value;
    const month = monthFilter.value;
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

// ============================================================
// 10. RENDER ALL
// ============================================================
function renderAll() {
    const filtered = getFilteredTransactions();

    let totalIncome = 0, totalExpense = 0;
    filtered.forEach(tx => {
        if (tx.type === 'income') totalIncome += tx.amount;
        else totalExpense += tx.amount;
    });
    const balance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;

    incomeDisplay.textContent = formatCurrency(totalIncome);
    expenseDisplay.textContent = formatCurrency(totalExpense);
    balanceDisplay.textContent = formatCurrency(balance);
    savingsDisplay.textContent = savingsRate.toFixed(0) + '%';

    txCountBadge.innerHTML = `<i class="fas fa-list"></i> ${filtered.length} Transactions`;
    const expenses = filtered.filter(tx => tx.type === 'expense');
    const catMap = {};
    expenses.forEach(tx => { catMap[tx.category] = (catMap[tx.category] || 0) + tx.amount; });
    let topCat = 'None';
    let topVal = 0;
    for (const [cat, val] of Object.entries(catMap)) {
        if (val > topVal) { topVal = val; topCat = cat; }
    }
    topCategoryBadge.innerHTML = topCat !== 'None' ? `<i class="fas fa-tag"></i> Top: ${topCat}` : '<i class="fas fa-tag"></i> Top: None';

    renderChart(filtered);
    renderTransactionList(filtered);
}

// ============================================================
// 11. CHART
// ============================================================
function renderChart(filtered) {
    const expenses = filtered.filter(tx => tx.type === 'expense');
    const catMap = {};
    expenses.forEach(tx => { catMap[tx.category] = (catMap[tx.category] || 0) + tx.amount; });

    const labels = Object.keys(catMap);
    const dataValues = Object.values(catMap);

    if (labels.length === 0) {
        chartEmptyMsg.style.display = 'block';
        if (myChart) { myChart.destroy(); myChart = null; }
        return;
    }
    chartEmptyMsg.style.display = 'none';

    const palette = ['#7c3aed', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];
    const colors = labels.map((_, i) => palette[i % palette.length]);

    if (myChart) { myChart.destroy(); myChart = null; }

    const ctx = chartCanvas.getContext('2d');
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: colors,
                borderColor: getComputedStyle(document.body).getPropertyValue('--bg-card').trim() || '#ffffff',
                borderWidth: 3,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: getComputedStyle(document.body).getPropertyValue('--text-secondary').trim() || '#64748b',
                        font: { size: 11, weight: '500' },
                        padding: 12,
                        usePointStyle: true,
                        pointStyle: 'circle',
                    }
                }
            }
        }
    });
}

// ============================================================
// 12. TRANSACTION LIST
// ============================================================
function renderTransactionList(filtered) {
    if (filtered.length === 0) {
        transactionList.innerHTML = `<p class="empty-msg">No transactions for this period. Add one above!</p>`;
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
    transactionList.innerHTML = html;
}

function escapeHTML(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}

// ============================================================
// 13. CRUD
// ============================================================
function handleFormSubmit(e) {
    e.preventDefault();

    const description = descInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categorySelect.value;
    let type = 'expense';
    typeRadios.forEach(r => { if (r.checked) type = r.value; });

    if (!description) return showToast('Please enter a description.', 'error');
    if (isNaN(amount) || amount <= 0) return showToast('Please enter a valid positive amount.', 'error');

    const today = new Date().toISOString().slice(0, 10);

    if (editingId !== null) {
        const index = transactions.findIndex(tx => tx.id === editingId);
        if (index !== -1) {
            transactions[index] = { 
                ...transactions[index], 
                description, 
                amount, 
                category, 
                type
            };
            showToast('✅ Transaction updated!', 'success');
        }
        editingId = null;
        submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Transaction';
        formTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Add Transaction';
    } else {
        const newTx = { 
            id: Date.now(), 
            description, 
            amount, 
            category, 
            type, 
            date: today
        };
        transactions.push(newTx);
        showToast('🎉 Transaction added!', 'success');
    }

    saveToLocalStorage();
    form.reset();
    document.querySelector('input[name="type"][value="income"]').checked = true;
    populateYearFilter();
    renderAll();
}

function deleteTransaction(id) {
    if (!confirm('Permanently delete this transaction?')) return;
    transactions = transactions.filter(tx => tx.id !== id);
    saveToLocalStorage();
    populateYearFilter();
    renderAll();
    showToast('🗑️ Transaction deleted.', 'info');
}

function editTransaction(id) {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    descInput.value = tx.description;
    amountInput.value = tx.amount;
    categorySelect.value = tx.category;
    typeRadios.forEach(r => { r.checked = (r.value === tx.type); });

    editingId = tx.id;
    submitBtn.innerHTML = '<i class="fas fa-pen"></i> Update Transaction';
    formTitle.innerHTML = '<i class="fas fa-pen"></i> Edit Transaction';
    document.querySelector('.form-box').scrollIntoView({ behavior: 'smooth' });
    descInput.focus();
}

// ============================================================
// 14. DARK MODE
// ============================================================
function toggleDarkMode() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    darkToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i> Light' : '<i class="fas fa-moon"></i> Dark';
    localStorage.setItem('darkMode', isDark);
    renderAll();
}
