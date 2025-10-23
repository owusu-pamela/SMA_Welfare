// Check authentication
if (!checkAuth()) {
    window.location.href = 'index.html';
}

// Set welcome message
document.getElementById('welcomeMessage').textContent = 
    `Welcome, ${sessionStorage.getItem('welfare_username') || 'Admin'}`;

let members = {};
let contributions = {};

// Initialize members page
async function initializeMembers() {
    try {
        console.log('Initializing members page...');
        await loadMembers();
        await loadContributions();
        setupRealtimeUpdates();
    } catch (error) {
        console.error('Error initializing members page:', error);
        showToast('Error loading members data', 'error');
    }
}

// Load members from Firebase
async function loadMembers() {
    try {
        console.log('Loading members...');
        members = await WelfareDB.getMembers();
        console.log('Members loaded:', members);
        renderMembersTable();
    } catch (error) {
        console.error('Error loading members:', error);
        showToast('Error loading members', 'error');
    }
}

// Load contributions for calculations
async function loadContributions() {
    try {
        contributions = await WelfareDB.getContributions();
        console.log('Contributions loaded for calculations');
    } catch (error) {
        console.error('Error loading contributions:', error);
    }
}

// Set up real-time updates
function setupRealtimeListeners() {
    WelfareDB.onMembersChange((newMembers) => {
        console.log('Members updated in real-time:', newMembers);
        members = newMembers;
        renderMembersTable();
    });

    WelfareDB.onContributionsChange((newContributions) => {
        contributions = newContributions;
        renderMembersTable(); // Re-render to update total paid amounts
    });
}

// Render members table
function renderMembersTable() {
    const tbody = document.getElementById('membersTableBody');
    const loadingState = document.getElementById('loadingState');
    const tableContainer = document.getElementById('tableContainer');
    const membersArray = Object.values(members);
    
    if (membersArray.length === 0) {
        loadingState.innerHTML = 'No members found. Add your first member!';
        tableContainer.style.display = 'none';
        return;
    }
    
    loadingState.style.display = 'none';
    tableContainer.style.display = 'block';
    
    tbody.innerHTML = membersArray.map(member => `
        <tr>
            <td>${member.id.substring(0, 8)}...</td>
            <td><strong>${member.name}</strong>${member.email ? `<br><small>${member.email}</small>` : ''}</td>
            <td>GH₵ ${parseFloat(member.monthlyContribution || 0).toFixed(2)}</td>
            <td>${member.phone || 'N/A'}</td>
            <td>${new Date(member.createdAt).toLocaleDateString()}</td>
            <td><span class="status-${member.status || 'active'}">${member.status || 'active'}</span></td>
            <td><strong>GH₵ ${calculateTotalPaid(member.id).toFixed(2)}</strong></td>
            <td>
                <button class="btn-primary" onclick="recordPayment('${member.id}')">💳 Payment</button>
                <button class="btn-secondary" onclick="editMember('${member.id}')">✏️ Edit</button>
            </td>
        </tr>
    `).join('');
}

// Calculate total paid by member
function calculateTotalPaid(memberId) {
    return Object.values(contributions).reduce((sum, contribution) => {
        if (contribution.memberId === memberId) {
            return sum + (parseFloat(contribution.amount) || 0);
        }
        return sum;
    }, 0);
}

// Add new member
async function addNewMember() {
    const name = document.getElementById('memberName').value.trim();
    const email = document.getElementById('memberEmail').value.trim();
    const phone = document.getElementById('memberPhone').value.trim();
    const monthlyContribution = parseFloat(document.getElementById('monthlyContribution').value);

    if (!name || !phone || isNaN(monthlyContribution) || monthlyContribution <= 0) {
        showToast('Please fill in all required fields correctly.', 'error');
        return;
    }

    const submitBtn = document.getElementById('submitMemberBtn');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Adding...';

        const memberData = {
            name: name,
            email: email || '',
            phone: phone,
            monthlyContribution: monthlyContribution
        };

        console.log('Adding new member:', memberData);
        const memberId = await WelfareDB.addMember(memberData);
        console.log('Member added successfully:', memberId);
        
        // Close modal and reset form
        closeAddMemberModal();
        showToast('Member added successfully!', 'success');
        
    } catch (error) {
        console.error('Error adding member:', error);
        showToast('Error adding member: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Record payment for member
function recordPayment(memberId) {
    const member = members[memberId];
    if (member) {
        const amount = prompt(`Enter payment amount for ${member.name}:`, member.monthlyContribution);
        if (amount && !isNaN(parseFloat(amount))) {
            const contributionData = {
                memberId: memberId,
                memberName: member.name,
                amount: parseFloat(amount),
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear(),
                paymentMethod: 'Cash',
                notes: 'Quick payment from members page'
            };
            
            WelfareDB.addContribution(contributionData)
                .then(() => {
                    showToast(`Payment recorded for ${member.name}`, 'success');
                })
                .catch(error => {
                    console.error('Error recording payment:', error);
                    showToast('Error recording payment', 'error');
                });
        }
    }
}

// Edit member
function editMember(memberId) {
    const member = members[memberId];
    if (member) {
        const newName = prompt('Edit member name:', member.name);
        if (newName && newName.trim() !== '') {
            const newContribution = prompt('Edit monthly contribution:', member.monthlyContribution);
            if (newContribution && !isNaN(parseFloat(newContribution))) {
                WelfareDB.updateMember(memberId, {
                    name: newName.trim(),
                    monthlyContribution: parseFloat(newContribution)
                })
                .then(() => {
                    showToast('Member updated successfully', 'success');
                })
                .catch(error => {
                    console.error('Error updating member:', error);
                    showToast('Error updating member', 'error');
                });
            }
        }
    }
}

// Modal functions
function showAddMemberModal() {
    document.getElementById('addMemberModal').style.display = 'block';
    document.getElementById('memberName').focus();
}

function closeAddMemberModal() {
    document.getElementById('addMemberModal').style.display = 'none';
    document.getElementById('addMemberForm').reset();
}

// Form submission
document.getElementById('addMemberForm').addEventListener('submit', function(e) {
    e.preventDefault();
    addNewMember();
});

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('addMemberModal');
    if (event.target === modal) {
        closeAddMemberModal();
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

// Setup real-time listeners
function setupRealtimeUpdates() {
    WelfareDB.onMembersChange((newMembers) => {
        console.log('Real-time members update:', newMembers);
        members = newMembers;
        renderMembersTable();
    });

    WelfareDB.onContributionsChange((newContributions) => {
        contributions = newContributions;
        renderMembersTable();
    });
}

// Initialize members when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing members page...');
    initializeMembers();
});
