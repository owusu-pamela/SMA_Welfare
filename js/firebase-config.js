// Shared Firebase Configuration (Corrected)
const firebaseConfig = {
    apiKey: "AIzaSyCqVYJp4f_L2HYXSi7MHWKqMcMXmEUrd5Y",
    authDomain: "sunyani-municipal-welfare.firebaseapp.com",
    databaseURL: "https://sunyani-municipal-welfare-default-rtdb.firebaseio.com",
    projectId: "sunyani-municipal-welfare",
    storageBucket: "sunyani-municipal-welfare.appspot.com", // ✅ corrected
    messagingSenderId: "690980483755",
    appId: "1:690980483755:web:ce9bc7dcea698bd6d7fdee",
    measurementId: "G-KRG057K0VW"
};

// ✅ Initialize Firebase (for Firebase v8)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const database = firebase.database();

// ✅ Authentication check
function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('welfare_loggedIn');
    if (!isLoggedIn || isLoggedIn !== 'true') {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// ✅ Database operations with error handling
const WelfareDB = {
    // --- Members ---
    async getMembers() {
        try {
            const snapshot = await database.ref('members').once('value');
            return snapshot.val() || {};
        } catch (error) {
            console.error("Error fetching members:", error);
            return {};
        }
    },

    async addMember(memberData) {
        try {
            const memberId = 'member_' + Date.now();
            await database.ref('members/' + memberId).set({
                ...memberData,
                id: memberId,
                createdAt: new Date().toISOString()
            });
            console.log("✅ Member added successfully:", memberId);
            return memberId;
        } catch (error) {
            console.error("❌ Failed to add member:", error);
            alert("Failed to save member: " + error.message);
            throw error;
        }
    },

    async updateMember(memberId, updates) {
        try {
            await database.ref('members/' + memberId).update(updates);
            console.log("✅ Member updated:", memberId);
        } catch (error) {
            console.error("❌ Failed to update member:", error);
        }
    },

    // --- Contributions ---
    async getContributions() {
        try {
            const snapshot = await database.ref('contributions').once('value');
            return snapshot.val() || {};
        } catch (error) {
            console.error("Error fetching contributions:", error);
            return {};
        }
    },

    async addContribution(contributionData) {
        try {
            const contributionId = 'contribution_' + Date.now();
            await database.ref('contributions/' + contributionId).set({
                ...contributionData,
                id: contributionId,
                timestamp: new Date().toISOString()
            });
            console.log("✅ Contribution added:", contributionId);
            return contributionId;
        } catch (error) {
            console.error("❌ Failed to add contribution:", error);
            alert("Failed to save contribution: " + error.message);
            throw error;
        }
    },

    // --- Withdrawals ---
    async getWithdrawals() {
        try {
            const snapshot = await database.ref('withdrawals').once('value');
            return snapshot.val() || {};
        } catch (error) {
            console.error("Error fetching withdrawals:", error);
            return {};
        }
    },

    async addWithdrawal(withdrawalData) {
        try {
            const withdrawalId = 'withdrawal_' + Date.now();
            await database.ref('withdrawals/' + withdrawalId).set({
                ...withdrawalData,
                id: withdrawalId,
                timestamp: new Date().toISOString()
            });
            console.log("✅ Withdrawal added:", withdrawalId);
            return withdrawalId;
        } catch (error) {
            console.error("❌ Failed to add withdrawal:", error);
            alert("Failed to save withdrawal: " + error.message);
            throw error;
        }
    },

    // --- Settings ---
    async getSettings() {
        try {
            const snapshot = await database.ref('settings').once('value');
            return snapshot.val() || {};
        } catch (error) {
            console.error("Error fetching settings:", error);
            return {};
        }
    },

    // --- Real-time Listeners ---
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
