// Check authentication
if (!checkAuth()) {
    window.location.href = 'index.html';
}

// Set welcome message
document.getElementById('welcomeMessage').textContent = 
    `Welcome, ${sessionStorage.getItem('welfare_username') || 'Admin'}`;

let members = {};
let contributions = {};
let withdrawals = {};
let availableBalance = 0;

// Initialize withdrawals page
async function initializeWithdrawals() {
    try {
        console.log('Initializing withdrawals page...');
        
        await loadAllData();
        setupRealtimeListeners();
        updateBalanceDisplay();
        
        console.log('Withdrawals page initialized successfully');
        
    } catch (error) {
        console.error('Error initializing withdrawals page:', error);
        showToast('Error loading withdrawals data', 'error');
    }
}

// Load all required data
async function loadAllData() {
    try {
        console.log('Loading all data for withdrawals...');
        
        members = await WelfareDB.getMembers();
        contributions = await WelfareDB.getContributions();
        withdrawals = await WelfareDB.getWithdrawals();
        
        console.log('Data loaded - Members:', Object.keys(members).length, 
                   'Contributions:', Object.keys(contributions).length,
                   'Withdrawals:', Object.keys(withdrawals).length);
        
        calculateAvailableBalance();
        renderWithdrawalsTable();
        updateSummaryCards();
        
    } catch (error) {
        console.error('Error loading data:', error);
        throw error;
    }
}

// Calculate available balance
function calculateAvailableBalance() {
    // Total contributions
    const totalContributions = Object.values(contributions).reduce((sum, contribution) => {
        return sum + (parseFloat(contribution.amount) || 0);
    }, 0);
    
    // Total withdrawals
    const totalWithdrawals = Object.values(withdrawals).reduce((sum, withdrawal) => {
        return sum + (parseFloat(withdrawal.amount) || 0);
    }, 0);
    
    availableBalance = totalContributions - totalWithdrawals;
    console.log('Balance calculated - Total:', totalContributions, 'Withdrawn:', totalWithdrawals, 'Available:', availableBalance);
}

// Set up real-time listeners
function setupRealtimeListeners() {
    console.log('Setting up real-time listeners for withdrawals...');
    
    WelfareDB.onContributionsChange((newContributions) => {
        console.log('Contributions updated in real-time');
        contributions = newContributions || {};
        calculateAvailableBalance();
        updateBalanceDisplay();
    });

    WelfareDB.onWithdrawalsChange((newWithdrawals) => {
        console.log('Withdrawals updated in real-time');
        withdrawals = newWithdrawals || {};
        calculateAvailableBalance();
        updateBalanceDisplay();
        renderWithdrawalsTable();
        updateSummaryCards();
    });
}

// Update balance display
function updateBalanceDisplay() {
    const balanceElement = document.getElementById('availableBalanceWithdraw');
    const displayElement = document.getElementById('availableBalanceDisplay');
    
    balanceElement.textContent = `GH₵ ${availableBalance.toFixed(2)}`;
    if (displayElement) {
        displayElement.textContent = `GH₵ ${availableBalance.toFixed(2)}`;
    }
    
    // Update balance color based on amount
    if (availableBalance < 0) {
        balanceElement.style.color = '#e74c3c';
    } else if (availableBalance < 1000) {
        balanceElement.style.color = '#f39c12';
    } else {
        balanceElement.style.color = '#27ae60';
    }
}

// Render withdrawals table
function renderWithdrawalsTable() {
    const tbody = document.getElementById('withdrawalsTableBody');
    const loadingState = document.getElementById('loadingState');
    const tableContainer = document.getElementById('tableContainer');
    
    const withdrawalsArray = Object.values(withdrawals);
    
    if (withdrawalsArray.length === 0) {
        loadingState.innerHTML = 'No withdrawals found. Make your first withdrawal!';
        tableContainer.style.display = 'none';
        return;
    }
    
    // Sort by date (newest first)
    withdrawalsArray.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    loadingState.style.display = 'none';
    tableContainer.style.display = 'block';
    
    tbody.innerHTML = withdrawalsArray.map(withdrawal => {
        const withdrawalDate = new Date(withdrawal.timestamp);
        const amount = parseFloat(withdrawal.amount || 0);
        const purpose = withdrawal.purpose || withdrawal.reason || 'Not specified';
        const beneficiary = withdrawal.beneficiary || 'Not specified';
        const paymentMethod = withdrawal.paymentMethod || 'Cash';
        const processedBy = withdrawal.processedBy || 'Admin';
        const status = withdrawal.status || 'completed';
        
        return `
            <tr>
                <td>${withdrawalDate.toLocaleDateString()}<br><small>${withdrawalDate.toLocaleTimeString()}</small></td>
                <td><small>${withdrawal.id.substring(0, 8)}...</small></td>
                <td><strong class="withdrawal-amount">GH₵ ${amount.toFixed(2)}</strong></td>
                <td>${purpose}</td>
                <td>${beneficiary}</td>
                <td>${paymentMethod}</td>
                <td>${processedBy}</td>
                <td><span class="status-${status}">${status}</span></td>
                <td>
                    <button class="btn-secondary" onclick="viewWithdrawalDetails('${withdrawal.id}')">👁️ View</button>
                    <button class="btn-danger" onclick="deleteWithdrawal('${withdrawal.id}')">🗑️ Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Update summary cards
function updateSummaryCards() {
    const withdrawalsArray = Object.values(withdrawals);
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    // Total withdrawals
    const totalWithdrawals = withdrawalsArray.reduce((sum, withdrawal) => {
        return sum + (parseFloat(withdrawal.amount) || 0);
    }, 0);
    
    // This month's withdrawals
    const monthWithdrawals = withdrawalsArray.reduce((sum, withdrawal) => {
        const withdrawalDate = new Date(withdrawal.timestamp);
        if (withdrawalDate.getMonth() + 1 === currentMonth && 
            withdrawalDate.getFullYear() === currentYear) {
            return sum + (parseFloat(withdrawal.amount) || 0);
        }
        return sum;
    }, 0);
    
    // This year's withdrawals
    const yearWithdrawals = withdrawalsArray.reduce((sum, withdrawal) => {
        const withdrawalDate = new Date(withdrawal.timestamp);
        if (withdrawalDate.getFullYear() === currentYear) {
            return sum + (parseFloat(withdrawal.amount) || 0);
        }
        return sum;
    }, 0);
    
    document.getElementById('totalWithdrawals').textContent = `GH₵ ${totalWithdrawals.toFixed(2)}`;
    document.getElementById('monthWithdrawals').textContent = `GH₵ ${monthWithdrawals.toFixed(2)}`;
    document.getElementById('yearWithdrawals').textContent = `GH₵ ${yearWithdrawals.toFixed(2)}`;
}

// Show new withdrawal modal
function showNewWithdrawalModal() {
    // Reset form
    document.getElementById('newWithdrawalForm').reset();
    
    // Update balance display
    updateBalanceDisplay();
    
    // Reset warnings
    document.getElementById('balanceWarning').style.display = 'none';
    document.getElementById('withdrawalAmount').style.borderColor = '';
    
    // Set up amount change listener
    const amountInput = document.getElementById('withdrawalAmount');
    amountInput.addEventListener('input', updateWithdrawalSummary);
    
    document.getElementById('newWithdrawalModal').style.display = 'block';
    document.getElementById('withdrawalAmount').focus();
}

// Close new withdrawal modal
function closeNewWithdrawalModal() {
    document.getElementById('newWithdrawalModal').style.display = 'none';
    document.getElementById('newWithdrawalForm').reset();
    
    // Remove event listener
    const amountInput = document.getElementById('withdrawalAmount');
    amountInput.removeEventListener('input', updateWithdrawalSummary);
}

// Update withdrawal summary in real-time
function updateWithdrawalSummary() {
    const amountInput = document.getElementById('withdrawalAmount');
    const amount = parseFloat(amountInput.value) || 0;
    const warningElement = document.getElementById('balanceWarning');
    
    // Update summary
    document.getElementById('summaryAmount').textContent = `GH₵ ${amount.toFixed(2)}`;
    document.getElementById('summaryRemaining').textContent = `GH₵ ${(availableBalance - amount).toFixed(2)}`;
    
    // Check if sufficient funds
    if (amount > availableBalance) {
        warningElement.style.display = 'block';
        amountInput.style.borderColor = '#e74c3c';
        document.getElementById('submitWithdrawalBtn').disabled = true;
    } else {
        warningElement.style.display = 'none';
        amountInput.style.borderColor = '';
        document.getElementById('submitWithdrawalBtn').disabled = false;
    }
    
    // Color code remaining balance
    const remainingBalance = availableBalance - amount;
    const remainingElement = document.getElementById('summaryRemaining');
    if (remainingBalance < 0) {
        remainingElement.style.color = '#e74c3c';
    } else if (remainingBalance < 1000) {
        remainingElement.style.color = '#f39c12';
    } else {
        remainingElement.style.color = '#27ae60';
    }
}

// Process new withdrawal
async function processNewWithdrawal() {
    const amount = parseFloat(document.getElementById('withdrawalAmount').value);
    const purpose = document.getElementById('withdrawalPurpose').value;
    const beneficiary = document.getElementById('withdrawalBeneficiary').value.trim();
    const paymentMethod = document.getElementById('withdrawalMethod').value;
    const notes = document.getElementById('withdrawalNotes').value.trim();

    // Validation
    if (!amount || !purpose || !beneficiary || !paymentMethod) {
        showToast('Please fill in all required fields.', 'error');
        return;
    }

    if (amount <= 0) {
        showToast('Please enter a valid amount greater than 0.', 'error');
        return;
    }

    if (amount > availableBalance) {
        showToast('Insufficient funds for this withdrawal.', 'error');
        return;
    }

    const submitBtn = document.getElementById('submitWithdrawalBtn');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';

        const withdrawalData = {
            amount: amount,
            purpose: purpose,
            beneficiary: beneficiary,
            paymentMethod: paymentMethod,
            notes: notes,
            timestamp: new Date().toISOString(),
            processedBy: sessionStorage.getItem('welfare_username') || 'Admin',
            status: 'completed'
        };

        console.log('Processing new withdrawal:', withdrawalData);
        const withdrawalId = await WelfareDB.addWithdrawal(withdrawalData);
        console.log('Withdrawal processed successfully:', withdrawalId);
        
        // Close modal and reset form
        closeNewWithdrawalModal();
        showToast(`Withdrawal of GH₵ ${amount.toFixed(2)} processed successfully!`, 'success');
        
    } catch (error) {
        console.error('Error processing withdrawal:', error);
        showToast('Error processing withdrawal: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// View withdrawal details
function viewWithdrawalDetails(withdrawalId) {
    const withdrawal = withdrawals[withdrawalId];
    if (withdrawal) {
        const details = `
Withdrawal Details:
-------------------
ID: ${withdrawal.id}
Amount: GH₵ ${parseFloat(withdrawal.amount).toFixed(2)}
Purpose: ${withdrawal.purpose || withdrawal.reason}
Beneficiary: ${withdrawal.beneficiary}
Payment Method: ${withdrawal.paymentMethod}
Processed By: ${withdrawal.processedBy}
Date: ${new Date(withdrawal.timestamp).toLocaleString()}
Status: ${withdrawal.status}
${withdrawal.notes ? `Notes: ${withdrawal.notes}` : ''}
        `;
        alert(details);
    }
}

// Delete withdrawal
function deleteWithdrawal(withdrawalId) {
    const withdrawal = withdrawals[withdrawalId];
    if (withdrawal && confirm(`Are you sure you want to delete this withdrawal of GH₵ ${parseFloat(withdrawal.amount).toFixed(2)}? This action cannot be undone.`)) {
        database.ref('withdrawals/' + withdrawalId).remove()
            .then(() => {
                showToast('Withdrawal deleted successfully', 'success');
            })
            .catch(error => {
                console.error('Error deleting withdrawal:', error);
                showToast('Error deleting withdrawal', 'error');
            });
    }
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('welfare_loggedIn');
        sessionStorage.removeItem('welfare_username');
        sessionStorage.removeItem('welfare_lastLogin');
        window.location.href = 'index.html';
    }
}

// Event listeners
document.getElementById('newWithdrawalForm').addEventListener('submit', function(e) {
    e.preventDefault();
    processNewWithdrawal();
});

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('newWithdrawalModal');
    if (event.target === modal) {
        closeNewWithdrawalModal();
    }
}

// Initialize withdrawals when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing withdrawals page...');
    initializeWithdrawals();
});
