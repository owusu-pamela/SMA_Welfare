// Firebase configuration and database operations
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-auth-domain",
    databaseURL: "your-database-url",
    projectId: "your-project-id",
    storageBucket: "your-storage-bucket",
    messagingSenderId: "your-messaging-sender-id",
    appId: "your-app-id"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Database reference
const database = firebase.database();

// Welfare Database Operations
const WelfareDB = {
    // Member operations
    async getMembers() {
        const snapshot = await database.ref('members').once('value');
        return snapshot.val() || {};
    },

    async getMember(memberId) {
        const snapshot = await database.ref('members/' + memberId).once('value');
        return snapshot.val();
    },

    async addMember(memberData) {
        const memberId = memberData.id || 'member_' + Date.now();
        await database.ref('members/' + memberId).set(memberData);
        return memberId;
    },

    async updateMember(memberId, updateData) {
        await database.ref('members/' + memberId).update(updateData);
    },

    onMembersChange(callback) {
        database.ref('members').on('value', (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    // Contribution operations
    async getContributions() {
        const snapshot = await database.ref('contributions').once('value');
        return snapshot.val() || {};
    },

    async getMemberContributions(memberId) {
        const snapshot = await database.ref('contributions')
            .orderByChild('memberId')
            .equalTo(memberId)
            .once('value');
        return snapshot.val() || {};
    },

    async addContribution(contributionData) {
        const contributionId = 'contribution_' + Date.now();
        await database.ref('contributions/' + contributionId).set(contributionData);
        return contributionId;
    },

    onContributionsChange(callback) {
        database.ref('contributions').on('value', (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    onMemberContributionsChange(memberId, callback) {
        database.ref('contributions')
            .orderByChild('memberId')
            .equalTo(memberId)
            .on('value', (snapshot) => {
                callback(snapshot.val() || {});
            });
    },

    // Withdrawal operations
    async getWithdrawals() {
        const snapshot = await database.ref('withdrawals').once('value');
        return snapshot.val() || {};
    },

    async getMemberWithdrawals(memberId) {
        const snapshot = await database.ref('withdrawals')
            .orderByChild('memberId')
            .equalTo(memberId)
            .once('value');
        return snapshot.val() || {};
    },

    async addWithdrawal(withdrawalData) {
        const withdrawalId = 'withdrawal_' + Date.now();
        await database.ref('withdrawals/' + withdrawalId).set(withdrawalData);
        return withdrawalId;
    },

    async updateWithdrawal(withdrawalId, updateData) {
        await database.ref('withdrawals/' + withdrawalId).update(updateData);
    },

    onWithdrawalsChange(callback) {
        database.ref('withdrawals').on('value', (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    onMemberWithdrawalsChange(memberId, callback) {
        database.ref('withdrawals')
            .orderByChild('memberId')
            .equalTo(memberId)
            .on('value', (snapshot) => {
                callback(snapshot.val() || {});
            });
    },

    // Welfare application operations
    async getWelfareApplications() {
        const snapshot = await database.ref('welfare_applications').once('value');
        return snapshot.val() || {};
    },

    async getMemberWelfareApplications(memberId) {
        const snapshot = await database.ref('welfare_applications')
            .orderByChild('memberId')
            .equalTo(memberId)
            .once('value');
        return snapshot.val() || {};
    },

    async addWelfareApplication(applicationData) {
        const applicationId = 'welfare_' + Date.now();
        await database.ref('welfare_applications/' + applicationId).set(applicationData);
        return applicationId;
    },

    async updateWelfareApplication(applicationId, updateData) {
        await database.ref('welfare_applications/' + applicationId).update(updateData);
    },

    onWelfareApplicationsChange(callback) {
        database.ref('welfare_applications').on('value', (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    onMemberWelfareApplicationsChange(memberId, callback) {
        database.ref('welfare_applications')
            .orderByChild('memberId')
            .equalTo(memberId)
            .on('value', (snapshot) => {
                callback(snapshot.val() || {});
            });
    },

    // Welfare service operations
    async getWelfareServices() {
        const snapshot = await database.ref('welfare_services').once('value');
        return snapshot.val() || {};
    },

    async addWelfareService(serviceData) {
        const serviceId = serviceData.id || 'service_' + Date.now();
        await database.ref('welfare_services/' + serviceId).set(serviceData);
        return serviceId;
    },

    async updateWelfareService(serviceId, updateData) {
        await database.ref('welfare_services/' + serviceId).update(updateData);
    },

    onWelfareServicesChange(callback) {
        database.ref('welfare_services').on('value', (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    // Admin operations
    async getAdmins() {
        const snapshot = await database.ref('admins').once('value');
        return snapshot.val() || {};
    },

    async addAdmin(adminData) {
        const adminId = adminData.id || 'admin_' + Date.now();
        await database.ref('admins/' + adminId).set(adminData);
        return adminId;
    },

    async updateAdmin(adminId, updateData) {
        await database.ref('admins/' + adminId).update(updateData);
    },

    onAdminsChange(callback) {
        database.ref('admins').on('value', (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    // Role operations
    async getRoles() {
        const snapshot = await database.ref('roles').once('value');
        return snapshot.val() || {};
    },

    onRolesChange(callback) {
        database.ref('roles').on('value', (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    // System configuration operations
    async getSystemConfig() {
        const snapshot = await database.ref('system_config').once('value');
        return snapshot.val() || {};
    },

    async updateSystemConfig(configData) {
        await database.ref('system_config').update(configData);
    },

    onSystemConfigChange(callback) {
        database.ref('system_config').on('value', (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    // Notification operations
    async getNotifications() {
        const snapshot = await database.ref('notifications').once('value');
        return snapshot.val() || {};
    },

    async getMemberNotifications(memberId) {
        const snapshot = await database.ref('notifications')
            .orderByChild('memberId')
            .equalTo(memberId)
            .once('value');
        return snapshot.val() || {};
    },

    async addNotification(notificationData) {
        const notificationId = 'notification_' + Date.now();
        await database.ref('notifications/' + notificationId).set(notificationData);
        return notificationId;
    },

    onNotificationsChange(callback) {
        database.ref('notifications').on('value', (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    onMemberNotificationsChange(memberId, callback) {
        database.ref('notifications')
            .orderByChild('memberId')
            .equalTo(memberId)
            .on('value', (snapshot) => {
                callback(snapshot.val() || {});
            });
    },

    // Audit log operations
    async addAuditLog(logData) {
        const logId = 'audit_' + Date.now();
        await database.ref('audit_logs/' + logId).set(logData);
        return logId;
    },

    async getAuditLogs() {
        const snapshot = await database.ref('audit_logs').once('value');
        return snapshot.val() || {};
    },

    // Recent reports operations
    async addRecentReport(reportData) {
        const reportId = reportData.id || 'report_' + Date.now();
        await database.ref('recent_reports/' + reportId).set(reportData);
        return reportId;
    },

    async getRecentReports() {
        const snapshot = await database.ref('recent_reports').once('value');
        return snapshot.val() || {};
    },

    // Backup operations
    async addBackup(backupData) {
        const backupId = backupData.id || 'backup_' + Date.now();
        await database.ref('backups/' + backupId).set(backupData);
        return backupId;
    },

    async getBackups() {
        const snapshot = await database.ref('backups').once('value');
        return snapshot.val() || {};
    },

    // NEW: Payment transaction operations
    async addPaymentTransaction(transactionData) {
        const transactionId = 'payment_' + Date.now();
        await database.ref('payment_transactions/' + transactionId).set(transactionData);
        return transactionId;
    },

    async getPaymentTransactions(memberId = null) {
        const snapshot = await database.ref('payment_transactions').once('value');
        const transactions = snapshot.val() || {};
        
        if (memberId) {
            return Object.fromEntries(
                Object.entries(transactions).filter(([_, transaction]) => transaction.memberId === memberId)
            );
        }
        
        return transactions;
    },

    // Real-time payment listeners
    onPaymentTransactionsChange(callback) {
        database.ref('payment_transactions').on('value', (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    onMemberPaymentTransactionsChange(memberId, callback) {
        database.ref('payment_transactions')
            .orderByChild('memberId')
            .equalTo(memberId)
            .on('value', (snapshot) => {
                callback(snapshot.val() || {});
            });
    },

    // Authentication helper functions
    async authenticateUser(username, password) {
        // This is a simplified authentication - in production, use Firebase Auth
        const admins = await this.getAdmins();
        const members = await this.getMembers();
        
        // Check admins
        const admin = Object.values(admins).find(a => 
            a.username === username && a.password === password && a.status !== 'inactive'
        );
        
        if (admin) {
            return {
                success: true,
                user: admin,
                role: admin.role || 'admin',
                userId: admin.id
            };
        }
        
        // Check members
        const member = Object.values(members).find(m => 
            m.username === username && m.password === password && m.status === 'active'
        );
        
        if (member) {
            return {
                success: true,
                user: member,
                role: 'member',
                userId: member.id
            };
        }
        
        return {
            success: false,
            message: 'Invalid username or password'
        };
    },

    // Utility function to get current user data
    async getCurrentUser(userId, role) {
        if (role === 'member') {
            return await this.getMember(userId);
        } else {
            const admins = await this.getAdmins();
            return admins[userId];
        }
    }
};

// Global helper functions
function checkAuth() {
    return sessionStorage.getItem('welfare_loggedIn') === 'true';
}

function checkAdmin() {
    const role = sessionStorage.getItem('welfare_role');
    return role && role !== 'member';
}

function checkSuperAdmin() {
    const role = sessionStorage.getItem('welfare_role');
    return role === 'super_admin';
}

function checkMember() {
    const role = sessionStorage.getItem('welfare_role');
    return role === 'member';
}

function showToast(message, type = 'info') {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

function showLoading(message = 'Loading...') {
    // Remove existing loading
    const existingLoading = document.getElementById('loadingOverlay');
    if (existingLoading) {
        existingLoading.remove();
    }
    
    // Create loading overlay
    const loading = document.createElement('div');
    loading.id = 'loadingOverlay';
    loading.className = 'loading-overlay';
    loading.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <p>${message}</p>
        </div>
    `;
    
    document.body.appendChild(loading);
}

function hideLoading() {
    const loading = document.getElementById('loadingOverlay');
    if (loading) {
        loading.remove();
    }
}

// Make WelfareDB globally available
window.WelfareDB = WelfareDB;
window.showToast = showToast;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.checkAuth = checkAuth;
window.checkAdmin = checkAdmin;
window.checkSuperAdmin = checkSuperAdmin;
window.checkMember = checkMember;
