// Check authentication and role
if (!checkAuth() || !checkAdmin()) {
    window.location.href = 'index.html';
}

let members = {};
let contributions = {};
let withdrawals = {};
let currentWithdrawalId = null;
let bulkWithdrawals = [];

// Initialize withdrawals management
async function initializeWithdrawals() {
    try {
        console.log('Initializing withdrawals management...');
        
        await loadWithdrawalData();
        setupRealtimeListeners();
        
        updateSystemBalance();
        updateWithdrawalStats();
        renderWithdrawalsTables();
        populateMemberDropdown();
        
        console.log('Withdrawals management initialized successfully');
        
    } catch (error) {
        console.error('Error initializing withdrawals:', error);
        showToast('Error loading withdrawal data', 'error');
    }
}

// Load withdrawal data
async function loadWithdrawalData() {
    try {
        members = await WelfareDB.getMembers();
        contributions = await WelfareDB.getContributions();
        withdrawals = await WelfareDB.getWithdrawals();
        
        console.log('Withdrawal data loaded:', {
            members: Object.keys(members).length,
            contributions: Object.keys(contributions).length,
            withdrawals: Object.keys(withdrawals).length
        });
        
    } catch (error) {
        console.error('Error loading withdrawal data:', error);
        throw error;
    }
}

// Set up real-time listeners
function setupRealtimeListeners() {
    WelfareDB.onContributionsChange((newContributions) => {
        contributions = newContributions;
        updateSystemBalance();
    });

    WelfareDB.onWithdrawalsChange((newWithdrawals) => {
        withdrawals = newWithdrawals;
        updateSystemBalance();
        updateWithdrawalStats();
        renderWithdrawalsTables();
    });
}

// Update system balance
function updateSystemBalance() {
    // Calculate total contributions
    const totalContributions = Object.values(contributions).reduce((sum, contribution) => {
        return sum + (parseFloat(contribution.amount) || 0);
    }, 0);
    
    // Calculate total withdrawals
    const totalWithdrawals = Object.values(withdrawals)
        .filter(w => w.status === 'completed' || w.status === 'approved')
        .reduce((sum, withdrawal) => {
            return sum + (parseFloat(withdrawal.amount) || 0);
        }, 0);
    
    // Calculate available balance
    const availableBalance = totalContributions - totalWithdrawals;
    
    // Calculate withdrawal reserve (50% of contributions)
    const withdrawalReserve = totalContributions * 0.5;
    
    // Update balance display
    document.getElementById('totalContributions').textContent = `GH₵ ${totalContributions.toFixed(2)}`;
    document.getElementById('availableBalance').textContent = `GH₵ ${availableBalance.toFixed(2)}`;
    document.getElementById('withdrawalReserve').textContent = `GH₵ ${withdrawalReserve.toFixed(2)}`;
    document.getElementById('totalWithdrawals').textContent = `GH₵ ${totalWithdrawals.toFixed(2)}`;
    
    // Update progress bars
    const withdrawalCapacity = Math.min((availableBalance / withdrawalReserve) * 100, 100);
    const reserveUtilization = (totalWithdrawals / withdrawalReserve) * 100;
    
    document.getElementById('withdrawalCapacityBar').style.width = `${withdrawalCapacity}%`;
    document.getElementById('withdrawalCapacityText').textContent = `${withdrawalCapacity.toFixed(1)}%`;
    
    document.getElementById('reserveUtilizationBar').style.width = `${reserveUtilization}%`;
    document.getElementById('reserveUtilizationText').textContent = `${reserveUtilization.toFixed(1)}%`;
    
    // Update last updated timestamp
    document.getElementById('balanceLastUpdated').textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
}

// Update withdrawal statistics
function updateWithdrawalStats() {
    const withdrawalsArray = Object.values(withdrawals);
    const today = new Date().toDateString();
    
    // Pending withdrawals
    const pendingWithdrawals = withdrawalsArray.filter(w => w.status === 'pending');
    const pendingAmount = pendingWithdrawals.reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0);
    document.getElementById('pendingWithdrawals').textContent = pendingWithdrawals.length;
    document.getElementById('pendingAmount').textContent = `GH₵ ${pendingAmount.toFixed(2)}`;
    
    // Approved today
    const approvedToday = withdrawalsArray.filter(w => 
        w.status === 'approved' && new Date(w.approvedAt).toDateString() === today
    );
    const approvedAmountToday = approvedToday.reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0);
    document.getElementById('approvedToday').textContent = approvedToday.length;
    document.getElementById('approvedAmountToday').textContent = `GH₵ ${approvedAmountToday.toFixed(2)}`;
    
    // This month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyWithdrawals = withdrawalsArray.filter(w => {
        const withdrawalDate = new Date(w.timestamp || w.approvedAt || w.completedAt);
        return withdrawalDate.getMonth() === currentMonth && withdrawalDate.getFullYear() === currentYear;
    });
    const monthlyAmount = monthlyWithdrawals.reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0);
    document.getElementById('monthlyWithdrawals').textContent = monthlyWithdrawals.length;
    document.getElementById('monthlyAmount').textContent = `GH₵ ${monthlyAmount.toFixed(2)}`;
    
    // Average withdrawal
    const completedWithdrawals = withdrawalsArray.filter(w => w.status === 'completed');
    const totalCompletedAmount = completedWithdrawals.reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0);
    const averageWithdrawal = completedWithdrawals.length > 0 ? totalCompletedAmount / completedWithdrawals.length : 0;
    document.getElementById('averageWithdrawal').textContent = `GH₵ ${averageWithdrawal.toFixed(2)}`;
}

// Render withdrawals tables
function renderWithdrawalsTables() {
    renderPendingWithdrawals();
    renderApprovedWithdrawals();
    renderRejectedWithdrawals();
    renderCompletedWithdrawals();
    renderAllWithdrawals();
    updateRecentWithdrawals();
}

// Render pending withdrawals
function renderPendingWithdrawals() {
    const container = document.getElementById('pendingWithdrawalsTable');
    const pendingWithdrawals = Object.values(withdrawals)
        .filter(w => w.status === 'pending')
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (pendingWithdrawals.length === 0) {
        container.innerHTML = '<tr><td colspan="8" class="no-data">No pending withdrawals</td></tr>';
        return;
    }
    
    container.innerHTML = pendingWithdrawals.map(withdrawal => {
        const member = members[withdrawal.memberId];
        const requestedDate = new Date(withdrawal.timestamp);
        
        return `
            <tr>
                <td><strong>${withdrawal.reference || withdrawal.id.substring(0, 8)}</strong></td>
                <td>
                    <div class="member-info">
                        <strong>${member?.name || 'Unknown Member'}</strong>
                        <small>${member?.staffId || 'N/A'}</small>
                    </div>
                </td>
                <td><strong>GH₵ ${parseFloat(withdrawal.amount).toFixed(2)}</strong></td>
                <td>
                    <span class="withdrawal-type ${withdrawal.type}">
                        ${formatWithdrawalType(withdrawal.type)}
                    </span>
                </td>
                <td>${requestedDate.toLocaleDateString()}</td>
                <td>${withdrawal.purpose?.substring(0, 50) || 'No purpose specified'}...</td>
                <td>
                    <span class="urgency-${withdrawal.urgency || 'normal'}">
                        ${(withdrawal.urgency || 'normal').toUpperCase()}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-primary" onclick="reviewWithdrawal('${withdrawal.id}')">👁️ Review</button>
                        <button class="btn-success" onclick="approveWithdrawal('${withdrawal.id}')">✅ Approve</button>
                        <button class="btn-danger" onclick="rejectWithdrawal('${withdrawal.id}')">❌ Reject</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Render approved withdrawals
function renderApprovedWithdrawals() {
    const container = document.getElementById('approvedWithdrawalsTable');
    const approvedWithdrawals = Object.values(withdrawals)
        .filter(w => w.status === 'approved')
        .sort((a, b) => new Date(b.approvedAt) - new Date(a.approvedAt));
    
    if (approvedWithdrawals.length === 0) {
        container.innerHTML = '<tr><td colspan="8" class="no-data">No approved withdrawals</td></tr>';
        return;
    }
    
    container.innerHTML = approvedWithdrawals.map(withdrawal => {
        const member = members[withdrawal.memberId];
        const approvedDate = new Date(withdrawal.approvedAt);
        
        return `
            <tr>
                <td><strong>${withdrawal.reference || withdrawal.id.substring(0, 8)}</strong></td>
                <td>${member?.name || 'Unknown Member'}</td>
                <td><strong>GH₵ ${parseFloat(withdrawal.amount).toFixed(2)}</strong></td>
                <td>
                    <span class="withdrawal-type ${withdrawal.type}">
                        ${formatWithdrawalType(withdrawal.type)}
                    </span>
                </td>
                <td>${approvedDate.toLocaleDateString()}</td>
                <td>${withdrawal.approvedBy || 'System'}</td>
                <td><span class="status-approved">Approved</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-primary" onclick="completeWithdrawal('${withdrawal.id}')">🏁 Complete</button>
                        <button class="btn-secondary" onclick="viewWithdrawalDetails('${withdrawal.id}')">📋 Details</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Render rejected withdrawals
function renderRejectedWithdrawals() {
    const container = document.getElementById('rejectedWithdrawalsTable');
    const rejectedWithdrawals = Object.values(withdrawals)
        .filter(w => w.status === 'rejected')
        .sort((a, b) => new Date(b.rejectedAt) - new Date(a.rejectedAt));
    
    if (rejectedWithdrawals.length === 0) {
        container.innerHTML = '<tr><td colspan="8" class="no-data">No rejected withdrawals</td></tr>';
        return;
    }
    
    container.innerHTML = rejectedWithdrawals.map(withdrawal => {
        const member = members[withdrawal.memberId];
        const rejectedDate = new Date(withdrawal.rejectedAt);
        
        return `
            <tr>
                <td><strong>${withdrawal.reference || withdrawal.id.substring(0, 8)}</strong></td>
                <td>${member?.name || 'Unknown Member'}</td>
                <td><strong>GH₵ ${parseFloat(withdrawal.amount).toFixed(2)}</strong></td>
                <td>
                    <span class="withdrawal-type ${withdrawal.type}">
                        ${formatWithdrawalType(withdrawal.type)}
                    </span>
                </td>
                <td>${rejectedDate.toLocaleDateString()}</td>
                <td>${withdrawal.rejectionReason || 'No reason provided'}</td>
                <td>${withdrawal.rejectedBy || 'System'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-secondary" onclick="viewWithdrawalDetails('${withdrawal.id}')">📋 Details</button>
                        <button class="btn-primary" onclick="reconsiderWithdrawal('${withdrawal.id}')">🔄 Reconsider</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Render completed withdrawals
function renderCompletedWithdrawals() {
    const container = document.getElementById('completedWithdrawalsTable');
    const completedWithdrawals = Object.values(withdrawals)
        .filter(w => w.status === 'completed')
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    
    if (completedWithdrawals.length === 0) {
        container.innerHTML = '<tr><td colspan="8" class="no-data">No completed withdrawals</td></tr>';
        return;
    }
    
    container.innerHTML = completedWithdrawals.map(withdrawal => {
        const member = members[withdrawal.memberId];
        const completedDate = new Date(withdrawal.completedAt);
        
        return `
            <tr>
                <td><strong>${withdrawal.reference || withdrawal.id.substring(0, 8)}</strong></td>
                <td>${member?.name || 'Unknown Member'}</td>
                <td><strong>GH₵ ${parseFloat(withdrawal.amount).toFixed(2)}</strong></td>
                <td>
                    <span class="withdrawal-type ${withdrawal.type}">
                        ${formatWithdrawalType(withdrawal.type)}
                    </span>
                </td>
                <td>${completedDate.toLocaleDateString()}</td>
                <td>${formatWithdrawalMethod(withdrawal.method)}</td>
                <td>${withdrawal.processedBy || 'System'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-secondary" onclick="viewWithdrawalDetails('${withdrawal.id}')">📋 Details</button>
                        <button class="btn-primary" onclick="generateWithdrawalReceipt('${withdrawal.id}')">🧾 Receipt</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Render all withdrawals
function renderAllWithdrawals() {
    const container = document.getElementById('allWithdrawalsTable');
    const dateFilter = document.getElementById('dateFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;
    
    let allWithdrawals = Object.values(withdrawals);
    
    // Apply date filter
    if (dateFilter !== 'all') {
        const now = new Date();
        allWithdrawals = allWithdrawals.filter(withdrawal => {
            const withdrawalDate = new Date(withdrawal.timestamp || withdrawal.approvedAt || withdrawal.completedAt);
            
            switch (dateFilter) {
                case 'today':
                    return withdrawalDate.toDateString() === now.toDateString();
                case 'week':
                    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
                    return withdrawalDate >= startOfWeek;
                case 'month':
                    return withdrawalDate.getMonth() === now.getMonth() && withdrawalDate.getFullYear() === now.getFullYear();
                case 'quarter':
                    const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
                    return withdrawalDate >= quarterStart;
                case 'year':
                    return withdrawalDate.getFullYear() === now.getFullYear();
                default:
                    return true;
            }
        });
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
        allWithdrawals = allWithdrawals.filter(withdrawal => withdrawal.type === typeFilter);
    }
    
    // Sort by date
    allWithdrawals.sort((a, b) => new Date(b.timestamp || b.approvedAt || b.completedAt) - new Date(a.timestamp || a.approvedAt || a.completedAt));
    
    if (allWithdrawals.length === 0) {
        container.innerHTML = '<tr><td colspan="9" class="no-data">No withdrawals found</td></tr>';
        return;
    }
    
    container.innerHTML = allWithdrawals.map(withdrawal => {
        const member = members[withdrawal.memberId];
        const withdrawalDate = new Date(withdrawal.timestamp || withdrawal.approvedAt || withdrawal.completedAt);
        
        return `
            <tr>
                <td><strong>${withdrawal.reference || withdrawal.id.substring(0, 8)}</strong></td>
                <td>${member?.name || 'Unknown Member'}</td>
                <td><strong>GH₵ ${parseFloat(withdrawal.amount).toFixed(2)}</strong></td>
                <td>
                    <span class="withdrawal-type ${withdrawal.type}">
                        ${formatWithdrawalType(withdrawal.type)}
                    </span>
                </td>
                <td><span class="status-${withdrawal.status}">${withdrawal.status}</span></td>
                <td>${withdrawalDate.toLocaleDateString()}</td>
                <td>${withdrawal.purpose?.substring(0, 30) || 'N/A'}...</td>
                <td>${formatWithdrawalMethod(withdrawal.method)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-secondary" onclick="viewWithdrawalDetails('${withdrawal.id}')">📋 Details</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Update recent withdrawals
function updateRecentWithdrawals() {
    const container = document.getElementById('recentWithdrawals');
    const recentWithdrawals = Object.values(withdrawals)
        .sort((a, b) => new Date(b.timestamp || b.approvedAt || b.completedAt) - new Date(a.timestamp || a.approvedAt || a.completedAt))
        .slice(0, 5);
    
    if (recentWithdrawals.length === 0) {
        container.innerHTML = '<div class="activity-item"><span class="activity-text">No recent withdrawals</span></div>';
        return;
    }
    
    container.innerHTML = recentWithdrawals.map(withdrawal => {
        const member = members[withdrawal.memberId];
        const withdrawalDate = new Date(withdrawal.timestamp || withdrawal.approvedAt || withdrawal.completedAt);
        
        return `
            <div class="activity-item">
                <span class="activity-text">
                    <strong>${member?.name || 'Unknown Member'}</strong> - GH₵ ${parseFloat(withdrawal.amount).toFixed(2)}
                </span>
                <small>${formatWithdrawalType(withdrawal.type)} • ${withdrawalDate.toLocaleDateString()}</small>
                <span class="status-${withdrawal.status}">${withdrawal.status}</span>
            </div>
        `;
    }).join('');
}

// Populate member dropdown
function populateMemberDropdown() {
    const dropdown = document.getElementById('withdrawalMember');
    const activeMembers = Object.values(members).filter(m => m.status === 'active');
    
    dropdown.innerHTML = '<option value="">Select Member</option>' +
        activeMembers.map(member => `
            <option value="${member.id}" data-staff-id="${member.staffId}">
                ${member.staffId} - ${member.name} (${member.department})
            </option>
        `).join('');
}

// Load member balance
function loadMemberBalance() {
    const memberId = document.getElementById('withdrawalMember').value;
    const member = members[memberId];
    
    if (!memberId || !member) {
        document.getElementById('memberBalanceInfo').style.display = 'none';
        return;
    }
    
    // Calculate member's total contributions
    const memberContributions = Object.values(contributions)
        .filter(c => c.memberId === memberId)
        .reduce((sum, contribution) => sum + (parseFloat(contribution.amount) || 0), 0);
    
    // Calculate member's total withdrawals
    const memberWithdrawals = Object.values(withdrawals)
        .filter(w => w.memberId === memberId && (w.status === 'completed' || w.status === 'approved'))
        .reduce((sum, withdrawal) => sum + (parseFloat(withdrawal.amount) || 0), 0);
    
    // Calculate available balance (50% of contributions minus withdrawals)
    const availableBalance = (memberContributions * 0.5) - memberWithdrawals;
    const maxWithdrawal = Math.max(0, availableBalance);
    
    // Update display
    document.getElementById('memberAvailableBalance').textContent = `GH₵ ${availableBalance.toFixed(2)}`;
    document.getElementById('memberTotalContributions').textContent = `GH₵ ${memberContributions.toFixed(2)}`;
    document.getElementById('memberPreviousWithdrawals').textContent = `GH₵ ${memberWithdrawals.toFixed(2)}`;
    document.getElementById('maxWithdrawalAmount').textContent = `GH₵ ${maxWithdrawal.toFixed(2)}`;
    
    document.getElementById('memberBalanceInfo').style.display = 'block';
    
    // Set maximum withdrawal amount
    document.getElementById('withdrawalAmount').max = maxWithdrawal;
}

// Validate withdrawal amount
function validateWithdrawalAmount() {
    const amount = parseFloat(document.getElementById('withdrawalAmount').value);
    const maxAmount = parseFloat(document.getElementById('withdrawalAmount').max);
    
    if (amount > maxAmount) {
        showToast(`Withdrawal amount cannot exceed GH₵ ${maxAmount.toFixed(2)}`, 'error');
        document.getElementById('withdrawalAmount').value = maxAmount;
    }
}

// Show new withdrawal modal
function showNewWithdrawalModal() {
    document.getElementById('newWithdrawalForm').reset();
    document.getElementById('memberBalanceInfo').style.display = 'none';
    
    // Add event listeners
    document.getElementById('withdrawalMethod').addEventListener('change', togglePaymentDetails);
    
    document.getElementById('newWithdrawalModal').style.display = 'block';
}

// Close new withdrawal modal
function closeNewWithdrawalModal() {
    document.getElementById('newWithdrawalModal').style.display = 'none';
    document.getElementById('withdrawalMethod').removeEventListener('change', togglePaymentDetails);
}

// Toggle payment details based on method
function togglePaymentDetails() {
    const method = document.getElementById('withdrawalMethod').value;
    
    document.getElementById('bankDetailsSection').style.display = method === 'bank_transfer' ? 'block' : 'none';
    document.getElementById('mobileMoneySection').style.display = method === 'mobile_money' ? 'block' : 'none';
}

// Process new withdrawal
async function processNewWithdrawal() {
    const memberId = document.getElementById('withdrawalMember').value;
    const member = members[memberId];
    
    if (!member) {
        showToast('Please select a member', 'error');
        return;
    }

    const withdrawalData = {
        memberId: memberId,
        memberName: member.name,
        amount: parseFloat(document.getElementById('withdrawalAmount').value),
        type: document.getElementById('withdrawalType').value,
        purpose: document.getElementById('withdrawalPurpose').value,
        method: document.getElementById('withdrawalMethod').value,
        urgency: document.getElementById('withdrawalUrgency').value,
        notes: document.getElementById('withdrawalNotes').value,
        requiresApproval: document.getElementById('requiresApproval').checked,
        status: document.getElementById('requiresApproval').checked ? 'pending' : 'approved',
        timestamp: new Date().toISOString(),
        requestedBy: sessionStorage.getItem('welfare_username') || 'Admin'
    };

    // Add payment details based on method
    if (withdrawalData.method === 'bank_transfer') {
        withdrawalData.bankDetails = document.getElementById('bankDetails').value;
    } else if (withdrawalData.method === 'mobile_money') {
        withdrawalData.mobileMoneyNumber = document.getElementById('mobileMoneyNumber').value;
    }

    try {
        // Validate member balance
        const memberContributions = Object.values(contributions)
            .filter(c => c.memberId === memberId)
            .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
        
        const memberWithdrawals = Object.values(withdrawals)
            .filter(w => w.memberId === memberId && (w.status === 'completed' || w.status === 'approved'))
            .reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0);
        
        const availableBalance = (memberContributions * 0.5) - memberWithdrawals;
        
        if (withdrawalData.amount > availableBalance) {
            showToast(`Insufficient balance. Maximum withdrawal: GH₵ ${availableBalance.toFixed(2)}`, 'error');
            return;
        }

        // Generate reference
        withdrawalData.reference = `WD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        // Add to Firebase
        await WelfareDB.addWithdrawal(withdrawalData);
        
        // Create notification for member
        await WelfareDB.addNotification({
            memberId: memberId,
            title: 'Withdrawal Request Submitted',
            message: `Your withdrawal request for GH₵ ${withdrawalData.amount.toFixed(2)} has been ${withdrawalData.requiresApproval ? 'submitted for approval' : 'approved'}`,
            type: 'withdrawal',
            priority: withdrawalData.urgency === 'emergency' ? 'high' : 'medium'
        });

        closeNewWithdrawalModal();
        showToast(`Withdrawal ${withdrawalData.requiresApproval ? 'submitted for approval' : 'approved'} successfully`, 'success');
        
    } catch (error) {
        console.error('Error processing withdrawal:', error);
        showToast('Error processing withdrawal: ' + error.message, 'error');
    }
}

// Review withdrawal
async function reviewWithdrawal(withdrawalId) {
    const withdrawal = withdrawals[withdrawalId];
    if (!withdrawal) {
        showToast('Withdrawal not found', 'error');
        return;
    }

    const member = members[withdrawal.memberId];
    currentWithdrawalId = withdrawalId;

    const reviewContent = `
        <div class="withdrawal-review">
            <div class="review-section">
                <h4>Withdrawal Details</h4>
                <div class="review-details">
                    <div class="detail-item">
                        <label>Reference:</label>
                        <span>${withdrawal.reference}</span>
                    </div>
                    <div class="detail-item">
                        <label>Amount:</label>
                        <span><strong>GH₵ ${parseFloat(withdrawal.amount).toFixed(2)}</strong></span>
                    </div>
                    <div class="detail-item">
                        <label>Type:</label>
                        <span>${formatWithdrawalType(withdrawal.type)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Purpose:</label>
                        <span>${withdrawal.purpose}</span>
                    </div>
                </div>
            </div>

            <div class="review-section">
                <h4>Member Information</h4>
                <div class="review-details">
                    <div class="detail-item">
                        <label>Name:</label>
                        <span>${member?.name || 'Unknown Member'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Staff ID:</label>
                        <span>${member?.staffId || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Department:</label>
                        <span>${member?.department || 'N/A'}</span>
                    </div>
                </div>
            </div>

            <div class="review-section">
                <h4>Payment Information</h4>
                <div class="review-details">
                    <div class="detail-item">
                        <label>Method:</label>
                        <span>${formatWithdrawalMethod(withdrawal.method)}</span>
                    </div>
                    ${withdrawal.bankDetails ? `
                    <div class="detail-item">
                        <label>Bank Details:</label>
                        <span>${withdrawal.bankDetails}</span>
                    </div>
                    ` : ''}
                    ${withdrawal.mobileMoneyNumber ? `
                    <div class="detail-item">
                        <label>Mobile Money:</label>
                        <span>${withdrawal.mobileMoneyNumber}</span>
                    </div>
                    ` : ''}
                </div>
            </div>

            <div class="review-section">
                <h4>Review Decision</h4>
                <form id="withdrawalDecisionForm">
                    <div class="form-group">
                        <label for="withdrawalDecision">Decision *</label>
                        <select id="withdrawalDecision" required>
                            <option value="">Select Decision</option>
                            <option value="approve">Approve Withdrawal</option>
                            <option value="reject">Reject Withdrawal</option>
                            <option value="modify">Modify Amount</option>
                        </select>
                    </div>
                    
                    <div class="form-group" id="rejectionReasonGroup" style="display: none;">
                        <label for="rejectionReason">Rejection Reason *</label>
                        <textarea id="rejectionReason" rows="3" placeholder="Provide reason for rejection"></textarea>
                    </div>
                    
                    <div class="form-group" id="modifiedAmountGroup" style="display: none;">
                        <label for="modifiedAmount">Modified Amount (GH₵)</label>
                        <input type="number" id="modifiedAmount" min="0" step="0.01" value="${withdrawal.amount}">
                    </div>
                    
                    <div class="form-group">
                        <label for="reviewNotes">Review Notes</label>
                        <textarea id="reviewNotes" rows="3" placeholder="Additional notes about this withdrawal"></textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="closeReviewWithdrawalModal()">Cancel</button>
                        <button type="submit" class="btn-primary">💾 Submit Decision</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('reviewWithdrawalContent').innerHTML = reviewContent;
    document.getElementById('reviewWithdrawalModal').style.display = 'block';
    
    // Add event listener for decision change
    document.getElementById('withdrawalDecision').addEventListener('change', function() {
        document.getElementById('rejectionReasonGroup').style.display = this.value === 'reject' ? 'block' : 'none';
        document.getElementById('modifiedAmountGroup').style.display = this.value === 'modify' ? 'block' : 'none';
    });
}

// Close review withdrawal modal
function closeReviewWithdrawalModal() {
    document.getElementById('reviewWithdrawalModal').style.display = 'none';
    currentWithdrawalId = null;
}

// Submit withdrawal decision
async function submitWithdrawalDecision() {
    const withdrawal = withdrawals[currentWithdrawalId];
    if (!withdrawal) {
        showToast('Withdrawal not found', 'error');
        return;
    }

    const decision = document.getElementById('withdrawalDecision').value;
    const notes = document.getElementById('reviewNotes').value;
    const adminName = sessionStorage.getItem('welfare_username') || 'Admin';

    try {
        if (decision === 'approve') {
            await WelfareDB.updateWithdrawal(currentWithdrawalId, {
                status: 'approved',
                approvedAt: new Date().toISOString(),
                approvedBy: adminName,
                reviewNotes: notes
            });

            // Create notification for member
            await WelfareDB.addNotification({
                memberId: withdrawal.memberId,
                title: 'Withdrawal Approved',
                message: `Your withdrawal of GH₵ ${parseFloat(withdrawal.amount).toFixed(2)} has been approved`,
                type: 'withdrawal_approval',
                priority: 'high'
            });

        } else if (decision === 'reject') {
            const rejectionReason = document.getElementById('rejectionReason').value;
            if (!rejectionReason) {
                showToast('Please provide a rejection reason', 'error');
                return;
            }

            await WelfareDB.updateWithdrawal(currentWithdrawalId, {
                status: 'rejected',
                rejectedAt: new Date().toISOString(),
                rejectedBy: adminName,
                rejectionReason: rejectionReason,
                reviewNotes: notes
            });

            // Create notification for member
            await WelfareDB.addNotification({
                memberId: withdrawal.memberId,
                title: 'Withdrawal Rejected',
                message: `Your withdrawal request has been rejected. Reason: ${rejectionReason}`,
                type: 'withdrawal_rejection',
                priority: 'medium'
            });

        } else if (decision === 'modify') {
            const modifiedAmount = parseFloat(document.getElementById('modifiedAmount').value);
            if (!modifiedAmount || modifiedAmount <= 0) {
                showToast('Please enter a valid amount', 'error');
                return;
            }

            await WelfareDB.updateWithdrawal(currentWithdrawalId, {
                amount: modifiedAmount,
                status: 'approved',
                approvedAt: new Date().toISOString(),
                approvedBy: adminName,
                reviewNotes: notes
            });

            // Create notification for member
            await WelfareDB.addNotification({
                memberId: withdrawal.memberId,
                title: 'Withdrawal Modified & Approved',
                message: `Your withdrawal has been modified to GH₵ ${modifiedAmount.toFixed(2)} and approved`,
                type: 'withdrawal_approval',
                priority: 'high'
            });
        }

        closeReviewWithdrawalModal();
        showToast(`Withdrawal ${decision} successfully`, 'success');
        
    } catch (error) {
        console.error('Error updating withdrawal:', error);
        showToast('Error processing withdrawal decision', 'error');
    }
}

// Utility functions
function formatWithdrawalType(type) {
    const types = {
        'savings': 'Savings Withdrawal',
        'emergency': 'Emergency Withdrawal',
        'welfare_payout': 'Welfare Payout',
        'loan_repayment': 'Loan Repayment',
        'other': 'Other'
    };
    return types[type] || type;
}

function formatWithdrawalMethod(method) {
    const methods = {
        'cash': 'Cash',
        'bank_transfer': 'Bank Transfer',
        'mobile_money': 'Mobile Money',
        'cheque': 'Cheque'
    };
    return methods[method] || method;
}

// Tab functionality
function openWithdrawalTab(tabName) {
    // Hide all tab content
    const tabContents = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove('active');
    }

    // Remove active class from all tab buttons
    const tabButtons = document.getElementsByClassName('tab-button');
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove('active');
    }

    // Show the specific tab content and add active class to the button
    document.getElementById(tabName).classList.add('active');
    event.currentTarget.classList.add('active');
}

// Filter withdrawals
function filterWithdrawals() {
    renderAllWithdrawals();
}

// Clear withdrawal filters
function clearWithdrawalFilters() {
    document.getElementById('dateFilter').value = 'all';
    document.getElementById('typeFilter').value = 'all';
    renderAllWithdrawals();
}

// Refresh balance
function refreshBalance() {
    updateSystemBalance();
    showToast('Balance refreshed', 'success');
}

// Generate withdrawal report
function generateWithdrawalReport() {
    showToast('PDF withdrawal report generation will be implemented in the next phase', 'info');
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
document.getElementById('newWithdrawalForm').addEventListener('submit', function(e) {
    e.preventDefault();
    processNewWithdrawal();
});

document.getElementById('withdrawalDecisionForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    submitWithdrawalDecision();
});

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = ['newWithdrawalModal', 'reviewWithdrawalModal', 'bulkWithdrawalModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target === modal) {
            if (modalId === 'newWithdrawalModal') closeNewWithdrawalModal();
            if (modalId === 'reviewWithdrawalModal') closeReviewWithdrawalModal();
            if (modalId === 'bulkWithdrawalModal') closeBulkWithdrawalModal();
        }
    });
}

// Initialize withdrawals when page loads
document.addEventListener('DOMContentLoaded', initializeWithdrawals);
