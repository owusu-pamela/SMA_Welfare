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
        // Load all data
        await loadAllData();
        
        // Set up real-time listeners
        setupRealtimeListeners();
        
        // Update last update time
        document.getElementById('lastUpdate').textContent = 
            `Last updated: ${new Date().toLocaleString()}`;
            
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        alert('Error loading dashboard data. Please refresh the page.');
    }
}

// Load all data from Firebase
async function loadAllData() {
    try {
        members = await WelfareDB.getMembers();
        contributions = await WelfareDB.getContributions();
        withdrawals = await WelfareDB.getWithdrawals();
        
        updateDashboardStats();
        updateReminders();
        updateRecentActivities();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Set up real-time listeners
function setupRealtimeListeners() {
    WelfareDB.onMembersChange((newMembers) => {
        members = newMembers;
        updateDashboardStats();
        updateReminders();
    });

    WelfareDB.onContributionsChange((newContributions) => {
        contributions = newContributions;
        updateDashboardStats();
        updateRecentActivities();
    });

    WelfareDB.onWithdrawalsChange((newWithdrawals) => {
        withdrawals = newWithdrawals;
        updateDashboardStats();
        updateRecentActivities();
    });
}

// Update dashboard statistics
function updateDashboardStats() {
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
        remindersList.innerHTML = '<div class="reminder-item">All members have paid for this month! 🎉</div>';
    } else {
        remindersList.innerHTML = unpaidMembers.map(member => `
            <div class="reminder-item">
                <strong>${member.name}</strong> has not paid for ${getMonthName(currentMonth)} ${currentYear}
                <button class="btn-primary" style="margin-left: 10px; padding: 2px 8px; font-size: 0.8rem;" 
                        onclick="quickRecordPayment('${member.id}')">
                    Record Payment
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
                            <strong>${activity.memberName}</strong> paid GH₵ ${parseFloat(activity.amount).toFixed(2)}
                        </span>
                        <small>${new Date(activity.timestamp).toLocaleDateString()}</small>
                    </div>
                `;
            } else {
                return `
                    <div class="activity-item">
                        <span class="activity-text">
                            Withdrawal of GH₵ ${parseFloat(activity.amount).toFixed(2)} for ${activity.reason}
                        </span>
                        <small>${new Date(activity.timestamp).toLocaleDateString()}</small>
                    </div>
                `;
            }
        }).join('');
    }
}

// Quick record payment function
function quickRecordPayment(memberId) {
    const member = Object.values(members).find(m => m.id === memberId);
    if (member) {
        if (confirm(`Record payment for ${member.name}?`)) {
            const currentDate = new Date();
            const contributionData = {
                memberId: memberId,
                memberName: member.name,
                amount: member.monthlyContribution || 0,
                month: currentDate.getMonth() + 1,
                year: currentDate.getFullYear(),
                timestamp: currentDate.toISOString(),
                recordedBy: sessionStorage.getItem('welfare_username') || 'Admin'
            };
            
            WelfareDB.addContribution(contributionData)
                .then(() => {
                    alert(`Payment recorded successfully for ${member.name}`);
                })
                .catch(error => {
                    console.error('Error recording payment:', error);
                    alert('Error recording payment. Please try again.');
                });
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

// Navigation active state
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function() {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
    });
});

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', initializeDashboard);