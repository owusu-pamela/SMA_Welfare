// Firebase Configuration - Complete Version
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

    // Data export methods
    async exportData() {
        try {
            const members = await this.getMembers();
            const contributions = await this.getContributions();
            const withdrawals = await this.getWithdrawals();
            const settings = await this.getSettings();
            
            return {
                members,
                contributions,
                withdrawals,
                settings,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
        } catch (error) {
            console.error('Error exporting data:', error);
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
        lastLogin: sessionStorage.getItem('welfare_lastLogin')
    };
}

function clearUserSession() {
    sessionStorage.removeItem('welfare_loggedIn');
    sessionStorage.removeItem('welfare_username');
    sessionStorage.removeItem('welfare_lastLogin');
}

// Debug utilities
async function debugDatabase() {
    console.log('=== DATABASE DEBUG INFO ===');
    
    try {
        const members = await WelfareDB.getMembers();
        const contributions = await WelfareDB.getContributions();
        const withdrawals = await WelfareDB.getWithdrawals();
        
        console.log('Members count:', Object.keys(members).length);
        console.log('Contributions count:', Object.keys(contributions).length);
        console.log('Withdrawals count:', Object.keys(withdrawals).length);
        
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
