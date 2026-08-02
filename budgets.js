// ============================================================
// 0. USER PROFILE MANAGEMENT (shared with other pages)
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
        return true;
    }
    return false;
}

function updateUIWithUser() {
    document.getElementById('sidebarUserName').textContent = userProfile.name;
    const initials = userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    document.getElementById('userAvatar').textContent = initials;
    document.getElementById('headerCurrencyDisplay').textContent = userProfile.currency;
}

function formatCurrency(amount) {
    const symbol = userProfile.symbol || 'Rs';
    return symbol + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ============================================================
// 1. SIDEBAR LOGIC (identical to other pages)
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
// 2. SETTINGS MODAL (same as index.js)
// ============================================================
const settingsModal = document.getElementById('settingsModal');
const settingsNavTrigger = document.getElementById('settingsNavTrigger');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
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

// ============================================================
// 3. TOAST SYSTEM
// ============================================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(40px)';
        toast.style.transition = '0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================================
// 4. DARK MODE
// ============================================================
const darkToggle = document.getElementById('darkModeToggle');
function toggleDarkMode() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    darkToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i> Light' : '<i class="fas fa-moon"></i> Dark';
    localStorage.setItem('darkMode', isDark);
}

// ============================================================
// 5. DATA: TRANSACTIONS & BUDGETS
// ============================================================
function loadTransactions() {
    const stored = localStorage.getItem('financeData');
    return stored ? JSON.parse(stored) : [];
}

function loadBudgets() {
    const stored = localStorage.getItem('budgets');
    return stored ? JSON.parse(stored) : [];
}

function saveBudgets(budgets) {
    localStorage.setItem('budgets', JSON.stringify(budgets));
}

// ============================================================
// 6. FILTER LOGIC (Year + Month, with "All" options)
// ============================================================
function getFilteredTransactions(transactions, year, month) {
    return transactions.filter(tx => {
        if (!tx.date) return false;
        if (year !== 'all' && tx.date.slice(0, 4) !== year) return false;
        if (month !== 'all' && tx.date.slice(5, 7) !== month) return false;
        return true;
    });
}

function getFilteredBudgets(budgets, year, month) {
    return budgets.filter(b => {
        if (year !== 'all' && b.month.slice(0, 4) !== year) return false;
        if (month !== 'all' && b.month.slice(5, 7) !== month) return false;
        return true;
    });
}

function getAvailableYears(transactions, budgets) {
    const years = new Set();
    transactions.forEach(tx => {
        if (tx.date) years.add(tx.date.substring(0, 4));
    });
    budgets.forEach(b => {
        if (b.month) years.add(b.month.substring(0, 4));
    });
    return Array.from(years).sort();
}

function populateYearFilter(years) {
    const select = document.getElementById('yearFilter');
    const currentYear = new Date().getFullYear().toString();
    select.innerHTML = '';
    
    const allOpt = document.createElement('option');
    allOpt.value = 'all';
    allOpt.textContent = 'All Years';
    select.appendChild(allOpt);
    
    if (years.length === 0) years = [currentYear];
    years.sort((a, b) => b - a);
    years.forEach(year => {
        const opt = document.createElement('option');
        opt.value = year;
        opt.textContent = year;
        if (year === currentYear) opt.selected = true;
        select.appendChild(opt);
    });
}

// ============================================================
// 7. RENDER ALL (UPDATED – shows dashboard data even without budgets)
// ============================================================
function renderAll() {
    const transactions = loadTransactions();
    const budgets = loadBudgets();
    const allYears = getAvailableYears(transactions, budgets);
    populateYearFilter(allYears);

    const selectedYear = document.getElementById('yearFilter').value;
    const selectedMonth = document.getElementById('monthFilter').value;
    
    // Get filtered transactions for summary cards
    const filteredTxs = getFilteredTransactions(transactions, selectedYear, selectedMonth);
    const filteredBudgets = getFilteredBudgets(budgets, selectedYear, selectedMonth);

    updatePeriodLabel(selectedYear, selectedMonth);
    updateSummaryCards(filteredTxs, filteredBudgets);
    renderBudgetList(filteredBudgets, filteredTxs);
    updateBadges(filteredBudgets);
}

function updatePeriodLabel(year, month) {
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
    document.getElementById('currentPeriodDisplay').textContent = label + ' Overview';
    document.getElementById('listPeriodLabel').textContent = 'For ' + label;
}

// 🔥 UPDATED: Shows dashboard data even without budgets
function updateSummaryCards(filteredTransactions, filteredBudgets) {
    // Calculate income and expenses from transactions
    let totalIncome = 0, totalExpense = 0;
    filteredTransactions.forEach(tx => {
        if (tx.type === 'income') totalIncome += tx.amount;
        else totalExpense += tx.amount;
    });
    const balance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;

    // If budgets exist, show budget data; otherwise show transaction data
    if (filteredBudgets.length > 0) {
        // Show budget-specific data
        let totalBudget = 0;
        let totalSpent = 0;
        filteredBudgets.forEach(b => {
            totalBudget += b.amount;
            const spent = filteredTransactions
                .filter(tx => tx.type === 'expense' && tx.category === b.category && tx.date && tx.date.startsWith(b.month))
                .reduce((sum, tx) => sum + tx.amount, 0);
            totalSpent += spent;
        });
        const usage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

        document.getElementById('totalBudgetDisplay').textContent = formatCurrency(totalBudget);
        document.getElementById('totalSpentDisplay').textContent = formatCurrency(totalSpent);
        document.getElementById('overallUsageDisplay').textContent = usage.toFixed(0) + '%';
    } else {
        // 🔥 NO BUDGETS SET – show dashboard data instead
        document.getElementById('totalBudgetDisplay').textContent = formatCurrency(totalIncome);
        document.getElementById('totalSpentDisplay').textContent = formatCurrency(totalExpense);
        document.getElementById('overallUsageDisplay').textContent = savingsRate.toFixed(0) + '%';
    }
}

function updateBadges(filteredBudgets) {
    document.getElementById('budgetCountBadge').innerHTML = `<i class="fas fa-list"></i> ${filteredBudgets.length} Budgets`;
    const transactions = loadTransactions();
    let overCount = 0;
    filteredBudgets.forEach(b => {
        const spent = transactions
            .filter(tx => tx.type === 'expense' && tx.category === b.category && tx.date && tx.date.startsWith(b.month))
            .reduce((sum, tx) => sum + tx.amount, 0);
        if (spent > b.amount) overCount++;
    });
    document.getElementById('overBudgetBadge').innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${overCount} Over Budget`;
}

// ============================================================
// 8. RENDER BUDGET LIST
// ============================================================
function renderBudgetList(filteredBudgets, filteredTransactions) {
    const container = document.getElementById('budgetList');
    if (filteredBudgets.length === 0) {
        container.innerHTML = `
            <div class="empty-budgets">
                <i class="fas fa-wallet"></i>
                <h3>No budgets set</h3>
                <p>Set a budget for a category to track your spending limits.</p>
                <button class="btn btn-primary mt-4" id="emptyAddBtn"><i class="fas fa-plus"></i> Create Budget</button>
            </div>
        `;
        document.getElementById('emptyAddBtn')?.addEventListener('click', () => openBudgetModal());
        return;
    }

    let html = '';
    filteredBudgets.forEach(b => {
        const spent = filteredTransactions
            .filter(tx => tx.type === 'expense' && tx.category === b.category && tx.date && tx.date.startsWith(b.month))
            .reduce((sum, tx) => sum + tx.amount, 0);
        const remaining = b.amount - spent;
        const percent = b.amount > 0 ? (spent / b.amount) * 100 : 0;

        let statusClass = '';
        let progressClass = 'safe';
        let remainingText = '';
        if (spent > b.amount) {
            statusClass = 'over';
            progressClass = 'danger';
            remainingText = `⚠️ Over by ${formatCurrency(Math.abs(remaining))}`;
        } else if (spent === b.amount) {
            statusClass = 'exact';
            progressClass = 'warning';
            remainingText = 'Exactly at limit';
        } else {
            statusClass = 'under';
            progressClass = 'safe';
            remainingText = `${formatCurrency(remaining)} remaining`;
        }

        const spentClass = spent > b.amount ? 'over' : (spent === b.amount ? 'exact' : 'under');

        html += `
            <div class="budget-item" data-category="${b.category}" data-month="${b.month}">
                <div class="budget-header">
                    <div class="budget-category">
                        <i class="fas fa-tag"></i> ${b.category}
                    </div>
                    <div class="budget-numbers">
                        <span class="budget-limit">Limit: ${formatCurrency(b.amount)}</span>
                        <span class="budget-spent ${spentClass}">Spent: ${formatCurrency(spent)}</span>
                        <span class="budget-remaining ${statusClass}">${remainingText}</span>
                    </div>
                </div>
                <div class="budget-progress">
                    <div class="progress-fill ${progressClass}" style="width: ${Math.min(percent, 100)}%;"></div>
                </div>
                <div class="flex justify-between items-center mt-2">
                    <span class="text-xs text-gray-500 dark:text-gray-400">${percent.toFixed(0)}% used</span>
                    <div class="budget-actions">
                        <button class="edit-budget-btn" data-category="${b.category}" data-month="${b.month}"><i class="fas fa-pen"></i> Edit</button>
                        <button class="delete-budget-btn" data-category="${b.category}" data-month="${b.month}"><i class="fas fa-trash"></i> Delete</button>
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;

    container.querySelectorAll('.edit-budget-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            const month = btn.dataset.month;
            const budget = filteredBudgets.find(b => b.category === category && b.month === month);
            if (budget) openBudgetModal(budget);
        });
    });
    container.querySelectorAll('.delete-budget-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            const month = btn.dataset.month;
            if (confirm(`Delete budget for "${category}" in ${month}?`)) {
                let budgets = loadBudgets();
                budgets = budgets.filter(b => !(b.category === category && b.month === month));
                saveBudgets(budgets);
                renderAll();
                showToast('Budget deleted.', 'info');
            }
        });
    });
}

// ============================================================
// 9. BUDGET MODAL (Add / Edit)
// ============================================================
let editingBudget = null;

function openBudgetModal(budget = null) {
    const modal = document.getElementById('budgetModal');
    const title = document.getElementById('budgetModalTitle');
    const categoryInput = document.getElementById('budgetCategory');
    const monthInput = document.getElementById('budgetMonth');
    const amountInput = document.getElementById('budgetAmount');
    const saveBtn = document.getElementById('saveBudgetBtn');

    if (budget) {
        editingBudget = budget;
        title.innerHTML = '<i class="fas fa-pen text-purple-600"></i> Edit Budget';
        categoryInput.value = budget.category;
        monthInput.value = budget.month;
        amountInput.value = budget.amount;
        saveBtn.textContent = 'Update Budget';
    } else {
        editingBudget = null;
        title.innerHTML = '<i class="fas fa-plus-circle text-purple-600"></i> Set Budget';
        const year = document.getElementById('yearFilter').value;
        const month = document.getElementById('monthFilter').value;
        let defaultMonth = new Date().toISOString().slice(0, 7);
        if (year !== 'all' && month !== 'all') {
            defaultMonth = year + '-' + month;
        } else if (year !== 'all') {
            defaultMonth = year + '-01';
        }
        monthInput.value = defaultMonth;
        categoryInput.value = 'Food & Dining';
        amountInput.value = '';
        saveBtn.textContent = 'Save Budget';
    }
    modal.classList.add('active');
}

function closeBudgetModal() {
    document.getElementById('budgetModal').classList.remove('active');
    editingBudget = null;
}

document.getElementById('addBudgetBtn').addEventListener('click', () => openBudgetModal());
document.getElementById('closeBudgetBtn').addEventListener('click', closeBudgetModal);
document.getElementById('budgetModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeBudgetModal();
});

document.getElementById('saveBudgetBtn').addEventListener('click', () => {
    const category = document.getElementById('budgetCategory').value;
    const month = document.getElementById('budgetMonth').value;
    const amount = parseFloat(document.getElementById('budgetAmount').value);

    if (!month) {
        showToast('Please select a month.', 'error');
        return;
    }
    if (!amount || amount <= 0) {
        showToast('Please enter a valid positive amount.', 'error');
        return;
    }

    let budgets = loadBudgets();

    if (editingBudget) {
        budgets = budgets.filter(b => !(b.category === editingBudget.category && b.month === editingBudget.month));
    }

    const exists = budgets.some(b => b.category === category && b.month === month);
    if (exists) {
        showToast(`A budget for "${category}" in ${month} already exists.`, 'error');
        return;
    }

    budgets.push({ category, month, amount });
    saveBudgets(budgets);
    closeBudgetModal();
    renderAll();
    showToast('✅ Budget saved!', 'success');
});

// ============================================================
// 10. AUTO-REFRESH WHEN DATA CHANGES
// ============================================================
window.addEventListener('storage', (e) => {
    if (e.key === 'financeData' || e.key === 'budgets' || e.key === 'userProfile' || e.key === 'darkMode') {
        console.log('🔄 Data changed in another tab – refreshing Budgets...');
        renderAll();
        updateUIWithUser();
    }
});

document.addEventListener('transactionsUpdated', () => {
    console.log('🔄 Transactions updated – refreshing Budgets...');
    renderAll();
});

// ============================================================
// 11. INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    const hasUser = loadUserProfile();
    if (!hasUser) {
        window.location.href = 'index.html';
        return;
    }

    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark');
        darkToggle.innerHTML = '<i class="fas fa-sun"></i> Light';
    }
    darkToggle.addEventListener('click', toggleDarkMode);

    document.getElementById('monthFilter').value = 'all';
    renderAll();

    document.getElementById('yearFilter').addEventListener('change', renderAll);
    document.getElementById('monthFilter').addEventListener('change', renderAll);

    const savedSidebarState = localStorage.getItem('sidebarOpen');
    const isDesktop = window.innerWidth >= 901;
    let defaultOpen = isDesktop;
    if (savedSidebarState !== null) defaultOpen = savedSidebarState === 'true';
    toggleSidebar(defaultOpen);

    updateUIWithUser();
});
