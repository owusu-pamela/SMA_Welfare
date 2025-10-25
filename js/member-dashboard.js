// Check member authentication
if (!checkAuth() || !checkMember()) {
    window.location.href = 'index.html';
}

let memberData = {};
let contributions = {};
let withdrawals = {};
let welfareApplications = {};
let welfareServices = {};
let notifications = {};

// Initialize member dashboard
async function initializeMemberDashboard() {
    try {
        console.log('Initializing member dashboard...');
        
        await loadMemberData();
        setupRealtimeListeners();
        
        updateDashboardStats();
        renderRecentActivities();
        updatePaymentStatus();
        initializeCharts();
        loadNotifications();
        
        document.getElementById('lastLogin').textContent = `Welcome back! Last login: ${new Date().toLocaleString()}`;
        
        console.log('Member dashboard initialized successfully');
        
    } catch (error) {
        console.error('Error initializing member dashboard:', error);
        showToast('Error loading dashboard data', 'error');
    }
}

// Load member data
async function loadMemberData() {
    try {
        const memberId = sessionStorage.getItem('welfare_userId');
        
        // Load member profile
        memberData = await WelfareDB.getMember(memberId);
        if (!memberData) {
            throw new Error('Member data not found');
        }
        
        // Load related data
        contributions = await WelfareDB.getMemberContributions(memberId);
        withdrawals = await WelfareDB.getMemberWithdrawals(memberId);
        welfareApplications = await WelfareDB.getMemberWelfareApplications(memberId);
        welfareServices = await WelfareDB.getWelfareServices();
        notifications = await WelfareDB.getMemberNotifications(memberId);
        
        console.log('Member data loaded:', {
            contributions: Object.keys(contributions).length,
            withdrawals: Object.keys(withdrawals).length,
            welfareApplications: Object.keys(welfareApplications).length,
            notifications: Object.keys(notifications).length
        });
        
        // Update welcome message
        document.getElementById('welcomeMessage').textContent = `Welcome, ${memberData.name}`;
        
    } catch (error) {
        console.error('Error loading member data:', error);
        throw error;
    }
}

// Set up real-time listeners
function setupRealtimeListeners() {
    const memberId = sessionStorage.getItem('welfare_userId');
    
    WelfareDB.onMemberContributionsChange(memberId, (newContributions) => {
        contributions = newContributions;
        updateDashboardStats();
        renderRecentActivities();
        updatePaymentStatus();
        updateCharts();
    });

    WelfareDB.onMemberWithdrawalsChange(memberId, (newWithdrawals) => {
        withdrawals = newWithdrawals;
        updateDashboardStats();
        renderRecentActivities();
        updateCharts();
    });

    WelfareDB.onMemberWelfareApplicationsChange(memberId, (newApplications) => {
        welfareApplications = newApplications;
        updateDashboardStats();
        renderRecentActivities();
    });

    WelfareDB.onMemberNotificationsChange(memberId, (newNotifications) => {
        notifications = newNotifications;
        loadNotifications();
    });
}

// Update dashboard statistics
function updateDashboardStats() {
    // Total contributions
    const totalContributions = Object.values(contributions).reduce((sum, contribution) => {
        return sum + (parseFloat(contribution.amount) || 0);
    }, 0);
    document.getElementById('totalContributions').textContent = `GH₵ ${totalContributions.toFixed(2)}`;
    
    // Available balance (50% of contributions minus withdrawals)
    const totalWithdrawals = Object.values(withdrawals)
        .filter(w => w.status === 'completed' || w.status === 'approved')
        .reduce((sum, withdrawal) => {
            return sum + (parseFloat(withdrawal.amount) || 0);
        }, 0);
    
    const availableBalance = (totalContributions * 0.5) - totalWithdrawals;
    document.getElementById('availableBalance').textContent = `Available: GH₵ ${Math.max(0, availableBalance).toFixed(2)}`;
    
    // Total withdrawals
    document.getElementById('totalWithdrawals').textContent = `GH₵ ${totalWithdrawals.toFixed(2)}`;
    document.getElementById('withdrawalLimit').textContent = `Limit: GH₵ ${(totalContributions * 0.5).toFixed(2)}`;
    
    // Welfare applications
    const totalApplications = Object.keys(welfareApplications).length;
    const pendingApplications = Object.values(welfareApplications).filter(app => app.status === 'pending').length;
    document.getElementById('welfareApplications').textContent = totalApplications;
    document.getElementById('pendingApplications').textContent = `Pending: ${pendingApplications}`;
    
    // Next due date and monthly due
    const monthlyDue = parseFloat(memberData.monthlyDue) || 0;
    document.getElementById('nextDueDate').textContent = '15th';
    document.getElementById('monthlyDue').textContent = `Monthly: GH₵ ${monthlyDue.toFixed(2)}`;
    
    // Update pay now button text based on payment status
    updatePayNowButton();
}

// Update pay now button
function updatePayNowButton() {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const hasPaidThisMonth = Object.values(contributions).some(contribution => 
        contribution.month === currentMonth && contribution.year === currentYear
    );
    
    const payButton = document.getElementById('payNowBtn');
    if (hasPaidThisMonth) {
        payButton.textContent = '✅ Paid This Month';
        payButton.disabled = true;
        payButton.classList.add('paid');
    } else {
        payButton.textContent = '💳 Pay Now';
        payButton.disabled = false;
        payButton.classList.remove('paid');
    }
}

// Render recent activities
function renderRecentActivities() {
    renderRecentTransactions();
    renderRecentWelfareApplications();
}

// Render recent transactions
function renderRecentTransactions() {
    const container = document.getElementById('recentTransactions');
    
    // Combine contributions and withdrawals
    const allTransactions = [
        ...Object.values(contributions).map(c => ({
            type: 'contribution',
            amount: c.amount,
            date: c.timestamp,
            description: `Monthly Contribution - ${getMonthName(c.month)} ${c.year}`,
            status: 'completed'
        })),
        ...Object.values(withdrawals).map(w => ({
            type: 'withdrawal',
            amount: w.amount,
            date: w.timestamp,
            description: `Withdrawal - ${w.purpose}`,
            status: w.status
        }))
    ];
    
    // Sort by date (newest first) and take latest 5
    const recentTransactions = allTransactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    if (recentTransactions.length === 0) {
        container.innerHTML = '<div class="activity-item"><span class="activity-text">No recent transactions</span></div>';
        return;
    }
    
    container.innerHTML = recentTransactions.map(transaction => {
        const isContribution = transaction.type === 'contribution';
        const date = new Date(transaction.date);
        
        return `
            <div class="activity-item">
                <span class="activity-text">
                    <strong>${transaction.description}</strong>
                </span>
                <small>${date.toLocaleDateString()} • 
                <span class="${isContribution ? 'text-success' : 'text-warning'}">
                    ${isContribution ? '+' : '-'}GH₵ ${parseFloat(transaction.amount).toFixed(2)}
                </span></small>
                <span class="status-${transaction.status}">${transaction.status}</span>
            </div>
        `;
    }).join('');
}

// Render recent welfare applications
function renderRecentWelfareApplications() {
    const container = document.getElementById('recentWelfareApplications');
    const recentApplications = Object.values(welfareApplications)
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
        .slice(0, 3);
    
    if (recentApplications.length === 0) {
        container.innerHTML = '<div class="activity-item"><span class="activity-text">No welfare applications</span></div>';
        return;
    }
    
    container.innerHTML = recentApplications.map(application => {
        const service = welfareServices[application.serviceId];
        const date = new Date(application.submittedAt);
        
        return `
            <div class="activity-item">
                <span class="activity-text">
                    <strong>${service?.name || 'Welfare Service'}</strong> - GH₵ ${parseFloat(application.amount).toFixed(2)}
                </span>
                <small>${date.toLocaleDateString()}</small>
                <span class="status-${application.status}">${application.status}</span>
            </div>
        `;
    }).join('');
}

// Update payment status grid
function updatePaymentStatus() {
    const currentYear = new Date().getFullYear();
    const monthlyDue = parseFloat(memberData.monthlyDue) || 0;
    
    // This would typically generate payment status for all months
    // For now, we'll create a static example
    const paymentStatus = [
        { month: 'January', status: 'paid', amount: monthlyDue, date: 'Paid: 12 Jan' },
        { month: 'February', status: 'paid', amount: monthlyDue, date: 'Paid: 10 Feb' },
        { month: 'March', status: 'pending', amount: monthlyDue, date: 'Due: 15 Mar' },
        { month: 'April', status: 'upcoming', amount: monthlyDue, date: 'Due: 15 Apr' },
        { month: 'May', status: 'upcoming', amount: monthlyDue, date: 'Due: 15 May' },
        { month: 'June', status: 'upcoming', amount: monthlyDue, date: 'Due: 15 Jun' }
    ];
    
    const container = document.querySelector('.payment-status-grid');
    container.innerHTML = paymentStatus.map(month => `
        <div class="month-status ${month.status}">
            <div class="month-name">${month.month}</div>
            <div class="payment-amount">GH₵ ${month.amount.toFixed(2)}</div>
            <div class="payment-date">${month.date}</div>
            <div class="status-badge ${month.status}">
                ${month.status === 'paid' ? '✅ Paid' : 
                  month.status === 'pending' ? '⏰ Due Soon' : '📅 Upcoming'}
            </div>
        </div>
    `).join('');
}

// Initialize charts
function initializeCharts() {
    createAnnualProgressChart();
    createMonthlyConsistencyChart();
}

// Create annual progress chart
function createAnnualProgressChart() {
    const currentYear = new Date().getFullYear();
    const annualTarget = (parseFloat(memberData.monthlyDue) || 0) * 12;
    const totalPaidThisYear = Object.values(contributions)
        .filter(c => c.year === currentYear)
        .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
    
    const progressPercent = annualTarget > 0 ? (totalPaidThisYear / annualTarget) * 100 : 0;
    
    document.getElementById('annualPercent').textContent = `${Math.round(progressPercent)}%`;
    document.getElementById('annualAmount').textContent = `GH₵ ${totalPaidThisYear.toFixed(2)} / ${annualTarget.toFixed(2)}`;
    
    // Update progress circle
    const progressCircle = document.getElementById('annualProgress');
    progressCircle.style.background = `conic-gradient(#27ae60 ${progressPercent}%, #ecf0f1 0%)`;
}

// Create monthly consistency chart
function createMonthlyConsistencyChart() {
    const ctx = document.getElementById('monthlyConsistencyChart').getContext('2d');
    const currentYear = new Date().getFullYear();
    
    // Calculate monthly payments for current year
    const monthlyData = Array(12).fill(0);
    Object.values(contributions).forEach(contribution => {
        if (contribution.year === currentYear) {
            monthlyData[contribution.month - 1] = 1; // 1 for paid, 0 for not paid
        }
    });
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Payment Status',
                data: monthlyData,
                backgroundColor: monthlyData.map(paid => paid ? '#27ae60' : '#e74c3c'),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.parsed.y === 1 ? 'Paid' : 'Not Paid';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 1,
                    ticks: {
                        callback: function(value) {
                            return value === 1 ? 'Paid' : 'Not Paid';
                        }
                    }
                }
            }
        }
    });
}

// Update charts when data changes
function updateCharts() {
    createAnnualProgressChart();
    // Monthly consistency chart updates automatically via Chart.js
}

// Load notifications
function loadNotifications() {
    const panelList = document.getElementById('panelNotificationsList');
    const mainList = document.getElementById('notificationsList');
    const unreadCount = Object.values(notifications).filter(n => !n.read).length;
    
    document.getElementById('notificationCount').textContent = unreadCount;
    
    // Panel notifications
    if (!notifications || Object.keys(notifications).length === 0) {
        panelList.innerHTML = '<div class="notification-item"><span class="notification-text">No notifications</span></div>';
        mainList.innerHTML = '<div class="notification-item"><span class="notification-text">No notifications</span></div>';
        return;
    }
    
    const sortedNotifications = Object.values(notifications)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Panel notifications (all notifications)
    panelList.innerHTML = sortedNotifications.map(notification => `
        <div class="notification-item ${notification.read ? '' : 'unread'}">
            <div class="notification-content">
                <h4>${notification.title}</h4>
                <p>${notification.message}</p>
                <small>${new Date(notification.createdAt).toLocaleDateString()}</small>
            </div>
        </div>
    `).join('');
    
    // Main dashboard notifications (only unread or important)
    const importantNotifications = sortedNotifications
        .filter(n => !n.read || n.priority === 'high')
        .slice(0, 3);
    
    if (importantNotifications.length === 0) {
        mainList.innerHTML = '<div class="notification-item"><span class="notification-text">No new notifications</span></div>';
        return;
    }
    
    mainList.innerHTML = importantNotifications.map(notification => `
        <div class="notification-item unread">
            <div class="notification-icon">💰</div>
            <div class="notification-content">
                <h4>${notification.title}</h4>
                <p>${notification.message}</p>
                <small>${new Date(notification.createdAt).toLocaleDateString()}</small>
            </div>
            ${notification.type === 'payment_reminder' ? 
                '<button class="notification-action" onclick="makePayment()">Pay Now</button>' : ''}
        </div>
    `).join('');
}

// Show payment modal
function makePayment() {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    // Check if already paid for current month
    const hasPaid = Object.values(contributions).some(c => 
        c.month === currentMonth && c.year === currentYear
    );
    
    if (hasPaid) {
        showToast('You have already paid for this month', 'info');
        return;
    }
    
    document.getElementById('paymentAmount').value = parseFloat(memberData.monthlyDue) || 50.00;
    document.getElementById('paymentMonth').value = currentMonth;
    
    updatePaymentSummary();
    document.getElementById('paymentModal').style.display = 'block';
}

// Close payment modal
function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
}

// Toggle payment details based on method
function togglePaymentDetails() {
    const method = document.getElementById('paymentMethod').value;
    document.getElementById('mobileMoneyDetails').style.display = 
        method === 'mobile_money' ? 'block' : 'none';
    
    updatePaymentSummary();
}

// Update payment summary
function updatePaymentSummary() {
    const amount = parseFloat(document.getElementById('paymentAmount').value) || 0;
    const method = document.getElementById('paymentMethod').value;
    
    let serviceFee = 0;
    if (method === 'mobile_money') {
        serviceFee = amount * 0.015; // 1.5% fee for mobile money
    } else if (method === 'bank_transfer') {
        serviceFee = 5.00; // Flat fee for bank transfer
    }
    
    const total = amount + serviceFee;
    
    document.getElementById('summaryAmount').textContent = `GH₵ ${amount.toFixed(2)}`;
    document.getElementById('summaryFee').textContent = `GH₵ ${serviceFee.toFixed(2)}`;
    document.getElementById('summaryTotal').textContent = `GH₵ ${total.toFixed(2)}`;
}

// Process payment
async function processPayment() {
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const month = parseInt(document.getElementById('paymentMonth').value);
    const method = document.getElementById('paymentMethod').value;
    const year = new Date().getFullYear();
    
    if (!amount || !month || !method) {
        showToast('Please fill all required fields', 'error');
        return;
    }
    
    const paymentData = {
        memberId: sessionStorage.getItem('welfare_userId'),
        memberName: memberData.name,
        amount: amount,
        month: month,
        year: year,
        paymentMethod: method,
        status: 'pending',
        timestamp: new Date().toISOString()
    };
    
    // Add mobile number if mobile money
    if (method === 'mobile_money') {
        const mobileNumber = document.getElementById('mobileNumber').value;
        if (!mobileNumber) {
            showToast('Please enter your mobile money number', 'error');
            return;
        }
        paymentData.mobileNumber = mobileNumber;
    }
    
    try {
        // In a real implementation, this would integrate with a payment gateway
        // For now, we'll simulate payment processing
        showLoading('Processing payment...');
        
        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Update payment status to completed
        paymentData.status = 'completed';
        paymentData.processedAt = new Date().toISOString();
        
        // Save to database
        await WelfareDB.addContribution(paymentData);
        
        // Create notification for admin
        await WelfareDB.addNotification({
            memberId: sessionStorage.getItem('welfare_userId'),
            title: 'New Payment Received',
            message: `${memberData.name} paid GH₵ ${amount.toFixed(2)} for ${getMonthName(month)}`,
            type: 'payment_received',
            priority: 'medium'
        });
        
        hideLoading();
        closePaymentModal();
        showToast('Payment processed successfully!', 'success');
        
    } catch (error) {
        hideLoading();
        console.error('Error processing payment:', error);
        showToast('Error processing payment. Please try again.', 'error');
    }
}

// Apply for welfare
function applyForWelfare() {
    // Load welfare services
    const serviceSelect = document.getElementById('welfareService');
    serviceSelect.innerHTML = '<option value="">Select a welfare service</option>';
    
    Object.values(welfareServices)
        .filter(service => service.active !== false)
        .forEach(service => {
            const option = document.createElement('option');
            option.value = service.id;
            option.textContent = service.name;
            serviceSelect.appendChild(option);
        });
    
    // Pre-fill contact information
    document.getElementById('applicantPhone').value = memberData.phone || '';
    document.getElementById('applicantEmail').value = memberData.email || '';
    document.getElementById('applicantAddress').value = memberData.address || '';
    
    document.getElementById('welfareApplicationModal').style.display = 'block';
}

// Close welfare modal
function closeWelfareModal() {
    document.getElementById('welfareApplicationModal').style.display = 'none';
}

// Update service details
function updateServiceDetails() {
    const serviceId = document.getElementById('welfareService').value;
    const service = welfareServices[serviceId];
    const detailsContainer = document.getElementById('serviceDetails');
    
    if (service) {
        document.getElementById('serviceDescription').textContent = service.description || 'No description available.';
        document.getElementById('serviceMaxAmount').textContent = `GH₵ ${parseFloat(service.maxAmount || 0).toFixed(2)}`;
        document.getElementById('serviceRequirements').textContent = service.requirements || 'None specified';
        detailsContainer.style.display = 'block';
        
        // Set default amount to max amount
        document.getElementById('applicationAmount').value = service.maxAmount || '';
    } else {
        detailsContainer.style.display = 'none';
    }
}

// Submit welfare application
async function submitWelfareApplication() {
    const serviceId = document.getElementById('welfareService').value;
    const amount = parseFloat(document.getElementById('applicationAmount').value);
    const reason = document.getElementById('applicationReason').value;
    const documents = document.getElementById('supportingDocuments').value;
    const phone = document.getElementById('applicantPhone').value;
    const email = document.getElementById('applicantEmail').value;
    const address = document.getElementById('applicantAddress').value;
    
    if (!serviceId || !amount || !reason || !phone) {
        showToast('Please fill all required fields', 'error');
        return;
    }
    
    const service = welfareServices[serviceId];
    if (service.maxAmount && amount > service.maxAmount) {
        showToast(`Requested amount exceeds maximum allowed amount of GH₵ ${service.maxAmount}`, 'error');
        return;
    }
    
    const applicationData = {
        memberId: sessionStorage.getItem('welfare_userId'),
        memberName: memberData.name,
        serviceId: serviceId,
        serviceName: service.name,
        amount: amount,
        description: reason,
        supportingDocuments: documents,
        contactPhone: phone,
        contactEmail: email,
        contactAddress: address,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        priority: 'normal'
    };
    
    try {
        showLoading('Submitting application...');
        
        await WelfareDB.addWelfareApplication(applicationData);
        
        // Create notification for admin
        await WelfareDB.addNotification({
            memberId: sessionStorage.getItem('welfare_userId'),
            title: 'New Welfare Application',
            message: `${memberData.name} applied for ${service.name} - GH₵ ${amount.toFixed(2)}`,
            type: 'welfare_application',
            priority: 'high'
        });
        
        hideLoading();
        closeWelfareModal();
        showToast('Welfare application submitted successfully!', 'success');
        
    } catch (error) {
        hideLoading();
        console.error('Error submitting welfare application:', error);
        showToast('Error submitting application. Please try again.', 'error');
    }
}

// Navigation functions
function viewContributions() {
    window.location.href = 'member-contributions.html';
}

function viewWelfareApplications() {
    window.location.href = 'member-welfare.html';
}

function requestWithdrawal() {
    window.location.href = 'member-withdrawals.html';
}

function downloadStatement() {
    showToast('Statement download feature will be available soon', 'info');
}

function updateProfile() {
    window.location.href = 'member-profile.html';
}

function contactSupport() {
    showToast('Support contact feature will be available soon', 'info');
}

// Notifications functions
function showNotifications() {
    document.getElementById('notificationsPanel').style.display = 'block';
}

function hideNotifications() {
    document.getElementById('notificationsPanel').style.display = 'none';
}

function markAllAsRead() {
    // Implementation to mark all notifications as read
    showToast('All notifications marked as read', 'success');
}

// Utility functions
function getMonthName(monthNumber) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthNumber - 1] || 'Unknown';
}

// Check if user is member
function checkMember() {
    const role = sessionStorage.getItem('welfare_role');
    return role === 'member';
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

// Event listeners
document.getElementById('paymentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    processPayment();
});

document.getElementById('welfareApplicationForm').addEventListener('submit', function(e) {
    e.preventDefault();
    submitWelfareApplication();
});

document.getElementById('paymentAmount').addEventListener('input', updatePaymentSummary);
document.getElementById('paymentMethod').addEventListener('change', updatePaymentSummary);

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = ['paymentModal', 'welfareApplicationModal', 'notificationsPanel'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target === modal) {
            if (modalId === 'paymentModal') closePaymentModal();
            if (modalId === 'welfareApplicationModal') closeWelfareModal();
            if (modalId === 'notificationsPanel') hideNotifications();
        }
    });
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', initializeMemberDashboard);
