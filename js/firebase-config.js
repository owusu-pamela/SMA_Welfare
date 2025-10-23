// Shared Firebase Configuration
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

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
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
        const snapshot = await database.ref('members').once('value');
        return snapshot.val() || {};
    },

    async addMember(memberData) {
        const memberId = 'member_' + Date.now();
        await database.ref('members/' + memberId).set({
            ...memberData,
            id: memberId,
            createdAt: new Date().toISOString()
        });
        return memberId;
    },

    async updateMember(memberId, updates) {
        await database.ref('members/' + memberId).update(updates);
    },

    // Contributions operations
    async getContributions() {
        const snapshot = await database.ref('contributions').once('value');
        return snapshot.val() || {};
    },

    async addContribution(contributionData) {
        const contributionId = 'contribution_' + Date.now();
        await database.ref('contributions/' + contributionId).set({
            ...contributionData,
            id: contributionId,
            timestamp: new Date().toISOString()
        });
        return contributionId;
    },

    // Withdrawals operations
    async getWithdrawals() {
        const snapshot = await database.ref('withdrawals').once('value');
        return snapshot.val() || {};
    },

    async addWithdrawal(withdrawalData) {
        const withdrawalId = 'withdrawal_' + Date.now();
        await database.ref('withdrawals/' + withdrawalId).set({
            ...withdrawalData,
            id: withdrawalId,
            timestamp: new Date().toISOString()
        });
        return withdrawalId;
    },

    // System settings
    async getSettings() {
        const snapshot = await database.ref('settings').once('value');
        return snapshot.val() || {};
    },

    // Real-time listeners
    onMembersChange(callback) {
        database.ref('members').on('value', (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    onContributionsChange(callback) {
        database.ref('contributions').on('value', (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    onWithdrawalsChange(callback) {
        database.ref('withdrawals').on('value', (snapshot) => {
            callback(snapshot.val() || {});
        });
    }
};
