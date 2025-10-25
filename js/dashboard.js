// Check authentication and role
if (!checkAuth() || !checkAdmin()) {
    window.location.href = 'index.html';
}

let members = {};
let contributions = {};
let welfareApplications = {};
let withdrawals = {};
let paymentChart = null;

// Initialize dashboard
async function initializeDashboard() {
    try {
        console.log('Initializing admin dashboard...');
        
        await loadAllData();
        setupRealtimeListeners();
        
        updateDashboardStats();
        updatePaymentTracking();
        updateRecentActivities();
        checkSystemAlerts();
        
        document.getElementById('lastUpdate').textContent = `Last updated: ${new Date().toLocaleString()}`;
        
        console.log('Dashboard initialized successfully');
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showToast('Error loading dashboard data', 'error');
    }
}

// Load all required data
async function loadAllData() {
    try {
        members = await WelfareDB.getMembers();
        contributions = await WelfareDB.getContributions();
        welfareApplications = await WelfareDB.getWelfareApplications();
        withdrawals = await WelfareDB.getWithdrawals();
        
        console.log('Data loaded:', {
            members: Object.keys(members).length,
            contributions: Object.keys(contributions).length,
            welfareApplications: Object.keys(welfareApplications).length,
            withdrawals: Object.keys(withdrawals).length
        });
        
    } catch (error) {
        console.error('Error loading data:', error);
        throw error;
    }
}

// Set up real-time listeners
function setupRealtimeListeners() {
    WelfareDB.onMembersChange((newMembers) => {
        members = newMembers;
        updateDashboardStats();
        updatePaymentTracking();
    });

    WelfareDB.onContributionsChange((newContributions) => {
        contributions = newContributions;
        updateDashboardStats();
        updatePaymentTracking();
        updateRecentActivities();
    });

    WelfareDB.onWelfareApplicationsChange((newApplications) => {
        welfareApplications = newApplications;
        updateDashboardStats();
        updateRecentActivities();
        checkSystemAlerts();
    });

    WelfareDB.onWithdrawalsChange((newWithdrawals) => {
        withdrawals = newWithdrawals;
        updateDashboardStats();
        checkSystemAlerts();
    });
}

// Update dashboard statistics
function updateDashboardStats() {
    const membersArray = Object.values(members);
    const activeMembers = membersArray.filter(m => m.status === 'active');
    
    // Total members
    document.getElementById('totalMembers').textContent = membersArray.length;
    document.getElementById('activeMembersText').textContent = `${activeMembers.length} Active`;
    
    // Total contributions
    const totalContributions = Object.values(contributions).reduce((sum, contribution) => {
        return sum + (parseFloat(contribution.amount) || 0);
    }, 0);
    document.getElementById('totalContributions').textContent = `GH₵ ${totalContributions.toFixed(2)}`;
    
    // Monthly collection
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthlyCollection = Object.values(contributions).reduce((sum, contribution) => {
        if (contribution.month === currentMonth && contribution.year === currentYear) {
            return sum + (parseFloat(contribution.amount) || 0);
        }
        return sum;
    }, 0);
    document.getElementById('monthlyCollection').textContent = `This Month: GH₵ ${monthlyCollection.toFixed(2)}`;
    
    // Available balance
    const totalWithdrawals = Object.values(withdrawals).reduce((sum, withdrawal) => {
        return sum + (parseFloat(withdrawal.amount) || 0);
    }, 0);
    const availableBalance = totalContributions - totalWithdrawals;
    document.getElementById('availableBalance').textContent = `GH₵ ${availableBalance.toFixed(2)}`;
    
    // Withdrawal reserve (50% of contributions)
    const withdrawalReserve = totalContributions * 0.5;
    document.getElementById('withdrawalReserve').textContent = `Reserve: GH₵ ${withdrawalReserve.toFixed(2)}`;
    
    // Pending actions
    const pendingWelfare = Object.values(welfareApplications).filter(app => app.status === 'pending').length;
    const pendingWithdrawals = Object.values(withdrawals).filter(w => w.status === 'pending').length;
    const totalPending = pendingWelfare + pendingWithdrawals;
    
    document.getElementById('pendingActions').textContent = totalPending;
    document.getElementById('pendingBreakdown').textContent = `Welfare: ${pendingWelfare}, Withdrawals: ${pendingWithdrawals}`;
    
    // Update notification count
    document.getElementById('notificationCount').textContent = totalPending;
}

// Update payment tracking
function updatePaymentTracking() {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const activeMembers = Object.values(members).filter(m => m.status === 'active');
    
    // Calculate payment status
    let paidCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;
    
    activeMembers.forEach(member => {
        const hasPaid = Object.values(contributions).some(contribution => 
            contribution.memberId === member.id && 
            contribution.month === currentMonth && 
            contribution.year === currentYear
        );
        
        if (hasPaid) {
            paidCount++;
        } else {
            const today = new Date();
            const paymentDueDate = new Date(currentYear, currentMonth - 1, 15); // Due on 15th of month
            
            if (today > paymentDueDate) {
                overdueCount++;
            } else {
                pendingCount++;
            }
        }
    });
    
    const totalActive = activeMembers.length;
    
    // Update payment stats
    document.getElementById('paidMembers').textContent = paidCount;
    document.getElementById('paidPercentage').textContent = totalActive > 0 ? `${Math.round((paidCount / totalActive) * 100)}%` : '0%';
    
    document.getElementById('pendingMembers').textContent = pendingCount;
    document.getElementById('pendingPercentage').textContent = totalActive > 0 ? `${Math.round((pendingCount / totalActive) * 100)}%` : '0%';
    
    document.getElementById('overdueMembers').textContent = overdueCount;
    document.getElementById('overduePercentage').textContent = totalActive > 0 ? `${Math.round((overdueCount / totalActive) * 100)}%` : '0%';
    
    // Update payment chart
    updatePaymentChart(paidCount, pendingCount, overdueCount);
}

// Update payment chart
function updatePaymentChart(paid, pending, overdue) {
    const ctx = document.getElementById('paymentChart').getContext('2d');
    
    // Destroy existing chart
    if (paymentChart) {
        paymentChart.destroy();
    }
    
    paymentChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Paid', 'Pending', 'Overdue'],
            datasets: [{
                data: [paid, pending, overdue],
                backgroundColor: ['#27ae60', '#f39c12', '#e74c3c'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? Math.round((context.parsed / total) * 100) : 0;
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Update recent activities
function updateRecentActivities() {
    updateRecentWelfareRequests();
    updateRecentPayments();
}

// Update recent welfare requests
function updateRecentWelfareRequests() {
    const container = document.getElementById('recentWelfareRequests');
    const recentRequests = Object.values(welfareApplications)
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
        .slice(0, 5);
    
    if (recentRequests.length === 0) {
        container.innerHTML = '<div class="activity-item"><span class="activity-text">No welfare requests</span></div>';
        return;
    }
    
    container.innerHTML = recentRequests.map(request => {
        const member = members[request.memberId];
        const date = new Date(request.submittedAt);
        return `
            <div class="activity-item">
                <span class="activity-text">
                    <strong>${member?.name || 'Unknown Member'}</strong> - ${request.serviceName}
                </span>
                <small>GH₵ ${parseFloat(request.amount).toFixed(2)} • ${date.toLocaleDateString()}</small>
                <span class="status-${request.status}">${request.status}</span>
            </div>
        `;
    }).join('');
}

// Update recent payments
function updateRecentPayments() {
    const container = document.getElementById('recentPayments');
    const recentPayments = Object.values(contributions)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);
    
    if (recentPayments.length === 0) {
        container.innerHTML = '<div class="activity-item"><span class="activity-text">No recent payments</span></div>';
        return;
    }
    
    container.innerHTML = recentPayments.map(payment => {
        const member = members[payment.memberId];
        const date = new Date(payment.timestamp);
        return `
            <div class="activity-item">
                <span class="activity-text">
                    <strong>${member?.name || 'Unknown Member'}</strong> paid GH₵ ${parseFloat(payment.amount).toFixed(2)}
                </span>
                <small>${getMonthName(payment.month)} ${payment.year} • ${date.toLocaleDateString()}</small>
            </div>
        `;
    }).join('');
}

// Check system alerts
function checkSystemAlerts() {
    const alertsContainer = document.getElementById('systemAlerts');
    const alertsList = document.getElementById('alertsList');
    
    const alerts = [];
    
    // Check for overdue payments
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const activeMembers = Object.values(members).filter(m => m.status === 'active');
    const overdueMembers = activeMembers.filter(member => {
        const hasPaid = Object.values(contributions).some(c => 
            c.memberId === member.id && c.month === currentMonth && c.year === currentYear
        );
        return !hasPaid && new Date().getDate() > 15;
    });
    
    if (overdueMembers.length > 0) {
        alerts.push({
            type: 'warning',
            message: `${overdueMembers.length} members have overdue payments for ${getMonthName(currentMonth)}`
        });
    }
    
    // Check pending welfare requests
    const pendingWelfare = Object.values(welfareApplications).filter(app => app.status === 'pending').length;
    if (pendingWelfare > 0) {
        alerts.push({
            type: 'info',
            message: `${pendingWelfare} welfare requests pending review`
        });
    }
    
    // Check low balance
    const totalContributions = Object.values(contributions).reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
    const totalWithdrawals = Object.values(withdrawals).reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0);
    const availableBalance = totalContributions - totalWithdrawals;
    
    if (availableBalance < 1000) {
        alerts.push({
            type: 'danger',
            message: 'Low system balance. Consider collecting outstanding dues.'
        });
    }
    
    // Display alerts
    if (alerts.length > 0) {
        alertsContainer.style.display = 'block';
        alertsList.innerHTML = alerts.map(alert => `
            <div class="alert alert-${alert.type}">
                ${alert.message}
            </div>
        `).join('');
    } else {
        alertsContainer.style.display = 'none';
    }
}

// Send monthly reminders
async function sendMonthlyReminders() {
    try {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const activeMembers = Object.values(members).filter(m => m.status === 'active');
        
        let remindersSent = 0;
        
        for (const member of activeMembers) {
            const hasPaid = Object.values(contributions).some(c => 
                c.memberId === member.id && c.month === currentMonth && c.year === currentYear
            );
            
            if (!hasPaid) {
                // Create notification for member
                await WelfareDB.addNotification({
                    memberId: member.id,
                    title: 'Monthly Contribution Reminder',
                    message: `Your monthly contribution of GH₵ ${parseFloat(member.monthlyDue).toFixed(2)} for ${getMonthName(currentMonth)} is due. Please make payment.`,
                    type: 'reminder',
                    priority: 'high'
                });
                
                remindersSent++;
            }
        }
        
        showToast(`Payment reminders sent to ${remindersSent} members`, 'success');
        
    } catch (error) {
        console.error('Error sending reminders:', error);
        showToast('Error sending payment reminders', 'error');
    }
}

// Run monthly dues (for salary controller members)
async function runMonthlyDues() {
    try {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const controllerMembers = Object.values(members).filter(m => 
            m.status === 'active' && m.paymentMode === 'controller'
        );
        
        let processed = 0;
        
        for (const member of controllerMembers) {
            const hasPaid = Object.values(contributions).some(c => 
                c.memberId === member.id && c.month === currentMonth && c.year === currentYear
            );
            
            if (!hasPaid) {
                // Automatically record payment for salary controller members
                const contributionData = {
                    memberId: member.id,
                    memberName: member.name,
                    amount: member.monthlyDue,
                    month: currentMonth,
                    year: currentYear,
                    paymentMethod: 'Salary Controller',
                    status: 'verified',
                    timestamp: new Date().toISOString(),
                    recordedBy: 'System Auto'
                };
                
                await WelfareDB.addContribution(contributionData);
                processed++;
            }
        }
        
        showToast(`Automatically processed ${processed} salary controller payments`, 'success');
        
    } catch (error) {
        console.error('Error running monthly dues:', error);
        showToast('Error processing monthly dues', 'error');
    }
}

// Notifications functions
function showNotifications() {
    document.getElementById('notificationsPanel').style.display = 'block';
    loadNotifications();
}

function hideNotifications() {
    document.getElementById('notificationsPanel').style.display = 'none';
}

async function loadNotifications() {
    try {
        const notifications = await WelfareDB.getNotifications();
        const pendingWelfare = Object.values(welfareApplications).filter(app => app.status === 'pending').length;
        const pendingWithdrawals = Object.values(withdrawals).filter(w => w.status === 'pending').length;
        
        const notificationsList = document.getElementById('notificationsList');
        
        let notificationsHTML = '';
        
        if (pendingWelfare > 0) {
            notificationsHTML += `
                <div class="notification-item urgent">
                    <span class="notification-text">${pendingWelfare} welfare requests pending review</span>
                    <small>Click to review</small>
                </div>
            `;
        }
        
        if (pendingWithdrawals > 0) {
            notificationsHTML += `
                <div class="notification-item urgent">
                    <span class="notification-text">${pendingWithdrawals} withdrawal requests pending</span>
                    <small>Click to process</small>
                </div>
            `;
        }
        
        // Add system notifications
        Object.values(notifications).forEach(notification => {
            if (!notification.read) {
                notificationsHTML += `
                    <div class="notification-item">
                        <span class="notification-text">${notification.message}</span>
                        <small>${new Date(notification.createdAt).toLocaleDateString()}</small>
                    </div>
                `;
            }
        });
        
        if (!notificationsHTML) {
            notificationsHTML = '<div class="notification-item"><span class="notification-text">No new notifications</span></div>';
        }
        
        notificationsList.innerHTML = notificationsHTML;
        
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

// Utility function
function getMonthName(monthNumber) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthNumber - 1] || 'Unknown';
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('welfare_loggedIn');
        sessionStorage.removeItem('welfare_username');
        sessionStorage.removeItem('welfare_userId');
        sessionStorage.removeItem('welfare_role');
        sessionStorage.removeItem('welfare_lastLogin');
        window.location.href = 'index.html';
    }
}

// Close notifications when clicking outside
window.onclick = function(event) {
    const panel = document.getElementById('notificationsPanel');
    if (event.target === panel) {
        hideNotifications();
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', initializeDashboard);
