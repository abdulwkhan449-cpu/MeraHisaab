// ============================================================
// 0. USER PROFILE & GLOBAL STATE
// ============================================================
let userProfile = { name: 'Guest', currency: 'PKR', symbol: 'Rs' };
const CURRENCY_SYMBOLS = { PKR: 'Rs', USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥' };

// ============================================================
// 1. LOAD USER PROFILE
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
    const nameEl = document.getElementById('sidebarUserName');
    const avatarEl = document.getElementById('userAvatar');
    const headerCurrency = document.getElementById('headerCurrencyDisplay');
    const profileName = document.getElementById('settingsProfileName');
    const profileCurrency = document.getElementById('settingsProfileCurrency');

    if (nameEl) nameEl.textContent = userProfile.name;
    if (avatarEl) {
        const initials = userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        avatarEl.textContent = initials || 'G';
    }
    if (headerCurrency) headerCurrency.textContent = userProfile.currency;
    if (profileName) profileName.value = userProfile.name;
    if (profileCurrency) profileCurrency.value = userProfile.currency;
}

function formatCurrency(amount) {
    const symbol = userProfile.symbol || 'Rs';
    return symbol + ' ' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ============================================================
// 2. SIDEBAR LOGIC
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

    // ⬇️ NEW: Sync the toggle switch UI
    if (sidebarVisibilitySwitch) {
        sidebarVisibilitySwitch.checked = isOpen;
    }
}

// ============================================================
// SIDEBAR VISIBILITY TOGGLE (Settings Page Control)
// ============================================================
const sidebarVisibilitySwitch = document.getElementById('sidebarVisibilitySwitch');

if (sidebarVisibilitySwitch) {
    // When the toggle changes, update the sidebar
    sidebarVisibilitySwitch.addEventListener('change', (e) => {
        toggleSidebar(e.target.checked);
    });
}

// ============================================================
// 3. DARK MODE (Improved with debugging)
// ============================================================
const darkToggle = document.getElementById('darkModeToggle');
const darkModeSwitch = document.getElementById('darkModeSwitch');

// Function to apply dark mode state
function applyDarkMode(isDark) {
    if (isDark) {
        document.body.classList.add('dark');
        if (darkToggle) darkToggle.innerHTML = '<i class="fas fa-sun"></i> Light';
        if (darkModeSwitch) darkModeSwitch.checked = true;
    } else {
        document.body.classList.remove('dark');
        if (darkToggle) darkToggle.innerHTML = '<i class="fas fa-moon"></i> Dark';
        if (darkModeSwitch) darkModeSwitch.checked = false;
    }
    localStorage.setItem('darkMode', isDark);
    console.log('Dark mode set to:', isDark); // for debugging
}

// Toggle function
function toggleDarkMode() {
    const isDark = !document.body.classList.contains('dark');
    applyDarkMode(isDark);
    window.dispatchEvent(new Event('storage'));
}

// Attach events if elements exist
if (darkToggle) {
    darkToggle.addEventListener('click', toggleDarkMode);
    console.log('Dark toggle button found');
} else {
    console.warn('Dark toggle button not found!');
}

if (darkModeSwitch) {
    darkModeSwitch.addEventListener('change', (e) => {
        const isDark = e.target.checked;
        applyDarkMode(isDark);
        window.dispatchEvent(new Event('storage'));
    });
    console.log('Dark mode switch found');
} else {
    console.warn('Dark mode switch not found!');
}

// Apply saved dark mode on page load (called during init)
function loadDarkMode() {
    const saved = localStorage.getItem('darkMode');
    const isDark = saved === 'true';
    applyDarkMode(isDark);
}


// ============================================================
// 4. TOAST SYSTEM
// ============================================================
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
        toast.style.transition = '0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================================
// 5. CONFIRMATION MODAL (Reusable)
// ============================================================
const confirmationModal = document.getElementById('confirmationModal');
const confirmTitle = document.getElementById('confirmationTitle');
const confirmMessage = document.getElementById('confirmationMessage');
const confirmYesBtn = document.getElementById('confirmYesBtn');
const confirmNoBtn = document.getElementById('confirmNoBtn');

let confirmCallback = null;

function showConfirmation(title, message, onYes) {
    if (confirmTitle) confirmTitle.textContent = title;
    if (confirmMessage) confirmMessage.textContent = message;
    confirmCallback = onYes || null;
    if (confirmationModal) confirmationModal.classList.add('active');
}

function closeConfirmation() {
    if (confirmationModal) confirmationModal.classList.remove('active');
    confirmCallback = null;
}

if (confirmYesBtn) {
    confirmYesBtn.addEventListener('click', () => {
        if (typeof confirmCallback === 'function') {
            confirmCallback();
        }
        closeConfirmation();
    });
}

if (confirmNoBtn) {
    confirmNoBtn.addEventListener('click', closeConfirmation);
}

if (confirmationModal) {
    confirmationModal.addEventListener('click', (e) => {
        if (e.target === confirmationModal) closeConfirmation();
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && confirmationModal && confirmationModal.classList.contains('active')) {
        closeConfirmation();
    }
});

// ============================================================
// 6. SAVE PROFILE
// ============================================================
const saveProfileBtn = document.getElementById('saveProfileBtn');
if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', () => {
        const name = document.getElementById('settingsProfileName').value.trim();
        const currency = document.getElementById('settingsProfileCurrency').value;

        if (!name) {
            showToast('Please enter your name.', 'error');
            return;
        }

        userProfile.name = name;
        userProfile.currency = currency;
        userProfile.symbol = CURRENCY_SYMBOLS[currency] || 'Rs';
        localStorage.setItem('userProfile', JSON.stringify(userProfile));

        updateUIWithUser();
        window.dispatchEvent(new Event('storage'));

        showToast('✅ Profile updated successfully!', 'success');
    });
}

// ============================================================
// 7. EXPORT DATA
// ============================================================
const exportBtn = document.getElementById('exportDataBtn');
if (exportBtn) {
    exportBtn.addEventListener('click', () => {
        const stored = localStorage.getItem('financeData');
        if (!stored) {
            showToast('No data to export.', 'error');
            return;
        }

        const transactions = JSON.parse(stored);
        if (transactions.length === 0) {
            showToast('No transactions to export.', 'error');
            return;
        }

        const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
        const rows = transactions.map(tx => [
            tx.date || '',
            `"${(tx.description || '').replace(/"/g, '""')}"`,
            `"${(tx.category || 'Other').replace(/"/g, '""')}"`,
            tx.type || 'expense',
            tx.amount || 0
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `merahisaab_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast(`✅ Exported ${transactions.length} transactions!`, 'success');
    });
}

// ============================================================
// 8. IMPORT DATA
// ============================================================
const importBtn = document.getElementById('importDataBtn');
const fileInput = document.getElementById('fileInput');

if (importBtn && fileInput) {
    importBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const csvText = event.target.result;
                const lines = csvText.split('\n').filter(line => line.trim() !== '');

                if (lines.length < 2) {
                    showToast('Invalid CSV file. No data rows found.', 'error');
                    return;
                }

                const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                const dateIdx = headers.findIndex(h => h.includes('date'));
                const descIdx = headers.findIndex(h => h.includes('desc'));
                const catIdx = headers.findIndex(h => h.includes('cat'));
                const typeIdx = headers.findIndex(h => h.includes('type'));
                const amountIdx = headers.findIndex(h => h.includes('amount'));

                if (dateIdx === -1 || descIdx === -1 || amountIdx === -1) {
                    showToast('Invalid CSV format. Required: Date, Description, Amount', 'error');
                    return;
                }

                const transactions = [];
                for (let i = 1; i < lines.length; i++) {
                    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
                    const date = cols[dateIdx] || '';
                    const description = cols[descIdx] || '';
                    const category = catIdx !== -1 ? (cols[catIdx] || 'Other') : 'Other';
                    const type = typeIdx !== -1 ? (cols[typeIdx].toLowerCase() || 'expense') : 'expense';
                    const amount = parseFloat(cols[amountIdx]) || 0;

                    if (description && amount > 0 && date) {
                        transactions.push({
                            id: Date.now() + i,
                            date: date,
                            description: description,
                            category: category,
                            type: type,
                            amount: amount
                        });
                    }
                }

                if (transactions.length === 0) {
                    showToast('No valid transactions found in the CSV file.', 'error');
                    return;
                }

                const existing = JSON.parse(localStorage.getItem('financeData') || '[]');
                const merged = [...existing, ...transactions];
                localStorage.setItem('financeData', JSON.stringify(merged));

                fileInput.value = '';
                window.dispatchEvent(new Event('storage'));

                showToast(`✅ Imported ${transactions.length} transactions successfully!`, 'success');
            } catch (err) {
                showToast('Error reading CSV file. Please check the format.', 'error');
                console.error(err);
            }
        };
        reader.readAsText(file);
    });
}

// ============================================================
// 8b. EXPORT AS PDF
// ============================================================
const exportPdfBtn = document.getElementById('exportPdfBtn');
if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', () => {
        const stored = localStorage.getItem('financeData');
        if (!stored) {
            showToast('No data to export.', 'error');
            return;
        }
        const transactions = JSON.parse(stored);
        if (transactions.length === 0) {
            showToast('No transactions to export.', 'error');
            return;
        }

        // Sort by date (newest first)
        const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

        // Prepare data rows
        const rows = sorted.map(tx => [
            tx.date || '',
            tx.description || '',
            tx.category || 'Other',
            tx.type || 'expense',
            formatCurrency(tx.amount)
        ]);

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();

        // Title
        doc.setFontSize(18);
        doc.setTextColor(40);
        doc.text('MeraHisaab - Transaction Report', pageWidth / 2, 15, { align: 'center' });
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 22, { align: 'center' });
        doc.text(`User: ${userProfile.name}`, pageWidth / 2, 28, { align: 'center' });

        // Table
        doc.autoTable({
            head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
            body: rows,
            startY: 35,
            theme: 'striped',
            headStyles: { fillColor: [124, 58, 237], textColor: 255, fontSize: 10 },
            bodyStyles: { fontSize: 9 },
            columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 60 },
                2: { cellWidth: 30 },
                3: { cellWidth: 25 },
                4: { cellWidth: 30, halign: 'right' }
            },
            margin: { left: 10, right: 10 }
        });

        // Save PDF
        doc.save(`merahisaab_transactions_${new Date().toISOString().slice(0, 10)}.pdf`);
        showToast(`✅ PDF exported successfully!`, 'success');
    });
}

// ============================================================
// 8c. EXPORT AS TEXT
// ============================================================
const exportTextBtn = document.getElementById('exportTextBtn');
if (exportTextBtn) {
    exportTextBtn.addEventListener('click', () => {
        const stored = localStorage.getItem('financeData');
        if (!stored) {
            showToast('No data to export.', 'error');
            return;
        }
        const transactions = JSON.parse(stored);
        if (transactions.length === 0) {
            showToast('No transactions to export.', 'error');
            return;
        }

        // Sort by date (newest first)
        const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

        // Build text content
        let text = '========================================\n';
        text += '  MERAHISAAB - TRANSACTION REPORT\n';
        text += '========================================\n';
        text += `  User: ${userProfile.name}\n`;
        text += `  Generated: ${new Date().toLocaleString()}\n`;
        text += `  Currency: ${userProfile.currency} (${userProfile.symbol})\n`;
        text += `  Total transactions: ${sorted.length}\n`;
        text += '========================================\n\n';
        text += 'Date       | Description              | Category         | Type    | Amount\n';
        text += '-----------+--------------------------+------------------+---------+--------\n';

        sorted.forEach(tx => {
            const date = (tx.date || '').padEnd(10);
            const desc = (tx.description || '').padEnd(24).slice(0, 24);
            const cat = (tx.category || 'Other').padEnd(16).slice(0, 16);
            const type = (tx.type || 'expense').padEnd(7).slice(0, 7);
            const amount = formatCurrency(tx.amount).padStart(8);
            text += `${date} | ${desc} | ${cat} | ${type} | ${amount}\n`;
        });

        text += '\n========================================\n';
        text += '  End of report\n';
        text += '========================================\n';

        // Create and download text file
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `merahisaab_transactions_${new Date().toISOString().slice(0, 10)}.txt`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast(`✅ Text file exported successfully!`, 'success');
    });
}

// ============================================================
// 9. CLEAR ALL DATA (with custom confirmation)
// ============================================================
const clearBtn = document.getElementById('clearDataBtn');
if (clearBtn) {
    clearBtn.addEventListener('click', () => {
        const stored = localStorage.getItem('financeData');
        if (!stored || JSON.parse(stored).length === 0) {
            showToast('No data to clear.', 'info');
            return;
        }

        showConfirmation(
            'Clear All Data?',
            'Do you want to clear all of your data? This action cannot be undone.',
            () => {
                localStorage.removeItem('financeData');
                window.dispatchEvent(new Event('storage'));
                showToast('🗑️ All data has been cleared.', 'info');
            }
        );
    });
}

// ============================================================
// 10. LOGOUT (with custom confirmation)
// ============================================================
const logoutBtn = document.getElementById('settingsLogoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        showConfirmation(
            'Logout?',
            'Do you want to log out?',
            () => {
                localStorage.removeItem('userProfile');
                window.location.href = 'index.html';
            }
        );
    });
}

// ============================================================
// 11. QUICK ADD MONEY
// ============================================================
const quickForm = document.getElementById('quickAddForm');
const quickDescription = document.getElementById('quickDescription');
const quickAmount = document.getElementById('quickAmount');
const quickCategory = document.getElementById('quickCategory');
const quickTypeRadios = document.querySelectorAll('input[name="quickType"]');
const quickAddSuccess = document.getElementById('quickAddSuccess');

if (quickForm) {
    quickForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const description = quickDescription.value.trim();
        const amount = parseFloat(quickAmount.value);
        const category = quickCategory.value;
        let type = 'income';
        quickTypeRadios.forEach(r => { if (r.checked) type = r.value; });

        if (!description) {
            showToast('Please enter a description.', 'error');
            return;
        }
        if (isNaN(amount) || amount <= 0) {
            showToast('Please enter a valid positive amount.', 'error');
            return;
        }

        const today = new Date().toISOString().slice(0, 10);
        const stored = localStorage.getItem('financeData');
        let transactions = stored ? JSON.parse(stored) : [];

        const newTx = {
            id: Date.now(),
            description: description,
            amount: amount,
            category: category,
            type: type,
            date: today
        };

        transactions.push(newTx);
        localStorage.setItem('financeData', JSON.stringify(transactions));

        quickForm.reset();
        const defaultRadio = document.querySelector('input[name="quickType"][value="income"]');
        if (defaultRadio) defaultRadio.checked = true;

        if (quickAddSuccess) {
            quickAddSuccess.style.display = 'block';
            setTimeout(() => {
                quickAddSuccess.style.display = 'none';
            }, 3000);
        }

        document.dispatchEvent(new Event('transactionsUpdated'));
        window.dispatchEvent(new Event('storage'));

        showToast(`✅ ${type === 'income' ? 'Income' : 'Expense'} of ${formatCurrency(amount)} added!`, 'success');
    });
}

// ============================================================
// 12. LISTEN FOR STORAGE CHANGES
// ============================================================
window.addEventListener('storage', (e) => {
    if (e.key === 'userProfile') {
        loadUserProfile();
        updateUIWithUser();
        // Re-apply dark mode if needed
        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark');
            if (darkToggle) darkToggle.innerHTML = '<i class="fas fa-sun"></i> Light';
            if (darkModeSwitch) darkModeSwitch.checked = true;
        } else {
            document.body.classList.remove('dark');
            if (darkToggle) darkToggle.innerHTML = '<i class="fas fa-moon"></i> Dark';
            if (darkModeSwitch) darkModeSwitch.checked = false;
        }
    }
    if (e.key === 'darkMode') {
        const isDark = e.newValue === 'true';
        if (isDark) {
            document.body.classList.add('dark');
            if (darkToggle) darkToggle.innerHTML = '<i class="fas fa-sun"></i> Light';
            if (darkModeSwitch) darkModeSwitch.checked = true;
        } else {
            document.body.classList.remove('dark');
            if (darkToggle) darkToggle.innerHTML = '<i class="fas fa-moon"></i> Dark';
            if (darkModeSwitch) darkModeSwitch.checked = false;
        }
    }
});

// ============================================================
// 13. INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    const hasUser = loadUserProfile();
    if (!hasUser) {
        // If no user, redirect to index (dashboard) to create one
        window.location.href = 'index.html';
        return;
    }

    // Apply dark mode from localStorage
    loadDarkMode();

    // Update UI with user data
    updateUIWithUser();

    // Restore sidebar state
    const savedSidebarState = localStorage.getItem('sidebarOpen');
    const isDesktop = window.innerWidth >= 901;
    let defaultOpen = isDesktop;
    if (savedSidebarState !== null) defaultOpen = savedSidebarState === 'true';
    toggleSidebar(defaultOpen);
});
