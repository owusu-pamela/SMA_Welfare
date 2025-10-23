// Firebase Configuration - Fixed Version
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
// Add to existing WelfareDB object in firebase-config.js
async updateContribution(contributionId, updates) {
    try {
        await database.ref('contributions/' + contributionId).update(updates);
        console.log('Contribution updated successfully:', contributionId);
    } catch (error) {
        console.error('Error updating contribution:', error);
        throw error;
    }
},
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
        await database.ref('members/' + memberId).update(updates);
    },

    async deleteMember(memberId) {
        await database.ref('members/' + memberId).remove();
    },

    // Contributions operations
    async getContributions() {
        try {
            const snapshot = await database.ref('contributions').once('value');
            return snapshot.val() || {};
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
            return contributionId;
        } catch (error) {
            console.error('Error adding contribution:', error);
            throw error;
        }
    },

    // Withdrawals operations
    async getWithdrawals() {
        try {
            const snapshot = await database.ref('withdrawals').once('value');
            return snapshot.val() || {};
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
            return withdrawalId;
        } catch (error) {
            console.error('Error adding withdrawal:', error);
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
    }
};

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
