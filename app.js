// Firebase configuration
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
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Application State
let currentUser = null;
let members = [];
let contributions = [];
let withdrawals = [];

// DOM Elements
const loginModal = document.getElementById('loginModal');
const mainApp = document.getElementById('mainApp');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');

// Authentication
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        loginModal.classList.add('hidden');
        mainApp.classList.remove('hidden');
        loadData();
        setupReminders();
    } else {
        currentUser = null;
        loginModal.classList.remove('hidden');
        mainApp.classList.add('hidden');
    }
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    auth.signInWithEmailAndPassword(email, password)
        .catch((error) => {
            alert('Login failed: ' + error.message);
        });
});

logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

// Tab Navigation
document.querySelectorAll('.nav-btn').forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons and tabs
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        
        // Add active class to clicked button and corresponding tab
        button.classList.add('active');
        const tabId = button.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
    });
});

// Data Management
async function loadData() {
    await loadMembers();
    await loadContributions();
    await loadWithdrawals();
    updateDashboard();
}

async function loadMembers() {
    const snapshot = await db.collection('members').get();
    members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderMembers();
}

async function loadContributions() {
    const snapshot = await db.collection('contributions').get();
    contributions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderContributions();
}

async function loadWithdrawals() {
    const snapshot = await db.collection('withdrawals').get();
    withdrawals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderWithdrawals();
}

// Member Management
document.getElementById('addMemberBtn').addEventListener('click', () => {
    document.getElementById('memberModal').classList.remove('hidden');
});

document.getElementById('cancelMemberBtn').addEventListener('click', () => {
    document.getElementById('memberModal').classList.add('hidden');
});

document.getElementById('memberForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const memberData = {
        name: document.getElementById('memberName').value,
        monthlyContribution: parseFloat(document.getElementById('monthlyContribution').value),
        joinDate: new Date().toISOString(),
        status: 'active'
    };
    
    await db.collection('members').add(memberData);
    document.getElementById('memberForm').reset();
    document.getElementById('memberModal').classList.add('hidden');
    loadMembers();
});

function renderMembers() {
    const tbody = document.getElementById('membersList');
    tbody.innerHTML = '';
    
    members.forEach(member => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${member.name}</td>
            <td>GH₵ ${member.monthlyContribution.toFixed(2)}</td>
            <td>${new Date(member.joinDate).toLocaleDateString()}</td>
            <td class="status-${member.status}">${member.status}</td>
            <td>
                <button class="btn-primary" onclick="recordPayment('${member.id}')">Record Payment</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Contribution Management
async function recordPayment(memberId) {
    const member = members.find(m => m.id === memberId);
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const contributionData = {
        memberId: memberId,
        memberName: member.name,
        month: currentMonth,
        year: currentYear,
        amount: member.monthlyContribution,
        paymentDate: new Date().toISOString(),
        status: 'paid'
    };
    
    await db.collection('contributions').add(contributionData);
    loadContributions();
    updateDashboard();
}

function renderContributions() {
    const tbody = document.getElementById('contributionsList');
    tbody.innerHTML = '';
    
    const monthFilter = document.getElementById('monthFilter').value;
    const yearFilter = document.getElementById('yearFilter').value;
    
    let filteredContributions = contributions;
    if (monthFilter) {
        filteredContributions = filteredContributions.filter(c => c.month == monthFilter);
    }
    if (yearFilter) {
        filteredContributions = filteredContributions.filter(c => c.year == yearFilter);
    }
    
    filteredContributions.forEach(contribution => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${contribution.memberName}</td>
            <td>${getMonthName(contribution.month)} ${contribution.year}</td>
            <td>GH₵ ${contribution.amount.toFixed(2)}</td>
            <td>${new Date(contribution.paymentDate).toLocaleDateString()}</td>
            <td class="status-${contribution.status}">${contribution.status}</td>
        `;
        tbody.appendChild(row);
    });
}

// Withdrawal Management
document.getElementById('addWithdrawalBtn').addEventListener('click', () => {
    document.getElementById('withdrawalModal').classList.remove('hidden');
});

document.getElementById('cancelWithdrawalBtn').addEventListener('click', () => {
    document.getElementById('withdrawalModal').classList.add('hidden');
});

document.getElementById('withdrawalForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const totalContributions = contributions.reduce((sum, c) => sum + c.amount, 0);
    const totalWithdrawals = withdrawals.reduce((sum, w) => sum + w.amount, 0);
    const availableBalance = totalContributions - totalWithdrawals;
    const withdrawalAmount = parseFloat(document.getElementById('withdrawalAmount').value);
    
    if (withdrawalAmount > availableBalance) {
        alert('Insufficient funds!');
        return;
    }
    
    const withdrawalData = {
        amount: withdrawalAmount,
        reason: document.getElementById('withdrawalReason').value,
        date: new Date().toISOString(),
        processedBy: currentUser.email
    };
    
    await db.collection('withdrawals').add(withdrawalData);
    document.getElementById('withdrawalForm').reset();
    document.getElementById('withdrawalModal').classList.add('hidden');
    loadWithdrawals();
});

function renderWithdrawals() {
    const tbody = document.getElementById('withdrawalsList');
    tbody.innerHTML = '';
    
    withdrawals.forEach(withdrawal => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(withdrawal.date).toLocaleDateString()}</td>
            <td>GH₵ ${withdrawal.amount.toFixed(2)}</td>
            <td>${withdrawal.reason}</td>
            <td>${withdrawal.processedBy}</td>
        `;
        tbody.appendChild(row);
    });
}

// Dashboard Functions
function updateDashboard() {
    // Total Members
    document.getElementById('totalMembers').textContent = members.length;
    
    // Total Contributions
    const totalContributions = contributions.reduce((sum, c) => sum + c.amount, 0);
    document.getElementById('totalContributions').textContent = `GH₵ ${totalContributions.toFixed(2)}`;
    
    // Available Balance
    const totalWithdrawals = withdrawals.reduce((sum, w) => sum + w.amount, 0);
    const availableBalance = totalContributions - totalWithdrawals;
    document.getElementById('availableBalance').textContent = `GH₵ ${availableBalance.toFixed(2)}`;
}

// Reminder System
function setupReminders() {
    checkMonthlyPayments();
    // Check every day
    setInterval(checkMonthlyPayments, 24 * 60 * 60 * 1000);
}

function checkMonthlyPayments() {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const reminderList = document.getElementById('reminderList');
    
    reminderList.innerHTML = '';
    
    members.forEach(member => {
        const hasPaid = contributions.some(c => 
            c.memberId === member.id && 
            c.month === currentMonth && 
            c.year === currentYear
        );
        
        if (!hasPaid) {
            const reminderItem = document.createElement('div');
            reminderItem.className = 'reminder-item';
            reminderItem.textContent = `${member.name} has not paid for ${getMonthName(currentMonth)} ${currentYear}`;
            reminderList.appendChild(reminderItem);
        }
    });
}

// Utility Functions
function getMonthName(monthNumber) {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1];
}

// Event Listeners for Filters
document.getElementById('monthFilter').addEventListener('change', renderContributions);
document.getElementById('yearFilter').addEventListener('change', renderContributions);