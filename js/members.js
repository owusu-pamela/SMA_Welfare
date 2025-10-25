// Check authentication and role
if (!checkAuth() || !checkAdmin()) {
    window.location.href = 'index.html';
}

let members = {};
let contributions = {};
let currentFilters = {
    department: '',
    status: '',
    paymentMode: ''
};

// Initialize members page
async function initializeMembers() {
    try {
        console.log('Initializing members management...');
        
        await loadMembers();
        await loadContributions();
        setupRealtimeListeners();
        
        updateStats();
        renderMembersTable();
        
        console.log('Members management initialized successfully');
        
    } catch (error) {
        console.error('Error initializing members:', error);
        showToast('Error loading members data', 'error');
    }
}

// Load members
async function loadMembers() {
    try {
        members = await WelfareDB.getMembers();
        console.log('Members loaded:', Object.keys(members).length);
    } catch (error) {
        console.error('Error loading members:', error);
        throw error;
    }
}

// Load contributions
async function loadContributions() {
    try {
        contributions = await WelfareDB.getContributions();
    } catch (error) {
        console.error('Error loading contributions:', error);
        throw error;
    }
}

// Set up real-time listeners
function setupRealtimeListeners() {
    WelfareDB.onMembersChange((newMembers) => {
        members = newMembers;
        updateStats();
        renderMembersTable();
    });
}

// Update statistics
function updateStats() {
    const membersArray = Object.values(members);
    
    // Total members
    document.getElementById('totalMembers').textContent = membersArray.length;
    
    // Active members
    const activeMembers = membersArray.filter(m => m.status === 'active').length;
    document.getElementById('activeMembers').textContent = activeMembers;
    
    // This month's collection
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthCollection = Object.values(contributions).reduce((sum, contribution) => {
        if (contribution.month === currentMonth && contribution.year === currentYear) {
            return sum + (parseFloat(contribution.amount) || 0);
        }
        return sum;
    }, 0);
    document.getElementById('monthCollection').textContent = `GH₵ ${monthCollection.toFixed(2)}`;
    
    // Pending approvals (welfare applications)
    // This would be implemented when welfare management is added
    document.getElementById('pendingApprovals').textContent = '0';
}

// Render members table
function renderMembersTable() {
    const tbody = document.getElementById('membersTableBody');
    const membersArray = Object.values(members).filter(member => {
        if (currentFilters.department && member.department !== currentFilters.department) return false;
        if (currentFilters.status && member.status !== currentFilters.status) return false;
        if (currentFilters.paymentMode && member.paymentMode !== currentFilters.paymentMode) return false;
        return true;
    });
    
    if (membersArray.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="loading-text">No members found matching your filters</td></tr>';
        return;
    }
    
    tbody.innerHTML = membersArray.map(member => {
        const totalPaid = Object.values(contributions).reduce((sum, contribution) => {
            if (contribution.memberId === member.id) {
                return sum + (parseFloat(contribution.amount) || 0);
            }
            return sum;
        }, 0);
        
        const totalWithdrawn = 0; // This would be calculated from withdrawals
        const balance = totalPaid - totalWithdrawn;
        
        return `
            <tr>
                <td><strong>${member.staffId || 'N/A'}</strong></td>
                <td>
                    <div class="member-info">
                        <strong>${member.title || ''} ${member.name}</strong>
                        <small>${member.email}</small>
                    </div>
                </td>
                <td>${member.department || 'N/A'}</td>
                <td>${member.role || 'N/A'}</td>
                <td>${member.phone || 'N/A'}</td>
                <td>
                    <span class="payment-mode ${member.paymentMode}">
                        ${member.paymentMode === 'cash' ? '💵 Cash' : '🏦 Controller'}
                    </span>
                </td>
                <td>GH₵ ${parseFloat(member.monthlyDue || 0).toFixed(2)}</td>
                <td><span class="status-${member.status || 'active'}">${member.status || 'active'}</span></td>
                <td><strong>GH₵ ${balance.toFixed(2)}</strong></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-secondary" onclick="viewMemberDetails('${member.id}')">👁️ View</button>
                        <button class="btn-primary" onclick="editMember('${member.id}')">✏️ Edit</button>
                        <button class="btn-danger" onclick="deactivateMember('${member.id}')">🚫 ${member.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Apply filters
function applyFilters() {
    currentFilters.department = document.getElementById('departmentFilter').value;
    currentFilters.status = document.getElementById('statusFilter').value;
    currentFilters.paymentMode = document.getElementById('paymentFilter').value;
    
    renderMembersTable();
}

// Clear filters
function clearFilters() {
    document.getElementById('departmentFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('paymentFilter').value = '';
    
    currentFilters.department = '';
    currentFilters.status = '';
    currentFilters.paymentMode = '';
    
    renderMembersTable();
}

// Show add member modal
function showAddMemberModal() {
    document.getElementById('addMemberForm').reset();
    
    // Set default values
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('memberJoinDate').value = today;
    
    // Add event listeners
    document.getElementById('memberDob').addEventListener('change', calculateAge);
    document.getElementById('memberMaritalStatus').addEventListener('change', toggleSpouseField);
    
    document.getElementById('addMemberModal').style.display = 'block';
}

// Close add member modal
function closeAddMemberModal() {
    document.getElementById('addMemberModal').style.display = 'none';
    document.getElementById('addMemberForm').reset();
    
    // Remove event listeners
    document.getElementById('memberDob').removeEventListener('change', calculateAge);
    document.getElementById('memberMaritalStatus').removeEventListener('change', toggleSpouseField);
}

// Calculate age from date of birth
function calculateAge() {
    const dob = new Date(document.getElementById('memberDob').value);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    
    document.getElementById('memberAge').value = age;
}

// Toggle spouse field based on marital status
function toggleSpouseField() {
    const maritalStatus = document.getElementById('memberMaritalStatus').value;
    const spouseSection = document.getElementById('spouseSection');
    
    if (maritalStatus === 'Married') {
        spouseSection.style.display = 'block';
    } else {
        spouseSection.style.display = 'none';
        document.getElementById('memberSpouseName').value = '';
    }
}

// Add child field
function addChildField() {
    const container = document.getElementById('childrenContainer');
    const childEntry = document.createElement('div');
    childEntry.className = 'child-entry';
    childEntry.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label>Child Name</label>
                <input type="text" class="child-name" placeholder="Child full name">
            </div>
            <div class="form-group">
                <label>Date of Birth</label>
                <input type="date" class="child-dob">
            </div>
            <div class="form-group">
                <label>Action</label>
                <button type="button" class="btn-danger remove-child" onclick="this.parentElement.parentElement.parentElement.remove()">Remove</button>
            </div>
        </div>
    `;
    container.appendChild(childEntry);
}

// Register new member
async function registerNewMember() {
    const formData = new FormData(document.getElementById('addMemberForm'));
    
    // Basic validation
    if (!document.getElementById('memberConsent').checked) {
        showToast('Please agree to the consent declaration', 'error');
        return;
    }

    // Collect children data
    const children = [];
    document.querySelectorAll('.child-entry').forEach(entry => {
        const name = entry.querySelector('.child-name').value;
        const dob = entry.querySelector('.child-dob').value;
        if (name && dob) {
            children.push({ name, dob });
        }
    });

    const memberData = {
        // Personal Information
        title: document.getElementById('memberTitle').value,
        name: document.getElementById('memberFullName').value,
        dob: document.getElementById('memberDob').value,
        age: document.getElementById('memberAge').value,
        maritalStatus: document.getElementById('memberMaritalStatus').value,
        spouseName: document.getElementById('memberSpouseName').value || '',
        
        // Employment Information
        staffId: document.getElementById('memberStaffId').value,
        department: document.getElementById('memberDepartment').value,
        role: document.getElementById('memberRole').value,
        joinDate: document.getElementById('memberJoinDate').value,
        
        // Contact Information
        phone: document.getElementById('memberPhone').value,
        email: document.getElementById('memberEmail').value,
        address: document.getElementById('memberAddress').value,
        
        // Identification
        idType: document.getElementById('memberIdType').value,
        idNumber: document.getElementById('memberIdNumber').value,
        
        // Next of Kin
        nokName: document.getElementById('memberNokName').value,
        nokRelationship: document.getElementById('memberNokRelationship').value,
        nokPhone: document.getElementById('memberNokPhone').value,
        nokAddress: document.getElementById('memberNokAddress').value,
        
        // Parents Information
        fatherName: document.getElementById('memberFatherName').value,
        fatherStatus: document.getElementById('memberFatherStatus').value,
        motherName: document.getElementById('memberMotherName').value,
        motherStatus: document.getElementById('memberMotherStatus').value,
        
        // Children Information
        children: children,
        
        // Payment Settings
        paymentMode: document.getElementById('memberPaymentMode').value,
        monthlyDue: parseFloat(document.getElementById('memberMonthlyDue').value),
        
        // Account Information
        username: document.getElementById('memberUsername').value,
        password: document.getElementById('memberPassword').value,
        
        // System Fields
        status: 'active',
        registrationDate: new Date().toISOString(),
        lastLogin: null,
        totalContributions: 0,
        totalWithdrawals: 0,
        currentBalance: 0
    };

    try {
        // Check if staff ID already exists
        const existingMember = Object.values(members).find(m => m.staffId === memberData.staffId);
        if (existingMember) {
            showToast('Staff ID already exists! Please use a different Staff ID.', 'error');
            return;
        }

        // Check if email already exists
        const existingEmail = Object.values(members).find(m => m.email === memberData.email);
        if (existingEmail) {
            showToast('Email already registered! Please use a different email.', 'error');
            return;
        }

        // Generate member ID
        const memberId = 'member_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        memberData.id = memberId;

        console.log('Registering new member:', memberData);
        
        // Save to Firebase
        await WelfareDB.addMember(memberData);
        
        closeAddMemberModal();
        showToast('Member registered successfully!', 'success');
        
        // Reload members
        await loadMembers();
        renderMembersTable();
        
    } catch (error) {
        console.error('Error registering member:', error);
        showToast('Error registering member: ' + error.message, 'error');
    }
}

// View member details
function viewMemberDetails(memberId) {
    const member = members[memberId];
    if (member) {
        // This would open a detailed view modal
        alert(`Member Details:\n\nName: ${member.title} ${member.name}\nStaff ID: ${member.staffId}\nDepartment: ${member.department}\nRole: ${member.role}\nPhone: ${member.phone}\nEmail: ${member.email}`);
    }
}

// Edit member
function editMember(memberId) {
    // This would open the edit modal with pre-filled data
    showToast('Edit functionality will be implemented in the next phase', 'info');
}

// Deactivate/Activate member
function deactivateMember(memberId) {
    const member = members[memberId];
    if (member) {
        const newStatus = member.status === 'active' ? 'inactive' : 'active';
        const action = newStatus === 'active' ? 'activate' : 'deactivate';
        
        if (confirm(`Are you sure you want to ${action} ${member.name}?`)) {
            WelfareDB.updateMember(memberId, {
                status: newStatus,
                updatedAt: new Date().toISOString()
            })
            .then(() => {
                showToast(`Member ${action}d successfully`, 'success');
            })
            .catch(error => {
                console.error('Error updating member status:', error);
                showToast('Error updating member status', 'error');
            });
        }
    }
}

// Generate members report
function generateMembersReport() {
    showToast('PDF report generation will be implemented in the next phase', 'info');
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
document.getElementById('addMemberForm').addEventListener('submit', function(e) {
    e.preventDefault();
    registerNewMember();
});

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('addMemberModal');
    if (event.target === modal) {
        closeAddMemberModal();
    }
}

// Filter event listeners
document.getElementById('departmentFilter').addEventListener('change', applyFilters);
document.getElementById('statusFilter').addEventListener('change', applyFilters);
document.getElementById('paymentFilter').addEventListener('change', applyFilters);

// Initialize members when page loads
document.addEventListener('DOMContentLoaded', initializeMembers);
