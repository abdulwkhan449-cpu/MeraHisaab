// ============================================================
// 0. USER PROFILE & GLOBAL STATE
// ============================================================
let userProfile = { name: 'Guest', currency: 'PKR', symbol: 'Rs' };
let monthlyChart = null;
let categoryChart = null;

const CURRENCY_SYMBOLS = { PKR: 'Rs', USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥' };

// ============================================================
// 1. LOAD USER PROFILE (same as index.js)
// ============================================================
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
// 2. SIDEBAR LOGIC (identical to index.js)
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
// 3. SETTINGS MODAL (same as index.js)
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
// 4. TOAST SYSTEM
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
// 5. DARK MODE
// ============================================================
const darkToggle = document.getElementById('darkModeToggle');
function toggleDarkMode() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    darkToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i> Light' : '<i class="fas fa-moon"></i> Dark';
    localStorage.setItem('darkMode', isDark);
    renderAll();
}

// ============================================================
// 6. LOAD TRANSACTIONS (SHARED WITH DASHBOARD)
// ============================================================
function loadTransactions() {
    const stored = localStorage.getItem('financeData');
    if (stored) {
        return JSON.parse(stored);
    }
    return [];
}

// ============================================================
// 7. FILTER LOGIC (Year + Month, with "All" options)
// ============================================================
function getFilteredTransactions(transactions, year, month) {
    return transactions.filter(tx => {
        if (!tx.date) return false;
        // Year filter
        if (year !== 'all') {
            const txYear = tx.date.slice(0, 4);
            if (txYear !== year) return false;
        }
        // Month filter
        if (month !== 'all') {
            const txMonth = tx.date.slice(5, 7);
            if (txMonth !== month) return false;
        }
        return true;
    });
}

function getAvailableYears(transactions) {
    const years = new Set();
    transactions.forEach(tx => {
        if (tx.date) {
            const year = tx.date.substring(0, 4);
            years.add(year);
        }
    });
    return Array.from(years).sort();
}

function populateYearFilter(years) {
    const select = document.getElementById('yearFilter');
    const currentYear = new Date().getFullYear().toString();
    select.innerHTML = '';
    
    // Add "All Years" option
    const allOpt = document.createElement('option');
    allOpt.value = 'all';
    allOpt.textContent = 'All Years';
    select.appendChild(allOpt);
    
    if (years.length === 0) {
        years = [currentYear];
    }
    
    years.sort((a, b) => b - a); // newest first
    
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === currentYear) {
            option.selected = true;
        }
        select.appendChild(option);
    });
}

// ============================================================
// 8. RENDER ALL (Main function)
// ============================================================
function renderAll() {
    const transactions = loadTransactions();
    const years = getAvailableYears(transactions);
    populateYearFilter(years);
    
    const selectedYear = document.getElementById('yearFilter').value;
    const selectedMonth = document.getElementById('monthFilter').value;
    const filtered = getFilteredTransactions(transactions, selectedYear, selectedMonth);
    
    updateSummaryCards(filtered);
    renderMonthlyChart(filtered);
    renderCategoryChart(filtered);
    renderTopSpending(filtered);
    updateUIWithUser();
    updateCountBadge(filtered.length);
    updatePeriodDisplay(selectedYear, selectedMonth);
}

function updatePeriodDisplay(year, month) {
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
}

function updateCountBadge(count) {
    document.getElementById('txCountBadge').innerHTML = `<i class="fas fa-list"></i> ${count} Transactions`;
}

// ============================================================
// 9. SUMMARY CARDS
// ============================================================
function updateSummaryCards(transactions) {
    let totalIncome = 0, totalExpense = 0;
    transactions.forEach(tx => {
        if (tx.type === 'income') totalIncome += tx.amount;
        else totalExpense += tx.amount;
    });
    const net = totalIncome - totalExpense;
    
    document.getElementById('totalIncomeDisplay').textContent = formatCurrency(totalIncome);
    document.getElementById('totalExpenseDisplay').textContent = formatCurrency(totalExpense);
    document.getElementById('netSavingsDisplay').textContent = formatCurrency(net);
    
    const statusEl = document.getElementById('netStatus');
    if (net >= 0) {
        statusEl.innerHTML = `<i class="fas fa-arrow-up text-green-500"></i> ${formatCurrency(net)} saved`;
        statusEl.style.color = 'var(--accent-green)';
    } else {
        statusEl.innerHTML = `<i class="fas fa-arrow-down text-red-500"></i> ${formatCurrency(Math.abs(net))} deficit`;
        statusEl.style.color = 'var(--accent-red)';
    }
}

// ============================================================
// 10. MONTHLY CHART (Bar Chart)
// ============================================================
function renderMonthlyChart(transactions) {
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    
    if (monthlyChart) {
        monthlyChart.destroy();
        monthlyChart = null;
    }
    
    if (transactions.length === 0) {
        monthlyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['No Data'],
                datasets: [
                    { label: 'Income', data: [0], backgroundColor: '#10b981' },
                    { label: 'Expenses', data: [0], backgroundColor: '#ef4444' }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'top', labels: { color: getComputedStyle(document.body).getPropertyValue('--text-secondary').trim() || '#64748b' } }
                }
            }
        });
        return;
    }
    
    // Group by month
    const monthMap = {};
    transactions.forEach(tx => {
        const month = tx.date.substring(0, 7);
        if (!monthMap[month]) {
            monthMap[month] = { income: 0, expense: 0 };
        }
        if (tx.type === 'income') {
            monthMap[month].income += tx.amount;
        } else {
            monthMap[month].expense += tx.amount;
        }
    });
    
    const sortedMonths = Object.keys(monthMap).sort();
    const monthLabels = sortedMonths.map(m => {
        const [year, month] = m.split('-');
        return new Date(year, month - 1).toLocaleString('default', { month: 'short' }) + ` '${year.slice(2)}`;
    });
    const incomeData = sortedMonths.map(m => monthMap[m].income);
    const expenseData = sortedMonths.map(m => monthMap[m].expense);
    
    const textColor = getComputedStyle(document.body).getPropertyValue('--text-secondary').trim() || '#64748b';
    
    monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthLabels,
            datasets: [
                {
                    label: 'Income',
                    data: incomeData,
                    backgroundColor: '#10b981',
                    borderRadius: 6,
                },
                {
                    label: 'Expenses',
                    data: expenseData,
                    backgroundColor: '#ef4444',
                    borderRadius: 6,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: textColor, font: { weight: '600' } }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: textColor }
                },
                x: {
                    ticks: { color: textColor }
                }
            }
        }
    });
}

// ============================================================
// 11. CATEGORY CHART (Doughnut)
// ============================================================
function renderCategoryChart(transactions) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    const emptyMsg = document.getElementById('chartEmptyMsg');
    
    if (categoryChart) {
        categoryChart.destroy();
        categoryChart = null;
    }
    
    const expenses = transactions.filter(tx => tx.type === 'expense');
    if (expenses.length === 0) {
        emptyMsg.style.display = 'block';
        categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['No Expenses'],
                datasets: [{ data: [1], backgroundColor: '#e2e8f0' }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '60%',
                plugins: {
                    legend: { position: 'bottom', labels: { color: getComputedStyle(document.body).getPropertyValue('--text-secondary').trim() || '#64748b' } }
                }
            }
        });
        return;
    }
    emptyMsg.style.display = 'none';
    
    const catMap = {};
    expenses.forEach(tx => {
        catMap[tx.category] = (catMap[tx.category] || 0) + tx.amount;
    });
    
    const labels = Object.keys(catMap);
    const dataValues = Object.values(catMap);
    const palette = ['#7c3aed', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];
    const colors = labels.map((_, i) => palette[i % palette.length]);
    
    const textColor = getComputedStyle(document.body).getPropertyValue('--text-secondary').trim() || '#64748b';
    
    categoryChart = new Chart(ctx, {
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
                        color: textColor,
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
// 12. TOP SPENDING LIST
// ============================================================
function renderTopSpending(transactions) {
    const container = document.getElementById('topSpendingList');
    const expenses = transactions.filter(tx => tx.type === 'expense');
    
    if (expenses.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-500 dark:text-gray-400 py-8">
                <i class="fas fa-coffee text-4xl mb-2 block"></i>
                No expenses this period. Enjoy your savings!
            </div>
        `;
        return;
    }
    
    const catMap = {};
    expenses.forEach(tx => {
        catMap[tx.category] = (catMap[tx.category] || 0) + tx.amount;
    });
    
    const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    const total = sorted.reduce((sum, [, amount]) => sum + amount, 0);
    
    let html = '';
    sorted.forEach(([category, amount], index) => {
        const percentage = (amount / total) * 100;
        const barColor = ['#7c3aed', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'][index % 8];
        
        html += `
            <div class="spending-item">
                <div style="flex: 1;">
                    <div class="flex justify-between items-center">
                        <span class="category-name"><i class="fas fa-circle text-[10px]" style="color: ${barColor};"></i> ${category}</span>
                        <span class="category-amount">${formatCurrency(amount)}</span>
                    </div>
                    <div class="category-bar" style="width: ${percentage}%; background: ${barColor};"></div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ============================================================
// 13. AUTO-REFRESH WHEN DATA CHANGES (Integration with Dashboard)
// ============================================================
window.addEventListener('storage', (e) => {
    if (e.key === 'financeData' || e.key === 'userProfile' || e.key === 'darkMode') {
        console.log('🔄 Data changed in another tab – refreshing Reports...');
        renderAll();
        updateUIWithUser();
    }
});

document.addEventListener('transactionsUpdated', () => {
    console.log('🔄 Transactions updated – refreshing Reports...');
    renderAll();
});

// ============================================================
// 14. INITIALIZATION
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
    
    // Set default month to "All"
    document.getElementById('monthFilter').value = 'all';
    
    // Initial render
    renderAll();
    
    // Event listeners for filter changes
    document.getElementById('yearFilter').addEventListener('change', renderAll);
    document.getElementById('monthFilter').addEventListener('change', renderAll);
    
    // Restore sidebar state
    const savedSidebarState = localStorage.getItem('sidebarOpen');
    const isDesktop = window.innerWidth >= 901;
    let defaultOpen = isDesktop;
    if (savedSidebarState !== null) defaultOpen = savedSidebarState === 'true';
    toggleSidebar(defaultOpen);
    
    updateUIWithUser();
});
