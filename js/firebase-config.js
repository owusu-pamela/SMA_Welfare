// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
    getDatabase, 
    ref, 
    set, 
    get, 
    update, 
    onValue, 
    query, 
    orderByChild, 
    equalTo,
    push,
    child 
} from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCqVYJp4f_L2HYXSi7MHWKqMcMXmEUrd5Y",
  authDomain: "sunyani-municipal-welfare.firebaseapp.com",
  databaseURL: "https://sunyani-municipal-welfare-default-rtdb.firebaseio.com",
  projectId: "sunyani-municipal-welfare",
  storageBucket: "sunyani-municipal-welfare.firebasestorage.app",
  messagingSenderId: "690980483755",
  appId: "1:690980483755:web:ce9bc7dcea698bd6d7fdee",
  measurementId: "G-KRG057K0VW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);

// Welfare Database Operations (Modular SDK v9+)
const WelfareDB = {
    // Test database connection
    async testConnection() {
        try {
            const testRef = ref(database, 'test_connection');
            await set(testRef, {
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
            const membersRef = ref(database, 'members');
            const snapshot = await get(membersRef);
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
            const memberRef = ref(database, 'members/' + memberId);
            const snapshot = await get(memberRef);
            return snapshot.val();
        } catch (error) {
            console.error('Error loading member:', error);
            return null;
        }
    },

    async addMember(memberData) {
        try {
            const memberId = memberData.id || 'member_' + Date.now();
            const memberRef = ref(database, 'members/' + memberId);
            await set(memberRef, memberData);
            console.log('Member added:', memberId);
            return memberId;
        } catch (error) {
            console.error('Error adding member:', error);
            throw error;
        }
    },

    async updateMember(memberId, updateData) {
        try {
            const memberRef = ref(database, 'members/' + memberId);
            await update(memberRef, updateData);
            console.log('Member updated:', memberId);
        } catch (error) {
            console.error('Error updating member:', error);
            throw error;
        }
    },

    onMembersChange(callback) {
        const membersRef = ref(database, 'members');
        onValue(membersRef, (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    // Contribution operations
    async getContributions() {
        try {
            const contributionsRef = ref(database, 'contributions');
            const snapshot = await get(contributionsRef);
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
            const contributionsRef = ref(database, 'contributions');
            const memberContributionsQuery = query(contributionsRef, orderByChild('memberId'), equalTo(memberId));
            const snapshot = await get(memberContributionsQuery);
            return snapshot.val() || {};
        } catch (error) {
            console.error('Error loading member contributions:', error);
            return {};
        }
    },

    async addContribution(contributionData) {
        try {
            const contributionId = 'contribution_' + Date.now();
            const contributionRef = ref(database, 'contributions/' + contributionId);
            await set(contributionRef, contributionData);
            console.log('Contribution added:', contributionId);
            return contributionId;
        } catch (error) {
            console.error('Error adding contribution:', error);
            throw error;
        }
    },

    onContributionsChange(callback) {
        const contributionsRef = ref(database, 'contributions');
        onValue(contributionsRef, (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    onMemberContributionsChange(memberId, callback) {
        const contributionsRef = ref(database, 'contributions');
        const memberContributionsQuery = query(contributionsRef, orderByChild('memberId'), equalTo(memberId));
        onValue(memberContributionsQuery, (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    // Withdrawal operations
    async getWithdrawals() {
        try {
            const withdrawalsRef = ref(database, 'withdrawals');
            const snapshot = await get(withdrawalsRef);
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
            const withdrawalsRef = ref(database, 'withdrawals');
            const memberWithdrawalsQuery = query(withdrawalsRef, orderByChild('memberId'), equalTo(memberId));
            const snapshot = await get(memberWithdrawalsQuery);
            return snapshot.val() || {};
        } catch (error) {
            console.error('Error loading member withdrawals:', error);
            return {};
        }
    },

    async addWithdrawal(withdrawalData) {
        try {
            const withdrawalId = 'withdrawal_' + Date.now();
            const withdrawalRef = ref(database, 'withdrawals/' + withdrawalId);
            await set(withdrawalRef, withdrawalData);
            console.log('Withdrawal added:', withdrawalId);
            return withdrawalId;
        } catch (error) {
            console.error('Error adding withdrawal:', error);
            throw error;
        }
    },

    async updateWithdrawal(withdrawalId, updateData) {
        try {
            const withdrawalRef = ref(database, 'withdrawals/' + withdrawalId);
            await update(withdrawalRef, updateData);
            console.log('Withdrawal updated:', withdrawalId);
        } catch (error) {
            console.error('Error updating withdrawal:', error);
            throw error;
        }
    },

    onWithdrawalsChange(callback) {
        const withdrawalsRef = ref(database, 'withdrawals');
        onValue(withdrawalsRef, (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    onMemberWithdrawalsChange(memberId, callback) {
        const withdrawalsRef = ref(database, 'withdrawals');
        const memberWithdrawalsQuery = query(withdrawalsRef, orderByChild('memberId'), equalTo(memberId));
        onValue(memberWithdrawalsQuery, (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    // Welfare application operations
    async getWelfareApplications() {
        try {
            const applicationsRef = ref(database, 'welfare_applications');
            const snapshot = await get(applicationsRef);
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
            const applicationsRef = ref(database, 'welfare_applications');
            const memberApplicationsQuery = query(applicationsRef, orderByChild('memberId'), equalTo(memberId));
            const snapshot = await get(memberApplicationsQuery);
            return snapshot.val() || {};
        } catch (error) {
            console.error('Error loading member welfare applications:', error);
            return {};
        }
    },

    async addWelfareApplication(applicationData) {
        try {
            const applicationId = 'welfare_' + Date.now();
            const applicationRef = ref(database, 'welfare_applications/' + applicationId);
            await set(applicationRef, applicationData);
            console.log('Welfare application added:', applicationId);
            return applicationId;
        } catch (error) {
            console.error('Error adding welfare application:', error);
            throw error;
        }
    },

    async updateWelfareApplication(applicationId, updateData) {
        try {
            const applicationRef = ref(database, 'welfare_applications/' + applicationId);
            await update(applicationRef, updateData);
            console.log('Welfare application updated:', applicationId);
        } catch (error) {
            console.error('Error updating welfare application:', error);
            throw error;
        }
    },

    onWelfareApplicationsChange(callback) {
        const applicationsRef = ref(database, 'welfare_applications');
        onValue(applicationsRef, (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    onMemberWelfareApplicationsChange(memberId, callback) {
        const applicationsRef = ref(database, 'welfare_applications');
        const memberApplicationsQuery = query(applicationsRef, orderByChild('memberId'), equalTo(memberId));
        onValue(memberApplicationsQuery, (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    // Welfare service operations
    async getWelfareServices() {
        try {
            const servicesRef = ref(database, 'welfare_services');
            const snapshot = await get(servicesRef);
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
            const serviceRef = ref(database, 'welfare_services/' + serviceId);
            await set(serviceRef, serviceData);
            console.log('Welfare service added:', serviceId);
            return serviceId;
        } catch (error) {
            console.error('Error adding welfare service:', error);
            throw error;
        }
    },

    async updateWelfareService(serviceId, updateData) {
        try {
            const serviceRef = ref(database, 'welfare_services/' + serviceId);
            await update(serviceRef, updateData);
            console.log('Welfare service updated:', serviceId);
        } catch (error) {
            console.error('Error updating welfare service:', error);
            throw error;
        }
    },

    onWelfareServicesChange(callback) {
        const servicesRef = ref(database, 'welfare_services');
        onValue(servicesRef, (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    // Admin operations
    async getAdmins() {
        try {
            const adminsRef = ref(database, 'admins');
            const snapshot = await get(adminsRef);
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
            const adminRef = ref(database, 'admins/' + adminId);
            await set(adminRef, adminData);
            console.log('Admin added:', adminId);
            return adminId;
        } catch (error) {
            console.error('Error adding admin:', error);
            throw error;
        }
    },

    async updateAdmin(adminId, updateData) {
        try {
            const adminRef = ref(database, 'admins/' + adminId);
            await update(adminRef, updateData);
            console.log('Admin updated:', adminId);
        } catch (error) {
            console.error('Error updating admin:', error);
            throw error;
        }
    },

    onAdminsChange(callback) {
        const adminsRef = ref(database, 'admins');
        onValue(adminsRef, (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    // Role operations
    async getRoles() {
        try {
            const rolesRef = ref(database, 'roles');
            const snapshot = await get(rolesRef);
            return snapshot.val() || {};
        } catch (error) {
            console.error('Error loading roles:', error);
            return {};
        }
    },

    onRolesChange(callback) {
        const rolesRef = ref(database, 'roles');
        onValue(rolesRef, (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    // System configuration operations
    async getSystemConfig() {
        try {
            const configRef = ref(database, 'system_config');
            const snapshot = await get(configRef);
            return snapshot.val() || {};
        } catch (error) {
            console.error('Error loading system config:', error);
            return {};
        }
    },

    async updateSystemConfig(configData) {
        try {
            const configRef = ref(database, 'system_config');
            await update(configRef, configData);
            console.log('System config updated');
        } catch (error) {
            console.error('Error updating system config:', error);
            throw error;
        }
    },

    onSystemConfigChange(callback) {
        const configRef = ref(database, 'system_config');
        onValue(configRef, (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    // Notification operations
    async getNotifications() {
        try {
            const notificationsRef = ref(database, 'notifications');
            const snapshot = await get(notificationsRef);
            return snapshot.val() || {};
        } catch (error) {
            console.error('Error loading notifications:', error);
            return {};
        }
    },

    async getMemberNotifications(memberId) {
        try {
            const notificationsRef = ref(database, 'notifications');
            const memberNotificationsQuery = query(notificationsRef, orderByChild('memberId'), equalTo(memberId));
            const snapshot = await get(memberNotificationsQuery);
            return snapshot.val() || {};
        } catch (error) {
            console.error('Error loading member notifications:', error);
            return {};
        }
    },

    async addNotification(notificationData) {
        try {
            const notificationId = 'notification_' + Date.now();
            const notificationRef = ref(database, 'notifications/' + notificationId);
            await set(notificationRef, notificationData);
            console.log('Notification added:', notificationId);
            return notificationId;
        } catch (error) {
            console.error('Error adding notification:', error);
            throw error;
        }
    },

    onNotificationsChange(callback) {
        const notificationsRef = ref(database, 'notifications');
        onValue(notificationsRef, (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    onMemberNotificationsChange(memberId, callback) {
        const notificationsRef = ref(database, 'notifications');
        const memberNotificationsQuery = query(notificationsRef, orderByChild('memberId'), equalTo(memberId));
        onValue(memberNotificationsQuery, (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    // Audit log operations
    async addAuditLog(logData) {
        try {
            const logId = 'audit_' + Date.now();
            const logRef = ref(database, 'audit_logs/' + logId);
            await set(logRef, logData);
            console.log('Audit log added:', logId);
            return logId;
        } catch (error) {
            console.error('Error adding audit log:', error);
            throw error;
        }
    },

    async getAuditLogs() {
        try {
            const auditLogsRef = ref(database, 'audit_logs');
            const snapshot = await get(auditLogsRef);
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
            const reportRef = ref(database, 'recent_reports/' + reportId);
            await set(reportRef, reportData);
            console.log('Recent report added:', reportId);
            return reportId;
        } catch (error) {
            console.error('Error adding recent report:', error);
            throw error;
        }
    },

    async getRecentReports() {
        try {
            const reportsRef = ref(database, 'recent_reports');
            const snapshot = await get(reportsRef);
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
            const backupRef = ref(database, 'backups/' + backupId);
            await set(backupRef, backupData);
            console.log('Backup added:', backupId);
            return backupId;
        } catch (error) {
            console.error('Error adding backup:', error);
            throw error;
        }
    },

    async getBackups() {
        try {
            const backupsRef = ref(database, 'backups');
            const snapshot = await get(backupsRef);
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
            const transactionRef = ref(database, 'payment_transactions/' + transactionId);
            await set(transactionRef, transactionData);
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
                const transactionsRef = ref(database, 'payment_transactions');
                const memberTransactionsQuery = query(transactionsRef, orderByChild('memberId'), equalTo(memberId));
                const snapshot = await get(memberTransactionsQuery);
                return snapshot.val() || {};
            } else {
                const transactionsRef = ref(database, 'payment_transactions');
                const snapshot = await get(transactionsRef);
                return snapshot.val() || {};
            }
        } catch (error) {
            console.error('Error loading payment transactions:', error);
            return {};
        }
    },

    onPaymentTransactionsChange(callback) {
        const transactionsRef = ref(database, 'payment_transactions');
        onValue(transactionsRef, (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    onMemberPaymentTransactionsChange(memberId, callback) {
        const transactionsRef = ref(database, 'payment_transactions');
        const memberTransactionsQuery = query(transactionsRef, orderByChild('memberId'), equalTo(memberId));
        onValue(memberTransactionsQuery, (snapshot) => {
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
