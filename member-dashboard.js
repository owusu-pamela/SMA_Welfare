// Check authentication and role
if (!checkAuth() || sessionStorage.getItem('welfare_role') !== 'member') {
    window.location.href = 'index.html';
}

const memberId = sessionStorage.getItem('welfare_userId');
let memberData = {};
let contributions = {};

// Initialize member dashboard
async function initializeMemberDashboard() {
    try {
        console.log('Initializing member dashboard for:', memberId);
        
        await loadMemberData();
        await loadContributions();
        setupRealtimeListeners();
        
        updateDashboardStats();
        updateRecentContributions();
        updatePaymentReminder();
        
        console.log('Member dashboard initialized successfully');
        
    } catch (error) {
        console.error('Error initializing member dashboard:', error);
        showToast('Error loading dashboard data', 'error');
    }
}

// Load member data
async function loadMemberData() {
    try {
        const members = await WelfareDB.getMembers();
        memberData = members[memberId];
        
        if (!memberData) {
            showToast('Member data not found', 'error');
            return;
        }
        
        document.getElementById('welcomeMessage').textContent = `Welcome, ${memberData.name}`;
        document.getElementById('monthlyContributionDisplay').textContent = `GH₵ ${parseFloat(memberData.monthlyContribution || 0).toFixed(2)}`;
        
    } catch (error) {
        console.error('Error loading member data:', error);
        throw error;
    }
}

// Load contributions
async function loadContributions() {
    try {
        contributions = await WelfareDB.getContributions();
        console.log('Member contributions loaded:', Object.keys(contributions).length);
    } catch (error) {
        console.error('Error loading contributions:', error);
        throw error;
    }
}

// Set up real-time listeners
function setupRealtimeListeners() {
    WelfareDB.onContributionsChange((newContributions) => {
        contributions = newContributions || {};
        updateDashboardStats();
        updateRecentContributions();
    });
}

// Update dashboard statistics
function updateDashboardStats() {
    // Filter member's contributions
    const memberContributions = Object.values(contributions).filter(
        contribution => contribution.memberId === memberId
    );
    
    // Total paid
    const totalPaid = memberContributions.reduce((sum, contribution) => {
        return sum + (parseFloat(contribution.amount) || 0);
    }, 0);
    document.getElementById('totalPaid').textContent = `GH₵ ${totalPaid.toFixed(2)}`;
    
    // This month's payment
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    const monthPaid = memberContributions.reduce((sum, contribution) => {
        if (contribution.month == currentMonth && contribution.year == currentYear) {
            return sum + (parseFloat(contribution.amount) || 0);
        }
        return sum;
    }, 0);
    document.getElementById('monthPaid').textContent = `GH₵ ${monthPaid.toFixed(2)}`;
    
    // Next due date
    updateNextDueDate(memberContributions);
    
    // Welfare status
    document.getElementById('welfareStatus').textContent = memberData.status || 'Active';
    document.getElementById('welfareStatus').className = `status-${memberData.status || 'active'}`;
}

// Update next due date
function updateNextDueDate(memberContributions) {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    // Check if current month is paid
    const currentMonthPaid = memberContributions.some(contribution => 
        contribution.month == currentMonth && contribution.year == currentYear
    );
    
    if (!currentMonthPaid) {
        document.getElementById('nextDueDate').textContent = 'This Month';
        document.getElementById('nextDueDate').style.color = '#e74c3c';
        document.getElementById('nextDueDate').style.fontWeight = 'bold';
    } else {
        // Find next unpaid month
        let nextMonth = currentMonth + 1;
        let nextYear = currentYear;
        
        if (nextMonth > 12) {
            nextMonth = 1;
            nextYear = currentYear + 1;
        }
        
        const nextMonthPaid = memberContributions.some(contribution => 
            contribution.month == nextMonth && contribution.year == nextYear
        );
        
        if (!nextMonthPaid) {
            const monthName = getMonthName(nextMonth);
            document.getElementById('nextDueDate').textContent = `${monthName} ${nextYear}`;
            document.getElementById('nextDueDate').style.color = '#f39c12';
        } else {
            document.getElementById('nextDueDate').textContent = 'Up to Date';
            document.getElementById('nextDueDate').style.color = '#27ae60';
        }
    }
}

// Update recent contributions
function updateRecentContributions() {
    const recentContributions = document.getElementById('recentContributions');
    const memberContributions = Object.values(contributions)
        .filter(contribution => contribution.memberId === memberId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);
    
    if (memberContributions.length === 0) {
        recentContributions.innerHTML = '<div class="activity-item">No contributions yet</div>';
        return;
    }
    
    recentContributions.innerHTML = memberContributions.map(contribution => {
        const paymentDate = new Date(contribution.timestamp);
        return `
            <div class="activity-item">
                <span class="activity-text">
                    Paid GH₵ ${parseFloat(contribution.amount).toFixed(2)} for ${getMonthName(contribution.month)} ${contribution.year}
                </span>
                <small>${paymentDate.toLocaleDateString()}</small>
            </div>
        `;
    }).join('');
}

// Update payment reminder
function updatePaymentReminder() {
    const paymentReminder = document.getElementById('paymentReminder');
    const reminderMessage = document.getElementById('reminderMessage');
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    const currentMonthPaid = Object.values(contributions).some(contribution => 
        contribution.memberId === memberId && 
        contribution.month == currentMonth && 
        contribution.year == currentYear
    );
    
    if (!currentMonthPaid) {
        const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
        const today = currentDate.getDate();
        
        if (today > 15) {
            reminderMessage.textContent = `Your payment for ${getMonthName(currentMonth)} is overdue!`;
            paymentReminder.style.display = 'block';
            paymentReminder.style.background = '#fde8e8';
            paymentReminder.style.borderLeft = '4px solid #e74c3c';
        } else if (today > 10) {
            reminderMessage.textContent = `Your payment for ${getMonthName(currentMonth)} is due soon.`;
            paymentReminder.style.display = 'block';
            paymentReminder.style.background = '#fef5e8';
            paymentReminder.style.borderLeft = '4px solid #f39c12';
        }
    } else {
        paymentReminder.style.display = 'none';
    }
}

// Make payment function
function makePayment() {
    const currentDate = new Date();
    document.getElementById('paymentMonth').value = currentDate.getMonth() + 1;
    document.getElementById('paymentYear').value = currentDate.getFullYear();
    document.getElementById('paymentAmount').value = memberData.monthlyContribution || 0;
    
    updatePaymentSummary();
    
    document.getElementById('paymentModal').style.display = 'block';
    
    // Add event listeners for real-time summary updates
    document.getElementById('paymentAmount').addEventListener('input', updatePaymentSummary);
    document.getElementById('paymentMonth').addEventListener('change', updatePaymentSummary);
    document.getElementById('paymentYear').addEventListener('change', updatePaymentSummary);
}

// Close payment modal
function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
    document.getElementById('paymentForm').reset();
    
    // Remove event listeners
    document.getElementById('paymentAmount').removeEventListener('input', updatePaymentSummary);
    document.getElementById('paymentMonth').removeEventListener('change', updatePaymentSummary);
    document.getElementById('paymentYear').removeEventListener('change', updatePaymentSummary);
}

// Update payment summary
function updatePaymentSummary() {
    const amount = parseFloat(document.getElementById('paymentAmount').value) || 0;
    const month = document.getElementById('paymentMonth').value;
    const year = document.getElementById('paymentYear').value;
    
    document.getElementById('summaryPaymentAmount').textContent = `GH₵ ${amount.toFixed(2)}`;
    
    if (month && year) {
        document.getElementById('summaryPaymentPeriod').textContent = `${getMonthName(month)} ${year}`;
    }
}

// Submit payment
async function submitPayment() {
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const month = document.getElementById('paymentMonth').value;
    const year = document.getElementById('paymentYear').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const reference = document