// Check authentication
if (!checkAuth()) {
    window.location.href = 'index.html';
}

let members = {};

// Initialize members page
async function initializeMembers() {
    try {
        await loadMembers();
        setupRealtimeUpdates();
    } catch (error) {
        console.error('Error initializing members page:', error);
    }
}

// Load members from Firebase
async function loadMembers() {
    try {
        members = await WelfareDB.getMembers();
        renderMembersTable();
    } catch (error) {
        console.error('Error loading members:', error);
    }
}

// Set up real-time updates
function setupRealtimeUpdates() {
    WelfareDB.onMembersChange((newMembers) => {
        members = newMembers;
        renderMembersTable();
    });
}

// Render members table
function renderMembersTable() {
    const tbody = document.getElementById('membersTableBody');
    const membersArray = Object.values(members);
    
    if (membersArray.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading-text">No members found. Add your first member!</td></tr>';
        return;
    }
    
    tbody.innerHTML = membersArray.map(member => `
        <tr>
            <td>${member.id}</td>
            <td>${member.name}</td>
            <td>GH₵ ${parseFloat(member.monthlyContribution || 0).toFixed(2)}</td>
            <td>${new Date(member.createdAt).toLocaleDateString()}</td>
            <td class="status-${member.status || 'active'}">${member.status || 'active'}</td>
            <td>GH₵ ${calculateTotalPaid(member.id).toFixed(2)}</td>
            <td>
                <button class="btn-primary" onclick="editMember('${member.id}')">Edit</button>
                <button class="btn-secondary" onclick="recordPayment('${member.id}')">Payment</button>
            </td>
        </tr>
    `).join('');
}

// Calculate total paid by member
function calculateTotalPaid(memberId) {
    return Object.values(window.contributions || {}).reduce((sum, contribution) => {
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

    if (!name || isNaN(monthlyContribution)) {
        alert('Please fill in all required fields correctly.');
        return;
    }

    try {
        const memberData = {
            name: name,
            email: email,
            phone: phone,
            monthlyContribution: monthlyContribution,
            status: 'active'
        };

        await WelfareDB.addMember(memberData);
        
        // Close modal and reset form
        closeAddMemberModal();
        alert('Member added successfully!');
        
    } catch (error) {
        console.error('Error adding member:', error);
        alert('Error adding member. Please try again.');
    }
}

// Record payment for member
function recordPayment(memberId) {
    const member = members[memberId];
    if (member) {
        window.location.href = `contributions.html?member=${memberId}&action=record`;
    }
}

// Edit member (basic implementation)
function editMember(memberId) {
    const member = members[memberId];
    if (member) {
        // For now, just show an alert. You can implement a proper edit modal
        alert(`Edit functionality for ${member.name} would go here.`);
    }
}

// Load members when page loads
document.addEventListener('DOMContentLoaded', async function() {
    // Load contributions for calculations
    window.contributions = await WelfareDB.getContributions();
    initializeMembers();
});
