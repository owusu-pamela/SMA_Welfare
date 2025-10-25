// Firebase Configuration - Complete Version with Member Features
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
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app(); // if already initialized, use that one
}

const database = firebase.database();

// Authentication check for all pages
function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('welfare_loggedIn');
    if (!isLoggedIn || isLoggedIn !== 'true') {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Check if user is admin
function checkAdmin() {
    const role = sessionStorage.getItem('welfare_role');
    return role === 'admin';
}

// Check if user is member
function checkMember() {
    const role = sessionStorage.getItem('welfare_role');
    return role === 'member';
}

// Utility functions for Firebase operations
const WelfareDB = {
    // Members operations
    async getMembers() {
        try {
            const snapshot = await database.ref('members').once('value');
            const members = snapshot.val();
            console.log('Fetched members:', members);
            return members || {};
        } catch (error) {
            console.error('Error fetching members:', error);
            return {};
        }
    },

    async addMember(memberData) {
        try {
            const memberId = 'member_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            await database.ref('members/' + memberId).set({
                ...memberData,
                id: memberId,
                createdAt: new Date().toISOString(),
                status: 'active'
            });
            console.log('Member added successfully:', memberId);
            return memberId;
        } catch (error) {
            console.error('Error adding member:', error);
            throw error;
        }
    },

    async updateMember(memberId, updates) {
        try {
            await database.ref('members/' + memberId).update(updates);
            console.log('Member updated successfully:', memberId);
        } catch (error) {
            console.error('Error updating member:', error);
            throw error;
        }
    },

    async deleteMember(memberId) {
        try {
            await database.ref('members/' + memberId).remove();
            console.log('Member deleted successfully:', memberId);
        } catch (error) {
            console.error('Error deleting member:', error);
            throw error;
        }
    },

    // Contributions operations
    async getContributions() {
        try {
            const snapshot = await database.ref('contributions').once('value');
            const contributions = snapshot.val();
            console.log('Raw contributions from Firebase:', contributions);
            
            // If no contributions exist, return empty object
            if (!contributions) {
                console.log('No contributions found in database');
                return {};
            }
            
            // Ensure all contributions have proper IDs
            const contributionsWithIds = {};
            Object.keys(contributions).forEach(key => {
                contributionsWithIds[key] = {
                    ...contributions[key],
                    id: key // Ensure each contribution has an ID
                };
            });
            
            console.log('Processed contributions with IDs:', contributionsWithIds);
            return contributionsWithIds;
        } catch (error) {
            console.error('Error fetching contributions:', error);
            return {};
        }
    },

    async addContribution(contributionData) {
        try {
            const contributionId = 'contribution_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            await database.ref('contributions/' + contributionId).set({
                ...contributionData,
                id: contributionId,
                timestamp: new Date().toISOString(),
                recordedBy: sessionStorage.getItem('welfare_username') || 'Admin'
            });
            console.log('Contribution added successfully:', contributionId);
            return contributionId;
        } catch (error) {
            console.error('Error adding contribution:', error);
            throw error;
        }
    },

    async updateContribution(contributionId, updates) {
        try {
            await database.ref('contributions/' + contributionId).update(updates);
            console.log('Contribution updated successfully:', contributionId);
        } catch (error) {
            console.error('Error updating contribution:', error);
            throw error;
        }
    },

    async deleteContribution(contributionId) {
        try {
            await database.ref('contributions/' + contributionId).remove();
            console.log('Contribution deleted successfully:', contributionId);
        } catch (error) {
            console.error('Error deleting contribution:', error);
            throw error;
        }
    },

    // Withdrawals operations
    async getWithdrawals() {
        try {
            const snapshot = await database.ref('withdrawals').once('value');
            const withdrawals = snapshot.val();
            console.log('Raw withdrawals from Firebase:', withdrawals);
            
            // If no withdrawals exist, return empty object
            if (!withdrawals) {
                console.log('No withdrawals found in database');
                return {};
            }
            
            // Ensure all withdrawals have proper IDs
            const withdrawalsWithIds = {};
            Object.keys(withdrawals).forEach(key => {
                withdrawalsWithIds[key] = {
                    ...withdrawals[key],
                    id: key // Ensure each withdrawal has an ID
                };
            });
            
            console.log('Processed withdrawals with IDs:', withdrawalsWithIds);
            return withdrawalsWithIds;
        } catch (error) {
            console.error('Error fetching withdrawals:', error);
            return {};
        }
    },

    async addWithdrawal(withdrawalData) {
        try {
            const withdrawalId = 'withdrawal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            await database.ref('withdrawals/' + withdrawalId).set({
                ...withdrawalData,
                id: withdrawalId,
                timestamp: new Date().toISOString(),
                processedBy: sessionStorage.getItem('welfare_username') || 'Admin',
                status: 'completed'
            });
            console.log('Withdrawal added successfully:', withdrawalId);
            return withdrawalId;
        } catch (error) {
            console.error('Error adding withdrawal:', error);
            throw error;
        }
    },

    async updateWithdrawal(withdrawalId, updates) {
        try {
            await database.ref('withdrawals/' + withdrawalId).update(updates);
            console.log('Withdrawal updated successfully:', withdrawalId);
        } catch (error) {
            console.error('Error updating withdrawal:', error);
            throw error;
        }
    },

    async deleteWithdrawal(withdrawalId) {
        try {
            await database.ref('withdrawals/' + withdrawalId).remove();
            console.log('Withdrawal deleted successfully:', withdrawalId);
        } catch (error) {
            console.error('Error deleting withdrawal:', error);
            throw error;
        }
    },

    // System operations
    async getSettings() {
        try {
            const snapshot = await database.ref('settings').once('value');
            return snapshot.val() || {};
        } catch (error) {
            console.error('Error fetching settings:', error);
            return {};
        }
    },

    async updateSettings(updates) {
        try {
            await database.ref('settings').update(updates);
            console.log('Settings updated successfully');
        } catch (error) {
            console.error('Error updating settings:', error);
            throw error;
        }
    },

    // Member-specific operations
    async getMemberContributions(memberId) {
        try {
            const contributions = await this.getContributions();
            const memberContributions = {};
            
            Object.keys(contributions).forEach(key => {
                if (contributions[key].memberId === memberId) {
                    memberContributions[key] = contributions[key];
                }
            });
            
            console.log(`Found ${Object.keys(memberContributions).length} contributions for member ${memberId}`);
            return memberContributions;
        } catch (error) {
            console.error('Error getting member contributions:', error);
            return {};
        }
    },

    async getMemberWithdrawals(memberId) {
        try {
            const withdrawals = await this.getWithdrawals();
            const memberWithdrawals = {};
            
            Object.keys(withdrawals).forEach(key => {
                if (withdrawals[key].memberId === memberId) {
                    memberWithdrawals[key] = withdrawals[key];
                }
            });
            
            console.log(`Found ${Object.keys(memberWithdrawals).length} withdrawals for member ${memberId}`);
            return memberWithdrawals;
        } catch (error) {
            console.error('Error getting member withdrawals:', error);
            return {};
        }
    },

    async getMemberWelfareApplications(memberId) {
        try {
            const snapshot = await database.ref('welfareApplications').once('value');
            const applications = snapshot.val() || {};
            const memberApplications = {};
            
            Object.keys(applications).forEach(key => {
                if (applications[key].memberId === memberId) {
                    memberApplications[key] = applications[key];
                }
            });
            
            console.log(`Found ${Object.keys(memberApplications).length} welfare applications for member ${memberId}`);
            return memberApplications;
        } catch (error) {
            console.error('Error getting member welfare applications:', error);
            return {};
        }
    },

    async submitWelfareApplication(applicationData) {
        try {
            const applicationId = 'welfare_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            await database.ref('welfareApplications/' + applicationId).set({
                ...applicationData,
                id: applicationId,
                submittedAt: new Date().toISOString(),
                status: 'pending'
            });
            console.log('Welfare application submitted successfully:', applicationId);
            return applicationId;
        } catch (error) {
            console.error('Error submitting welfare application:', error);
            throw error;
        }
    },

    async submitWithdrawalRequest(requestData) {
        try {
            const requestId = 'withdrawal_req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            await database.ref('withdrawalRequests/' + requestId).set({
                ...requestData,
                id: requestId,
                submittedAt: new Date().toISOString(),
                status: 'pending'
            });
            console.log('Withdrawal request submitted successfully:', requestId);
            return requestId;
        } catch (error) {
            console.error('Error submitting withdrawal request:', error);
            throw error;
        }
    },

    async getWithdrawalRequests() {
        try {
            const snapshot = await database.ref('withdrawalRequests').once('value');
            const requests = snapshot.val();
            
            if (!requests) {
                console.log('No withdrawal requests found in database');
                return {};
            }
            
            const requestsWithIds = {};
            Object.keys(requests).forEach(key => {
                requestsWithIds[key] = {
                    ...requests[key],
                    id: key
                };
            });
            
            console.log('Processed withdrawal requests with IDs:', requestsWithIds);
            return requestsWithIds;
        } catch (error) {
            console.error('Error fetching withdrawal requests:', error);
            return {};
        }
    },

    async updateWithdrawalRequest(requestId, updates) {
        try {
            await database.ref('withdrawalRequests/' + requestId).update(updates);
            console.log('Withdrawal request updated successfully:', requestId);
        } catch (error) {
            console.error('Error updating withdrawal request:', error);
            throw error;
        }
    },

    async getWelfareApplications() {
        try {
            const snapshot = await database.ref('welfareApplications').once('value');
            const applications = snapshot.val();
            
            if (!applications) {
                console.log('No welfare applications found in database');
                return {};
            }
            
            const applicationsWithIds = {};
            Object.keys(applications).forEach(key => {
                applicationsWithIds[key] = {
                    ...applications[key],
                    id: key
                };
            });
            
            console.log('Processed welfare applications with IDs:', applicationsWithIds);
            return applicationsWithIds;
        } catch (error) {
            console.error('Error fetching welfare applications:', error);
            return {};
        }
    },

    async updateWelfareApplication(applicationId, updates) {
        try {
            await database.ref('welfareApplications/' + applicationId).update(updates);
            console.log('Welfare application updated successfully:', applicationId);
        } catch (error) {
            console.error('Error updating welfare application:', error);
            throw error;
        }
    },

    // Real-time listeners
    onMembersChange(callback) {
        database.ref('members').on('value', (snapshot) => {
            callback(snapshot.val() || {});
        });
        return () => database.ref('members').off('value');
    },

    onContributionsChange(callback) {
        database.ref('contributions').on('value', (snapshot) => {
            callback(snapshot.val() || {});
        });
        return () => database.ref('contributions').off('value');
    },

    onWithdrawalsChange(callback) {
        database.ref('withdrawals').on('value', (snapshot) => {
            callback(snapshot.val() || {});
        });
        return () => database.ref('withdrawals').off('value');
    },

    onSettingsChange(callback) {
        database.ref('settings').on('value', (snapshot) => {
            callback(snapshot.val() || {});
        });
        return () => database.ref('settings').off('value');
    },

    onWithdrawalRequestsChange(callback) {
        database.ref('withdrawalRequests').on('value', (snapshot) => {
            callback(snapshot.val() || {});
        });
        return () => database.ref('withdrawalRequests').off('value');
    },

    onWelfareApplicationsChange(callback) {
        database.ref('welfareApplications').on('value', (snapshot) => {
            callback(snapshot.val() || {});
        });
        return () => database.ref('welfareApplications').off('value');
    },

    // Utility methods
    async getTotalContributions() {
        try {
            const contributions = await this.getContributions();
            return Object.values(contributions).reduce((sum, contribution) => {
                return sum + (parseFloat(contribution.amount) || 0);
            }, 0);
        } catch (error) {
            console.error('Error calculating total contributions:', error);
            return 0;
        }
    },

    async getTotalWithdrawals() {
        try {
            const withdrawals = await this.getWithdrawals();
            return Object.values(withdrawals).reduce((sum, withdrawal) => {
                return sum + (parseFloat(withdrawal.amount) || 0);
            }, 0);
        } catch (error) {
            console.error('Error calculating total withdrawals:', error);
            return 0;
        }
    },

    async getAvailableBalance() {
        try {
            const totalContributions = await this.getTotalContributions();
            const totalWithdrawals = await this.getTotalWithdrawals();
            return totalContributions - totalWithdrawals;
        } catch (error) {
            console.error('Error calculating available balance:', error);
            return 0;
        }
    },

    async getMemberBalance(memberId) {
        try {
            const memberContributions = await this.getMemberContributions(memberId);
            const totalPaid = Object.values(memberContributions).reduce((sum, contribution) => {
                return sum + (parseFloat(contribution.amount) || 0);
            }, 0);
            
            // Calculate available withdrawal balance (typically a percentage of total paid)
            const withdrawalPercentage = 0.5; // 50% of total contributions can be withdrawn
            return totalPaid * withdrawalPercentage;
        } catch (error) {
            console.error('Error calculating member balance:', error);
            return 0;
        }
    },

    // Data export methods
    async exportData() {
        try {
            const members = await this.getMembers();
            const contributions = await this.getContributions();
            const withdrawals = await this.getWithdrawals();
            const settings = await this.getSettings();
            const withdrawalRequests = await this.getWithdrawalRequests();
            const welfareApplications = await this.getWelfareApplications();
            
            return {
                members,
                contributions,
                withdrawals,
                withdrawalRequests,
                welfareApplications,
                settings,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
        } catch (error) {
            console.error('Error exporting data:', error);
            throw error;
        }
    },

    // Notification methods
    async addNotification(notificationData) {
        try {
            const notificationId = 'notification_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            await database.ref('notifications/' + notificationId).set({
                ...notificationData,
                id: notificationId,
                createdAt: new Date().toISOString(),
                read: false
            });
            console.log('Notification added successfully:', notificationId);
            return notificationId;
        } catch (error) {
            console.error('Error adding notification:', error);
            throw error;
        }
    },

    async getMemberNotifications(memberId) {
        try {
            const snapshot = await database.ref('notifications').once('value');
            const notifications = snapshot.val() || {};
            const memberNotifications = {};
            
            Object.keys(notifications).forEach(key => {
                if (notifications[key].memberId === memberId || !notifications[key].memberId) {
                    memberNotifications[key] = notifications[key];
                }
            });
            
            return memberNotifications;
        } catch (error) {
            console.error('Error getting member notifications:', error);
            return {};
        }
    },

    async markNotificationAsRead(notificationId) {
        try {
            await database.ref('notifications/' + notificationId).update({
                read: true,
                readAt: new Date().toISOString()
            });
            console.log('Notification marked as read:', notificationId);
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }
};

// Show toast notification
function showToast(message, type = 'success') {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 3000);
}

// Format currency
function formatCurrency(amount) {
    return `GH₵ ${parseFloat(amount).toFixed(2)}`;
}

// Date utilities
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}

function getMonthName(monthNumber) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthNumber - 1] || 'Unknown';
}

// Validation utilities
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[0-9+\-\s()]{10,}$/;
    return phoneRegex.test(phone);
}

function isValidAmount(amount) {
    return !isNaN(amount) && parseFloat(amount) > 0;
}

// Storage utilities
function getCurrentUser() {
    return {
        username: sessionStorage.getItem('welfare_username'),
        userId: sessionStorage.getItem('welfare_userId'),
        role: sessionStorage.getItem('welfare_role'),
        lastLogin: sessionStorage.getItem('welfare_lastLogin')
    };
}

function clearUserSession() {
    sessionStorage.removeItem('welfare_loggedIn');
    sessionStorage.removeItem('welfare_username');
    sessionStorage.removeItem('welfare_userId');
    sessionStorage.removeItem('welfare_role');
    sessionStorage.removeItem('welfare_lastLogin');
}

// Debug utilities
async function debugDatabase() {
    console.log('=== DATABASE DEBUG INFO ===');
    
    try {
        const members = await WelfareDB.getMembers();
        const contributions = await WelfareDB.getContributions();
        const withdrawals = await WelfareDB.getWithdrawals();
        const withdrawalRequests = await WelfareDB.getWithdrawalRequests();
        const welfareApplications = await WelfareDB.getWelfareApplications();
        
        console.log('Members count:', Object.keys(members).length);
        console.log('Contributions count:', Object.keys(contributions).length);
        console.log('Withdrawals count:', Object.keys(withdrawals).length);
        console.log('Withdrawal Requests count:', Object.keys(withdrawalRequests).length);
        console.log('Welfare Applications count:', Object.keys(welfareApplications).length);
        
        const totalContributions = await WelfareDB.getTotalContributions();
        const totalWithdrawals = await WelfareDB.getTotalWithdrawals();
        const availableBalance = await WelfareDB.getAvailableBalance();
        
        console.log('Total Contributions:', formatCurrency(totalContributions));
        console.log('Total Withdrawals:', formatCurrency(totalWithdrawals));
        console.log('Available Balance:', formatCurrency(availableBalance));
        
    } catch (error) {
        console.error('Debug error:', error);
    }
}

// Initialize default data if needed
async function initializeDefaultData() {
    try {
        const adminRef = database.ref('admin');
        const snapshot = await adminRef.once('value');
        
        if (!snapshot.exists()) {
            await adminRef.set({
                username: 'abc',
                password: '12345',
                email: 'admin@sunyaniwelfare.com',
                createdAt: new Date().toISOString(),
                role: 'administrator'
            });
            console.log('Default admin user created');
        }
        
        // Initialize settings if they don't exist
        const settingsRef = database.ref('settings');
        const settingsSnapshot = await settingsRef.once('value');
        
        if (!settingsSnapshot.exists()) {
            await settingsRef.set({
                systemName: 'Sunyani Municipal Welfare',
                currency: 'GHS',
                defaultMonthlyContribution: 50.00,
                fiscalYearStart: 'January',
                withdrawalPercentage: 0.5,
                minWithdrawalAmount: 100.00,
                maxWithdrawalAmount: 5000.00,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            console.log('Default settings created');
        }
        
    } catch (error) {
        console.error('Error initializing default data:', error);
    }
}

// Call initialization when the config loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Firebase configuration loaded');
    initializeDefaultData();
});
