// Check authentication on page load
if (!checkAuth()) {
    window.location.href = 'index.html';
}

// Set welcome message
document.getElementById('welcomeMessage').textContent = 
    `Welcome, ${sessionStorage.getItem('welfare_username') || 'Admin'}`;

// Global data storage
let members = {};
let contributions = {};
let withdrawals = {};

// Initialize dashboard
async function initializeDashboard() {
    try {
        console.log('Initializing dashboard...');
        // Load all data
        await loadAllData();
        
        // Set up real-time listeners
        setupRealtimeListeners();
        
        // Update last update time
        document.getElementById('lastUpdate').textContent = 
            `Last updated: ${new Date().toLocaleString()}`;
            
        console.log('Dashboard initialized successfully');
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showToast('Error loading dashboard data', 'error');
    }
}

// Load all data from Firebase
async function loadAllData() {
    try {
        console.log('Loading all data...');
        members = await WelfareDB.getMembers();
        contributions = await WelfareDB.getContributions();
        withdrawals = await WelfareDB.getWithdrawals();
        
        console.log('Data loaded - Members:', Object.keys(members).length, 
                   'Contributions:', Object.keys(contributions).length,
                   'Withdrawals:', Object.keys(withdrawals).length);
        
        updateDashboardStats();
        updateReminders();
        updateRecentActivities();
    } catch (error) {
        console.error('Error loading data:', error);
        throw error;
    }
}

// Set up real-time listeners
function setupRealtimeListeners() {
    console.log('Setting up real-time listeners...');
    
    WelfareDB.onMembersChange((newMembers) => {
        console.log('Members updated in real-time');
        members = newMembers;
        updateDashboardStats();
        updateReminders();
    });

    WelfareDB.onContributionsChange((newContributions) => {
        console.log('Contributions updated in real-time');
        contributions = newContributions;
        updateDashboardStats();
        updateRecentActivities();
    });

    WelfareDB.onWithdrawalsChange((newWithdrawals) => {
        console.log('Withdrawals updated in real-time');
        withdrawals = newWithdrawals;
        updateDashboardStats();
        updateRecentActivities();
    });
}

// Update dashboard statistics
function updateDashboardStats() {
    console.log('Updating dashboard stats...');
    
    // Total Members
    const totalMembers = Object.keys(members).length;
    document.getElementById('totalMembers').textContent = totalMembers;

    // Total Contributions
    const totalContributions = Object.values(contributions).reduce((sum, contribution) => {
        return sum + (parseFloat(contribution.amount) || 0);
    }, 0);
    document.getElementById('totalContributions').textContent = `GH₵ ${totalContributions.toFixed(2)}`;

    // Total Withdrawals
    const totalWithdrawals = Object.values(withdrawals).reduce((sum, withdrawal) => {
        return sum + (parseFloat(withdrawal.amount) || 0);
    }, 0);

    // Available Balance
    const availableBalance = totalContributions - totalWithdrawals;
    document.getElementById('availableBalance').textContent = `GH₵ ${availableBalance.toFixed(2)}`;

    // This Month's Collection
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthlyCollection = Object.values(contributions).reduce((sum, contribution) => {
        const contributionDate = new Date(contribution.timestamp);
        if (contributionDate.getMonth() + 1 === currentMonth && 
            contributionDate.getFullYear() === currentYear) {
            return sum + (parseFloat(contribution.amount) || 0);
        }
        return sum;
    }, 0);
    document.getElementById('monthlyCollection').textContent = `GH₵ ${monthlyCollection.toFixed(2)}`;

    console.log('Dashboard stats updated');
}

// Update payment reminders
function updateReminders() {
    const remindersList = document.getElementById('remindersList');
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    let unpaidMembers = [];
    
    Object.values(members).forEach(member => {
        const hasPaid = Object.values(contributions).some(contribution => {
            const contributionDate = new Date(contribution.timestamp);
            return contribution.memberId === member.id &&
                   contributionDate.getMonth() + 1 === currentMonth &&
                   contributionDate.getFullYear() === currentYear;
        });
        
        if (!hasPaid) {
            unpaidMembers.push(member);
        }
    });
    
    if (unpaidMembers.length === 0) {
        remindersList.innerHTML = '<div class="reminder-item">🎉 All members have paid for this month!</div>';
    } else {
        remindersList.innerHTML = unpaidMembers.map(member => `
            <div class="reminder-item">
                <strong>${member.name}</strong> - ${getMonthName(currentMonth)} ${currentYear}
                <br>
                <button class="btn-primary" style="margin-top: 5px; padding: 5px 10px; font-size: 0.8rem;" 
                        onclick="quickRecordPayment('${member.id}')">
                    💳 Record Payment
                </button>
            </div>
        `).join('');
    }
}

// Update recent activities
function updateRecentActivities() {
    const activitiesList = document.getElementById('activitiesList');
    
    // Combine contributions and withdrawals and sort by timestamp
    const allActivities = [
        ...Object.values(contributions).map(c => ({ ...c, type: 'contribution' })),
        ...Object.values(withdrawals).map(w => ({ ...w, type: 'withdrawal' }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
    
    if (allActivities.length === 0) {
        activitiesList.innerHTML = '<div class="activity-item">No recent activities</div>';
    } else {
        activitiesList.innerHTML = allActivities.map(activity => {
            if (activity.type === 'contribution') {
                return `
                    <div class="activity-item">
                        <span class="activity-text">
                            💰 <strong>${activity.memberName}</strong> paid GH₵ ${parseFloat(activity.amount).toFixed(2)}
                        </span>
                        <small>${new Date(activity.timestamp).toLocaleDateString()}</small>
                    </div>
                `;
            } else {
                return `
                    <div class="activity-item">
                        <span class="activity-text">
                            🏧 Withdrawal of GH₵ ${parseFloat(activity.amount).toFixed(2)} for ${activity.reason}
                        </span>
                        <small>${new Date(activity.timestamp).toLocaleDateString()}</small>
                    </div>
                `;
            }
        }).join('');
    }
}

// Quick record payment function
async function quickRecordPayment(memberId) {
    const member = Object.values(members).find(m => m.id === memberId);
    if (member) {
        const amount = prompt(`Record payment for ${member.name}:`, member.monthlyContribution || '0');
        if (amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0) {
            const currentDate = new Date();
            const contributionData = {
                memberId: memberId,
                memberName: member.name,
                amount: parseFloat(amount),
                month: currentDate.getMonth() + 1,
                year: currentDate.getFullYear(),
                paymentMethod: 'Cash',
                notes: 'Quick payment from dashboard'
            };
            
            try {
                await WelfareDB.addContribution(contributionData);
                showToast(`Payment recorded for ${member.name}`, 'success');
            } catch (error) {
                console.error('Error recording payment:', error);
                showToast('Error recording payment', 'error');
            }
        }
    }
}

// Utility function
function getMonthName(monthNumber) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthNumber - 1];
}

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', function() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('welfare_loggedIn');
        sessionStorage.removeItem('welfare_username');
        sessionStorage.removeItem('welfare_lastLogin');
        window.location.href = 'index.html';
    }
});

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', initializeDashboard);
