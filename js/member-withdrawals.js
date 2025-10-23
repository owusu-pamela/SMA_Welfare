// Check authentication and role
if (!checkAuth() || sessionStorage.getItem('welfare_role') !== 'member') {
    window.location.href = 'index.html';
}

const memberId = sessionStorage.getItem('welfare_userId');
let memberData = {};
let contributions = {};
let withdrawals = {};
let withdrawalRequests = {};
let availableBalance = 0;

// Initialize member withdrawals
async function initializeMemberWithdrawals() {
    try {
        console.log('Initializing member withdrawals for:', memberId);
        
        await loadMemberData();
        await loadContributions();
        await loadWithdrawals();
        await loadWithdrawalRequests();
        
        calculateAvailableBalance();
        updateBalanceDisplay();
        renderWithdrawalsTable();
        
        console.log('Member withdrawals initialized successfully');
        
    } catch (error) {
        console.error('Error initializing member withdrawals:', error);
        showToast('Error loading withdrawals data', 'error');
    }
}

// Load member data
async function loadMemberData() {
    try {
        const members = await WelfareDB.getMembers();
        memberData = members[memberId];
        
        if (!memberData) {
            showToast('Member data not found', 'error');
            return;
        }
        
        document.getElementById('welcomeMessage').textContent = `Welcome, ${memberData.name}`;
        
    } catch (error) {
        console.error('Error loading member data:', error);
        throw error;
    }
}

// Load contributions
async function loadContributions() {
    try {
        contributions = await WelfareDB.getMemberContributions(memberId);
    } catch (error) {
        console.error('Error loading contributions:', error);
        throw error;
    }
}

// Load withdrawals
async function loadWithdrawals() {
    try {
        withdrawals = await WelfareDB.getMemberWithdrawals(memberId);
    } catch (error) {
        console.error('Error loading withdrawals:', error);
        throw error;
    }
}

// Load withdrawal requests
async function loadWithdrawalRequests() {
    try {
        withdrawalRequests = await WelfareDB.getWithdrawalRequests();
        // Filter for current member
        const memberRequests = {};
        Object.keys(withdrawalRequests).forEach(key => {
            if (withdrawalRequests[key].memberId === memberId) {
                memberRequests[key] = withdrawalRequests[key];
            }
        });
        withdrawalRequests = memberRequests;
        console.log('Withdrawal requests loaded:', Object.keys(withdrawalRequests).length);
    } catch (error) {
        console.error('Error loading withdrawal requests:', error);
        throw error;
    }
}

// Calculate available balance
function calculateAvailableBalance() {
    // Total contributions
    const totalContributions = Object.values(contributions).reduce((sum, contribution) => {
        return sum + (parseFloat(contribution.amount) || 0);
    }, 0);
    
    // Total withdrawals (approved requests)
    const totalWithdrawals = Object.values(withdrawals).reduce((sum, withdrawal) => {
        return sum + (parseFloat(withdrawal.amount) || 0);
    }, 0);
    
    // Pending withdrawal requests
    const pendingWithdrawals = Object.values(withdrawalRequests).reduce((sum, request) => {
        if (request.status === 'pending') {
            return sum + (parseFloat(request.amount) || 0);
        }
        return sum;
    }, 0);
    
    // Available balance (50% of total contributions minus withdrawals)
    availableBalance = Math.max(0, (totalContributions * 0.5) - totalWithdrawals - pendingWithdrawals);
    
    // Update display
    document.getElementById('totalContributionsBalance').textContent = `GH₵ ${totalContributions.toFixed(2)}`;
    document.getElementById('previousWithdrawals').textContent = `GH₵ ${totalWithdrawals.toFixed(2)}`;
    
    console.log('Balance calculated - Total:', totalContributions, 'Withdrawn:', totalWithdrawals, 'Pending:', pendingWithdrawals, 'Available:', availableBalance);
}

// Update balance display
function updateBalanceDisplay() {
    document.getElementById('availableWithdrawalBalance').textContent = `GH₵ ${availableBalance.toFixed(2)}`;
    document.getElementById('availableBalanceDisplay').textContent = `GH₵ ${availableBalance.toFixed(2)}`;
    
    // Color code based on amount
    const balanceElement = document.getElementById('availableWithdrawalBalance');
    if (availableBalance < 100) {
        balanceElement.style.color = '#e74c3c';
    } else if (availableBalance < 500) {
        balanceElement.style.color = '#f39c12';
    } else {
        balanceElement.style.color = '#27ae60';
    }
}

// Show withdrawal modal
function showWithdrawalModal() {
    // Check minimum eligibility
    if (availableBalance < 100) {
        showToast('Minimum withdrawal amount is GH₵ 100. Your available balance is insufficient.', 'error');
        return;
    }
    
    // Reset form
    document.getElementById('withdrawalForm').reset();
    document.getElementById('withdrawalAmount').max = Math.min(5000, availableBalance);
    
    updateWithdrawalSummary();
    
    document.getElementById('withdrawalModal').style.display = 'block';
    
    // Add event listeners
    document.getElementById('withdrawalAmount').addEventListener('input', updateWithdrawalSummary);
}

// Close withdrawal modal
function closeWithdrawalModal() {
    document.getElementById('withdrawalModal').style.display = 'none';
    document.getElementById('withdrawalForm').reset();
    
    // Remove event listeners
    document.getElementById('withdrawalAmount').removeEventListener('input', updateWithdrawalSummary);
}

// Set quick amount
function setQuickAmount(amount) {
    if (amount <= availableBalance) {
        document.getElementById('withdrawalAmount').value = amount;
        updateWithdrawalSummary();
        showWithdrawalModal();
    } else {
        showToast(`Requested amount (GH₵ ${amount}) exceeds your available balance`, 'error');
    }
}

// Update withdrawal summary
function updateWithdrawalSummary() {
    const amount = parseFloat(document.getElementById('withdrawalAmount').value) || 0;
    const warningElement = document.getElementById('balanceWarning');
    
    document.getElementById('summaryWithdrawalAmount').textContent = `GH₵ ${amount.toFixed(2)}`;
    document.getElementById('summaryRemainingBalance').textContent = `GH₵ ${(availableBalance - amount).toFixed(2)}`;
    
    // Check if sufficient funds
    if (amount > availableBalance) {
        warningElement.style.display = 'block';
        document.getElementById('withdrawalAmount').style.borderColor = '#e74c3c';
        document.getElementById('submitWithdrawalBtn').disabled = true;
    } else {
        warningElement.style.display = 'none';
        document.getElementById('withdrawalAmount').style.borderColor = '';
        document.getElementById('submitWithdrawalBtn').disabled = false;
    }
    
    // Color code remaining balance
    const remainingBalance = availableBalance - amount;
    const remainingElement = document.getElementById('summaryRemainingBalance');
    if (remainingBalance < 100) {
        remainingElement.style.color = '#e74c3c';
    } else if (remainingBalance < 500) {
        remainingElement.style.color = '#f39c12';
    } else {
        remainingElement.style.color = '#27ae60';
    }
}

// Submit withdrawal request
async function submitWithdrawalRequest() {
    const amount = parseFloat(document.getElementById('withdrawalAmount').value);
    const purpose = document.getElementById('withdrawalPurpose').value;
    const description = document.getElementById('withdrawalDescription').value.trim();
    const paymentMethod = document.getElementById('withdrawalPaymentMethod').value;
    const accountDetails = document.getElementById('withdrawalAccountDetails').value.trim();

    // Validation
    if (!amount || !purpose || !description || !paymentMethod || !accountDetails) {
        showToast('Please fill in all required fields.', 'error');
        return;
    }

    if (amount < 100 || amount > 5000) {
        showToast('Amount must be between GH₵ 100 and GH₵ 5,000', 'error');
        return;
    }

    if (amount > availableBalance) {
        showToast('Requested amount exceeds your available balance', 'error');
        return;
    }

    // Check minimum membership duration
    const joinDate = new Date(memberData.joinDate);
    const currentDate = new Date();
    const monthsAsMember = (currentDate.getFullYear() - joinDate.getFullYear()) * 12 + 
                          (currentDate.getMonth() - joinDate.getMonth());
    
    if (monthsAsMember < 3) {
        showToast('You need at least 3 months of membership to make withdrawals', 'error');
        return;
    }

    const submitBtn = document.getElementById('submitWithdrawalBtn');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        const requestData = {
            memberId: memberId,
            memberName: memberData.name,
            amount: amount,
            purpose: purpose,
            description: description,
            paymentMethod: paymentMethod,
            accountDetails: accountDetails,
            availableBalance: availableBalance,
            membershipDuration: monthsAsMember,
            submittedAt: new Date().toISOString(),
            status: 'pending'
        };

        await WelfareDB.submitWithdrawalRequest(requestData);
        
        closeWithdrawalModal();
        showToast('Withdrawal request submitted successfully! It will be processed within 3-5 working days.', 'success');
        
        // Reload data
        await loadWithdrawalRequests();
        calculateAvailableBalance();
        updateBalanceDisplay();
        renderWithdrawalsTable();
        
    } catch (error) {
        console.error('Error submitting withdrawal request:', error);
        showToast('Error submitting request: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Render withdrawals table
function renderWithdrawalsTable() {
    const tbody = document.getElementById('withdrawalsTableBody');
    const noWithdrawals = document.getElementById('noWithdrawals');
    
    // Combine withdrawals and withdrawal requests
    const allTransactions = [
        ...Object.values(withdrawals).map(w => ({ ...w, type: 'completed' })),
        ...Object.values(withdrawalRequests).map(r => ({ ...r, type: 'request' }))
    ];
    
    if (allTransactions.length === 0) {
        tbody.innerHTML = '';
        noWithdrawals.style.display = 'block';
        return;
    }
    
    noWithdrawals.style.display = 'none';
    
    // Sort by date descending
    allTransactions.sort((a, b) => {
        const dateA = new Date(a.timestamp || a.submittedAt);
        const dateB = new Date(b.timestamp || b.submittedAt);
        return dateB - dateA;
    });
    
    tbody.innerHTML = allTransactions.map(transaction => {
        const date = new Date(transaction.timestamp || transaction.submittedAt);
        const isRequest = transaction.type === 'request';
        
        return `
            <tr>
                <td>${date.toLocaleDateString()}</td>
                <td><strong class="${isRequest ? 'amount-pending' : 'amount'}">GH₵ ${parseFloat(transaction.amount).toFixed(2)}</strong></td>
                <td>${transaction.purpose}</td>
                <td>${transaction.paymentMethod}</td>
                <td>
                    ${isRequest ? 
                        `<span class="status-${transaction.status}">${transaction.status}</span>` :
                        `<span class="status-completed">completed</span>`
                    }
                </td>
                <td>${transaction.updatedAt ? new Date(transaction.updatedAt).toLocaleDateString() : '-'}</td>
                <td>
                    <button class="btn-secondary" onclick="viewTransactionDetails('${transaction.id}', ${isRequest})">
                        👁️ View
                    </button>
                    ${isRequest && transaction.status === 'pending' ? `
                        <button class="btn-danger" onclick="cancelWithdrawalRequest('${transaction.id}')">❌ Cancel</button>
                    ` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

// View transaction details
function viewTransactionDetails(transactionId, isRequest) {
    const transaction = isRequest ? withdrawalRequests[transactionId] : withdrawals[transactionId];
    if (transaction) {
        const details = `
${isRequest ? 'Withdrawal Request' : 'Withdrawal'} Details:
--------------------------------
${isRequest ? 'Request ID' : 'Transaction ID'}: ${transaction.id}
Amount: GH₵ ${parseFloat(transaction.amount).toFixed(2)}
Purpose: ${transaction.purpose}
${isRequest ? `Description: ${transaction.description}` : ''}
Payment Method: ${transaction.paymentMethod}
Account Details: ${transaction.accountDetails}
Status: ${transaction.status}
Date: ${new Date(transaction.timestamp || transaction.submittedAt).toLocaleString()}
${transaction.updatedAt ? `Last Updated: ${new Date(transaction.updatedAt).toLocaleString()}` : ''}
${transaction.processedBy ? `Processed By: ${transaction.processedBy}` : ''}
${transaction.adminNotes ? `Admin Notes: ${transaction.adminNotes}` : ''}
        `;
        alert(details);
    }
}

// Cancel withdrawal request
function cancelWithdrawalRequest(requestId) {
    const request = withdrawalRequests[requestId];
    if (request && request.status === 'pending') {
        if (confirm('Are you sure you want to cancel this withdrawal request?')) {
            WelfareDB.updateWithdrawalRequest(requestId, {
                status: 'cancelled',
                cancelledAt: new Date().toISOString(),
                cancelledBy: 'Member'
            })
            .then(() => {
                showToast('Withdrawal request cancelled successfully', 'success');
                // Reload data
                loadWithdrawalRequests().then(() => {
                    calculateAvailableBalance();
                    updateBalanceDisplay();
                    renderWithdrawalsTable();
                });
            })
            .catch(error => {
                console.error('Error cancelling withdrawal request:', error);
                showToast('Error cancelling request', 'error');
            });
        }
    }
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
document.getElementById('withdrawalForm').addEventListener('submit', function(e) {
    e.preventDefault();
    submitWithdrawalRequest();
});

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('withdrawalModal');
    if (event.target === modal) {
        closeWithdrawalModal();
    }
}

// Initialize withdrawals when page loads
document.addEventListener('DOMContentLoaded', initializeMemberWithdrawals);
