// Firebase configuration and database operations
const firebaseConfig = {
    apiKey: "AIzaSyC4-RGc-pXQZ2oZc3w8q9W2b6d7s8t9u0v",
    authDomain: "sunyani-welfare.firebaseapp.com",
    databaseURL: "https://sunyani-welfare-default-rtdb.firebaseio.com",
    projectId: "sunyani-welfare",
    storageBucket: "sunyani-welfare.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456789"
};

// Initialize Firebase
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization error:', error);
}

// Database reference
const database = firebase.database();

// Welfare Database Operations
const WelfareDB = {
    // Test database connection
    async testConnection() {
        try {
            const testRef = database.ref('test_connection');
            await testRef.set({
                timestamp: new Date().toISOString(),
                status: 'connected'
            });
            console.log('Firebase connection test successful');
            return true;
        } catch (error) {
            console.error('Firebase connection test failed:', error);
            return false;
        }
    },

    // Member operations
    async getMembers() {
        try {
            const snapshot = await database.ref('members').once('value');
            const members = snapshot.val() || {};
            console.log('Loaded members:', Object.keys(members).length);
            return members;
        } catch (error) {
            console.error('Error loading members:', error);
            return {};
        }
    },

    async getMember(memberId) {
        try {
            const snapshot = await database.ref('members/' + memberId).once('value');
            return snapshot.val();
        } catch (error) {
            console.error('Error loading member:', error);
            return null;
        }
    },

    async addMember(memberData) {
        try {
            const memberId = memberData.id || 'member_' + Date.now();
            await database.ref('members/' + memberId).set(memberData);
            console.log('Member added:', memberId);
            return memberId;
        } catch (error) {
            console.error('Error adding member:', error);
            throw error;
        }
    },

    async updateMember(memberId, updateData) {
        try {
            await database.ref('members/' + memberId).update(updateData);
            console.log('Member updated:', memberId);
        } catch (error) {
            console.error('Error updating member:', error);
            throw error;
        }
    },

    onMembersChange(callback) {
        database.ref('members').on('value', (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    // Contribution operations
    async getContributions() {
        try {
            const snapshot = await database.ref('contributions').once('value');
            const contributions = snapshot.val() || {};
            console.log('Loaded contributions:', Object.keys(contributions).length);
            return contributions;
        } catch (error) {
            console.error('Error loading contributions:', error);
            return {};
        }
    },

    async getMemberContributions(memberId) {
        try {
            const snapshot = await database.ref('contributions').orderByChild('memberId').equalTo(memberId).once('value');
            return snapshot.val() || {};
        } catch (error) {
            console.error('Error loading member contributions:', error);
            return {};
        }
    },

    async addContribution(contributionData) {
        try {
            const contributionId = 'contribution_' + Date.now();
            await database.ref('contributions/' + contributionId).set(contributionData);
            console.log('Contribution added:', contributionId);
            return contributionId;
        } catch (error) {
            console.error('Error adding contribution:', error);
            throw error;
        }
    },

    onContributionsChange(callback) {
        database.ref('contributions').on('value', (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    onMemberContributionsChange(memberId, callback) {
        database.ref('contributions').orderByChild('memberId').equalTo(memberId).on('value', (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    // Withdrawal operations
    async getWithdrawals() {
        try {
            const snapshot = await database.ref('withdrawals').once('value');
            const withdrawals = snapshot.val() || {};
            console.log('Loaded withdrawals:', Object.keys(withdrawals).length);
            return withdrawals;
        } catch (error) {
            console.error('Error loading withdrawals:', error);
            return {};
        }
    },

    async getMemberWithdrawals(memberId) {
        try {
            const snapshot = await database.ref('withdrawals').orderByChild('memberId').equalTo(memberId).once('value');
            return snapshot.val() || {};
        } catch (error) {
            console.error('Error loading member withdrawals:', error);
            return {};
        }
    },

    async addWithdrawal(withdrawalData) {
        try {
            const withdrawalId = 'withdrawal_' + Date.now();
            await database.ref('withdrawals/' + withdrawalId).set(withdrawalData);
            console.log('Withdrawal added:', withdrawalId);
            return withdrawalId;
        } catch (error) {
            console.error('Error adding withdrawal:', error);
            throw error;
        }
    },

    async updateWithdrawal(withdrawalId, updateData) {
        try {
            await database.ref('withdrawals/' + withdrawalId).update(updateData);
            console.log('Withdrawal updated:', withdrawalId);
        } catch (error) {
            console.error('Error updating withdrawal:', error);
            throw error;
        }
    },

    onWithdrawalsChange(callback) {
        database.ref('withdrawals').on('value', (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    onMemberWithdrawalsChange(memberId, callback) {
        database.ref('withdrawals').orderByChild('memberId').equalTo(memberId).on('value', (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    // Welfare application operations
    async getWelfareApplications() {
        try {
            const snapshot = await database.ref('welfare_applications').once('value');
            const applications = snapshot.val() || {};
            console.log('Loaded welfare applications:', Object.keys(applications).length);
            return applications;
        } catch (error) {
            console.error('Error loading welfare applications:', error);
            return {};
        }
    },

    async getMemberWelfareApplications(memberId) {
        try {
            const snapshot = await database.ref('welfare_applications').orderByChild('memberId').equalTo(memberId).once('value');
            return snapshot.val() || {};
        } catch (error) {
            console.error('Error loading member welfare applications:', error);
            return {};
        }
    },

    async addWelfareApplication(applicationData) {
        try {
            const applicationId = 'welfare_' + Date.now();
            await database.ref('welfare_applications/' + applicationId).set(applicationData);
            console.log('Welfare application added:', applicationId);
            return applicationId;
        } catch (error) {
            console.error('Error adding welfare application:', error);
            throw error;
        }
    },

    async updateWelfareApplication(applicationId, updateData) {
        try {
            await database.ref('welfare_applications/' + applicationId).update(updateData);
            console.log('Welfare application updated:', applicationId);
        } catch (error) {
            console.error('Error updating welfare application:', error);
            throw error;
        }
    },

    onWelfareApplicationsChange(callback) {
        database.ref('welfare_applications').on('value', (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    onMemberWelfareApplicationsChange(memberId, callback) {
        database.ref('welfare_applications').orderByChild('memberId').equalTo(memberId).on('value', (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    // Welfare service operations
    async getWelfareServices() {
        try {
            const snapshot = await database.ref('welfare_services').once('value');
            const services = snapshot.val() || {};
            console.log('Loaded welfare services:', Object.keys(services).length);
            return services;
        } catch (error) {
            console.error('Error loading welfare services:', error);
            return {};
        }
    },

    async addWelfareService(serviceData) {
        try {
            const serviceId = serviceData.id || 'service_' + Date.now();
            await database.ref('welfare_services/' + serviceId).set(serviceData);
            console.log('Welfare service added:', serviceId);
            return serviceId;
        } catch (error) {
            console.error('Error adding welfare service:', error);
            throw error;
        }
    },

    async updateWelfareService(serviceId, updateData) {
        try {
            await database.ref('welfare_services/' + serviceId).update(updateData);
            console.log('Welfare service updated:', serviceId);
        } catch (error) {
            console.error('Error updating welfare service:', error);
            throw error;
        }
    },

    onWelfareServicesChange(callback) {
        database.ref('welfare_services').on('value', (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    // Admin operations
    async getAdmins() {
        try {
            const snapshot = await database.ref('admins').once('value');
            const admins = snapshot.val() || {};
            console.log('Loaded admins:', Object.keys(admins).length);
            return admins;
        } catch (error) {
            console.error('Error loading admins:', error);
            return {};
        }
    },

    async addAdmin(adminData) {
        try {
            const adminId = adminData.id || 'admin_' + Date.now();
            await database.ref('admins/' + adminId).set(adminData);
            console.log('Admin added:', adminId);
            return adminId;
        } catch (error) {
            console.error('Error adding admin:', error);
            throw error;
        }
    },

    async updateAdmin(adminId, updateData) {
        try {
            await database.ref('admins/' + adminId).update(updateData);
            console.log('Admin updated:', adminId);
        } catch (error) {
            console.error('Error updating admin:', error);
            throw error;
        }
    },

    onAdminsChange(callback) {
        database.ref('admins').on('value', (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    // Role operations
    async getRoles() {
        try {
            const snapshot = await database.ref('roles').once('value');
            return snapshot.val() || {};
        } catch (error) {
            console.error('Error loading roles:', error);
            return {};
        }
    },

    onRolesChange(callback) {
        database.ref('roles').on('value', (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    // System configuration operations
    async getSystemConfig() {
        try {
            const snapshot = await database.ref('system_config').once('value');
            return snapshot.val() || {};
        } catch (error) {
            console.error('Error loading system config:', error);
            return {};
        }
    },

    async updateSystemConfig(configData) {
        try {
            await database.ref('system_config').update(configData);
            console.log('System config updated');
        } catch (error) {
            console.error('Error updating system config:', error);
            throw error;
        }
    },

    onSystemConfigChange(callback) {
        database.ref('system_config').on('value', (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    // Notification operations
    async getNotifications() {
        try {
            const snapshot = await database.ref('notifications').once('value');
            return snapshot.val() || {};
        } catch (error) {
            console.error('Error loading notifications:', error);
            return {};
        }
    },

    async getMemberNotifications(memberId) {
        try {
            const snapshot = await database.ref('notifications').orderByChild('memberId').equalTo(memberId).once('value');
            return snapshot.val() || {};
        } catch (error) {
            console.error('Error loading member notifications:', error);
            return {};
        }
    },

    async addNotification(notificationData) {
        try {
            const notificationId = 'notification_' + Date.now();
            await database.ref('notifications/' + notificationId).set(notificationData);
            console.log('Notification added:', notificationId);
            return notificationId;
        } catch (error) {
            console.error('Error adding notification:', error);
            throw error;
        }
    },

    onNotificationsChange(callback) {
        database.ref('notifications').on('value', (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    onMemberNotificationsChange(memberId, callback) {
        database.ref('notifications').orderByChild('memberId').equalTo(memberId).on('value', (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    // Audit log operations
    async addAuditLog(logData) {
        try {
            const logId = 'audit_' + Date.now();
            await database.ref('audit_logs/' + logId).set(logData);
            console.log('Audit log added:', logId);
            return logId;
        } catch (error) {
            console.error('Error adding audit log:', error);
            throw error;
        }
    },

    async getAuditLogs() {
        try {
            const snapshot = await database.ref('audit_logs').once('value');
            return snapshot.val() || {};
        } catch (error) {
            console.error('Error loading audit logs:', error);
            return {};
        }
    },

    // Recent reports operations
    async addRecentReport(reportData) {
        try {
            const reportId = reportData.id || 'report_' + Date.now();
            await database.ref('recent_reports/' + reportId).set(reportData);
            console.log('Recent report added:', reportId);
            return reportId;
        } catch (error) {
            console.error('Error adding recent report:', error);
            throw error;
        }
    },

    async getRecentReports() {
        try {
            const snapshot = await database.ref('recent_reports').once('value');
            return snapshot.val() || {};
        } catch (error) {
            console.error('Error loading recent reports:', error);
            return {};
        }
    },

    // Backup operations
    async addBackup(backupData) {
        try {
            const backupId = backupData.id || 'backup_' + Date.now();
            await database.ref('backups/' + backupId).set(backupData);
            console.log('Backup added:', backupId);
            return backupId;
        } catch (error) {
            console.error('Error adding backup:', error);
            throw error;
        }
    },

    async getBackups() {
        try {
            const snapshot = await database.ref('backups').once('value');
            return snapshot.val() || {};
        } catch (error) {
            console.error('Error loading backups:', error);
            return {};
        }
    },

    // Payment transaction operations
    async addPaymentTransaction(transactionData) {
        try {
            const transactionId = 'payment_' + Date.now();
            await database.ref('payment_transactions/' + transactionId).set(transactionData);
            console.log('Payment transaction added:', transactionId);
            return transactionId;
        } catch (error) {
            console.error('Error adding payment transaction:', error);
            throw error;
        }
    },

    async getPaymentTransactions(memberId = null) {
        try {
            if (memberId) {
                const snapshot = await database.ref('payment_transactions').orderByChild('memberId').equalTo(memberId).once('value');
                return snapshot.val() || {};
            } else {
                const snapshot = await database.ref('payment_transactions').once('value');
                return snapshot.val() || {};
            }
        } catch (error) {
            console.error('Error loading payment transactions:', error);
            return {};
        }
    },

    onPaymentTransactionsChange(callback) {
        database.ref('payment_transactions').on('value', (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    onMemberPaymentTransactionsChange(memberId, callback) {
        database.ref('payment_transactions').orderByChild('memberId').equalTo(memberId).on('value', (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    // Authentication helper functions
    async authenticateUser(username, password) {
        try {
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
        } catch (error) {
            console.error('Authentication error:', error);
            return {
                success: false,
                message: 'Authentication failed'
            };
        }
    },

    // Utility function to get current user data
    async getCurrentUser(userId, role) {
        try {
            if (role === 'member') {
                return await this.getMember(userId);
            } else {
                const admins = await this.getAdmins();
                return admins[userId];
            }
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
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

// Test connection when page loads
document.addEventListener('DOMContentLoaded', async () => {
    const connected = await WelfareDB.testConnection();
    if (connected) {
        console.log('Firebase connection established successfully');
    } else {
        console.error('Failed to connect to Firebase');
        showToast('Database connection failed. Please check your internet connection.', 'error');
    }
});
