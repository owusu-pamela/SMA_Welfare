// Check authentication
if (!checkAuth()) {
    window.location.href = 'index.html';
}

// Set welcome message
document.getElementById('welcomeMessage').textContent = 
    `Welcome, ${sessionStorage.getItem('welfare_username') || 'Admin'}`;

let members = {};
let contributions = {};
let currentFilters = {
    month: '',
    year: new Date().getFullYear().toString(),
    member: ''
};

// Initialize contributions page
async function initializeContributions() {
    try {
        console.log('Initializing contributions page...');
        
        // Set current year as default
        document.getElementById('yearFilter').value = currentFilters.year;
        
        await loadMembers();
        await loadContributions();
        setupRealtimeListeners();
        populateMemberFilter();
        
        console.log('Contributions page initialized successfully');
        
    } catch (error) {
        console.error('Error initializing contributions page:', error);
        showToast('Error loading contributions data', 'error');
    }
}

// Load members from Firebase
async function loadMembers() {
    try {
        console.log('Loading members for contributions...');
        members = await WelfareDB.getMembers();
        console.log('Members loaded:', Object.keys(members).length);
        
        if (Object.keys(members).length === 0) {
            console.log('No members found in database');
            showToast('No members found. Please add members first.', 'warning');
        }
    } catch (error) {
        console.error('Error loading members:', error);
        showToast('Error loading members', 'error');
    }
}

// Load contributions from Firebase - FIXED VERSION
async function loadContributions() {
    try {
        console.log('Loading contributions...');
        const contributionsData = await WelfareDB.getContributions();
        console.log('Raw contributions data:', contributionsData);
        
        // Convert Firebase object to our contributions object
        contributions = contributionsData || {};
        
        console.log('Contributions loaded successfully. Count:', Object.keys(contributions).length);
        
        if (Object.keys(contributions).length === 0) {
            console.log('No contributions found in database');
            showToast('No contributions found. Record your first payment!', 'info');
        }
        
        applyFilters();
        
    } catch (error) {
        console.error('Error loading contributions:', error);
        showToast('Error loading contributions: ' + error.message, 'error');
    }
}

// Set up real-time listeners
function setupRealtimeListeners() {
    console.log('Setting up real-time listeners for contributions...');
    
    WelfareDB.onMembersChange((newMembers) => {
        console.log('Members updated in real-time');
        members = newMembers || {};
        populateMemberFilter();
        applyFilters(); // Re-apply filters to update display
    });

    WelfareDB.onContributionsChange((newContributions) => {
        console.log('Contributions updated in real-time');
        contributions = newContributions || {};
        applyFilters();
    });
}

// Populate member filter dropdown
function populateMemberFilter() {
    const memberFilter = document.getElementById('memberFilter');
    const paymentMember = document.getElementById('paymentMember');
    
    // Clear existing options except the first one
    while (memberFilter.options.length > 1) {
        memberFilter.remove(1);
    }
    while (paymentMember.options.length > 1) {
        paymentMember.remove(1);
    }
    
    // Check if we have members
    if (Object.keys(members).length === 0) {
        console.log('No members available for filter dropdown');
        return;
    }
    
    // Add member options
    Object.values(members).forEach(member => {
        if (member && member.name) {
            const option1 = document.createElement('option');
            option1.value = member.id;
            option1.textContent = `${member.name} (GH₵ ${parseFloat(member.monthlyContribution || 0).toFixed(2)})`;
            memberFilter.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = member.id;
            option2.textContent = `${member.name} - GH₵ ${parseFloat(member.monthlyContribution || 0).toFixed(2)}/month`;
            paymentMember.appendChild(option2);
        }
    });
    
    console.log('Member filter populated with', Object.keys(members).length, 'members');
}

// Apply filters to contributions - FIXED VERSION
function applyFilters() {
    console.log('Applying filters:', currentFilters);
    console.log('Available contributions:', Object.keys(contributions).length);
    
    // Convert contributions object to array and filter
    const contributionsArray = Object.values(contributions).filter(contribution => {
        if (!contribution) return false;
        
        // Month filter
        if (currentFilters.month && contribution.month != currentFilters.month) {
            return false;
        }
        
        // Year filter
        if (currentFilters.year && contribution.year != currentFilters.year) {
            return false;
        }
        
        // Member filter
        if (currentFilters.member && contribution.memberId != currentFilters.member) {
            return false;
        }
        
        return true;
    });
    
    console.log('Filtered contributions:', contributionsArray.length);
    renderContributionsTable(contributionsArray);
    updateSummaryCards(contributionsArray);
}

// Render contributions table - FIXED VERSION
function renderContributionsTable(contributionsArray) {
    const tbody = document.getElementById('contributionsTableBody');
    const loadingState = document.getElementById('loadingState');
    const tableContainer = document.getElementById('tableContainer');
    
    console.log('Rendering contributions table with', contributionsArray.length, 'records');
    
    if (contributionsArray.length === 0) {
        loadingState.innerHTML = 'No contributions found matching your filters.';
        tableContainer.style.display = 'none';
        return;
    }
    
    // Sort by date (newest first)
    contributionsArray.sort((a, b) => {
        const dateA = new Date(a.timestamp || a.paymentDate || Date.now());
        const dateB = new Date(b.timestamp || b.paymentDate || Date.now());
        return dateB - dateA;
    });
    
    loadingState.style.display = 'none';
    tableContainer.style.display = 'block';
    
    tbody.innerHTML = contributionsArray.map(contribution => {
        // Safely get member name
        let memberName = 'Unknown Member';
        if (contribution.memberId && members[contribution.memberId]) {
            memberName = members[contribution.memberId].name;
        } else if (contribution.memberName) {
            memberName = contribution.memberName;
        }
        
        const paymentDate = new Date(contribution.timestamp || contribution.paymentDate || Date.now());
        const amount = parseFloat(contribution.amount || 0);
        const month = contribution.month || new Date(paymentDate).getMonth() + 1;
        const year = contribution.year || new Date(paymentDate).getFullYear();
        const paymentMethod = contribution.paymentMethod || 'Cash';
        const recordedBy = contribution.recordedBy || 'Admin';
        
        return `
            <tr>
                <td>${paymentDate.toLocaleDateString()}<br><small>${paymentDate.toLocaleTimeString()}</small></td>
                <td><strong>${memberName}</strong></td>
                <td>${getMonthName(month)}</td>
                <td>${year}</td>
                <td><strong class="amount">GH₵ ${amount.toFixed(2)}</strong></td>
                <td>${paymentMethod}</td>
                <td>${recordedBy}</td>
                <td><span class="status-active">Paid</span></td>
                <td>
                    <button class="btn-secondary" onclick="editContribution('${contribution.id}')">✏️ Edit</button>
                    <button class="btn-danger" onclick="deleteContribution('${contribution.id}')">🗑️ Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Update summary cards - FIXED VERSION
function updateSummaryCards(contributionsArray) {
    const totalAmount = contributionsArray.reduce((sum, contribution) => {
        return sum + (parseFloat(contribution.amount || 0));
    }, 0);
    
    const averagePayment = contributionsArray.length > 0 ? totalAmount / contributionsArray.length : 0;
    
    document.getElementById('filteredTotal').textContent = `GH₵ ${totalAmount.toFixed(2)}`;
    document.getElementById('totalRecords').textContent = contributionsArray.length;
    document.getElementById('averagePayment').textContent = `GH₵ ${averagePayment.toFixed(2)}`;
    
    console.log('Summary updated - Total:', totalAmount, 'Records:', contributionsArray.length);
}

// Show record payment modal
function showRecordPaymentModal() {
    // Check if we have members
    if (Object.keys(members).length === 0) {
        showToast('No members available. Please add members first.', 'warning');
        return;
    }
    
    // Reset form and set default values
    document.getElementById('recordPaymentForm').reset();
    
    // Set current month and year as defaults
    const currentDate = new Date();
    document.getElementById('paymentMonth').value = currentDate.getMonth() + 1;
    document.getElementById('paymentYear').value = currentDate.getFullYear();
    
    // Populate member dropdown if not already populated
    if (document.getElementById('paymentMember').options.length <= 1) {
        populateMemberFilter();
    }
    
    document.getElementById('recordPaymentModal').style.display = 'block';
    document.getElementById('paymentMember').focus();
}

// Close record payment modal
function closeRecordPaymentModal() {
    document.getElementById('recordPaymentModal').style.display = 'none';
    document.getElementById('recordPaymentForm').reset();
}

// Handle member selection change in payment form
function setupPaymentFormListeners() {
    const paymentMember = document.getElementById('paymentMember');
    const paymentAmount = document.getElementById('paymentAmount');
    const suggestedAmount = document.getElementById('suggestedAmount');
    
    paymentMember.addEventListener('change', function() {
        const memberId = this.value;
        if (memberId && members[memberId]) {
            const member = members[memberId];
            const monthlyContribution = parseFloat(member.monthlyContribution || 0);
            
            // Set suggested amount
            paymentAmount.value = monthlyContribution;
            suggestedAmount.textContent = `Suggested: GH₵ ${monthlyContribution.toFixed(2)}`;
            suggestedAmount.style.display = 'block';
        } else {
            paymentAmount.value = '';
            suggestedAmount.style.display = 'none';
        }
    });
}

// Record new payment - FIXED VERSION
async function recordNewPayment() {
    const memberId = document.getElementById('paymentMember').value;
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const month = document.getElementById('paymentMonth').value;
    const year = document.getElementById('paymentYear').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const notes = document.getElementById('paymentNotes').value.trim();

    // Validation
    if (!memberId || !amount || !month || !year || !paymentMethod) {
        showToast('Please fill in all required fields.', 'error');
        return;
    }

    if (amount <= 0) {
        showToast('Please enter a valid amount greater than 0.', 'error');
        return;
    }

    const member = members[memberId];
    if (!member) {
        showToast('Selected member not found.', 'error');
        return;
    }

    const submitBtn = document.getElementById('submitPaymentBtn');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Recording...';

        // Check if payment already exists for this member, month, and year
        const existingPayment = Object.values(contributions).find(contribution => 
            contribution && 
            contribution.memberId === memberId && 
            contribution.month == month && 
            contribution.year == year
        );

        if (existingPayment) {
            const overwrite = confirm(`${member.name} already has a payment recorded for ${getMonthName(month)} ${year}. Do you want to overwrite it?`);
            if (!overwrite) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                return;
            }
        }

        const contributionData = {
            memberId: memberId,
            memberName: member.name,
            amount: amount,
            month: parseInt(month),
            year: parseInt(year),
            paymentMethod: paymentMethod,
            notes: notes,
            timestamp: new Date().toISOString(),
            recordedBy: sessionStorage.getItem('welfare_username') || 'Admin'
        };

        console.log('Recording new payment:', contributionData);
        const contributionId = await WelfareDB.addContribution(contributionData);
        console.log('Payment recorded successfully:', contributionId);
        
        // Close modal and reset form
        closeRecordPaymentModal();
        showToast(`Payment recorded successfully for ${member.name}`, 'success');
        
    } catch (error) {
        console.error('Error recording payment:', error);
        showToast('Error recording payment: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Edit contribution
function editContribution(contributionId) {
    const contribution = contributions[contributionId];
    if (contribution) {
        const newAmount = prompt(`Edit payment amount for ${contribution.memberName}:`, contribution.amount);
        if (newAmount && !isNaN(parseFloat(newAmount)) && parseFloat(newAmount) > 0) {
            // Use direct Firebase update since we don't have updateContribution in WelfareDB
            database.ref('contributions/' + contributionId).update({
                amount: parseFloat(newAmount),
                updatedAt: new Date().toISOString()
            })
            .then(() => {
                showToast('Payment updated successfully', 'success');
            })
            .catch(error => {
                console.error('Error updating payment:', error);
                showToast('Error updating payment', 'error');
            });
        }
    }
}

// Delete contribution
function deleteContribution(contributionId) {
    const contribution = contributions[contributionId];
    if (contribution && confirm(`Are you sure you want to delete this payment record for ${contribution.memberName}?`)) {
        database.ref('contributions/' + contributionId).remove()
            .then(() => {
                showToast('Payment record deleted successfully', 'success');
            })
            .catch(error => {
                console.error('Error deleting payment:', error);
                showToast('Error deleting payment record', 'error');
            });
    }
}

// Filter functions
function applyFiltersFromUI() {
    currentFilters.month = document.getElementById('monthFilter').value;
    currentFilters.year = document.getElementById('yearFilter').value;
    currentFilters.member = document.getElementById('memberFilter').value;
    
    applyFilters();
}

function clearFilters() {
    document.getElementById('monthFilter').value = '';
    document.getElementById('yearFilter').value = new Date().getFullYear().toString();
    document.getElementById('memberFilter').value = '';
    
    currentFilters.month = '';
    currentFilters.year = new Date().getFullYear().toString();
    currentFilters.member = '';
    
    applyFilters();
}

// Utility function
function getMonthName(monthNumber) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthNumber - 1] || 'Unknown';
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
document.getElementById('recordPaymentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    recordNewPayment();
});

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('recordPaymentModal');
    if (event.target === modal) {
        closeRecordPaymentModal();
    }
}

// Filter event listeners
document.getElementById('monthFilter').addEventListener('change', applyFiltersFromUI);
document.getElementById('yearFilter').addEventListener('change', applyFiltersFromUI);
document.getElementById('memberFilter').addEventListener('change', applyFiltersFromUI);

// Initialize contributions when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing contributions page...');
    initializeContributions();
    setupPaymentFormListeners();
});
