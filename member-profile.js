// Check authentication and role
if (!checkAuth() || sessionStorage.getItem('welfare_role') !== 'member') {
    window.location.href = 'index.html';
}

const memberId = sessionStorage.getItem('welfare_userId');
let memberData = {};
let contributions = {};
let isEditMode = false;

// Initialize member profile
async function initializeMemberProfile() {
    try {
        console.log('Initializing member profile for:', memberId);
        
        await loadMemberData();
        await loadContributions();
        
        updateProfileDisplay();
        updateProfileStats();
        
        console.log('Member profile initialized successfully');
        
    } catch (error) {
        console.error('Error initializing member profile:', error);
        showToast('Error loading profile data', 'error');
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

// Update profile display
function updateProfileDisplay() {
    // Personal Information
    document.getElementById('profileName').textContent = memberData.name || 'Not set';
    document.getElementById('profileFullName').value = memberData.name || '';
    document.getElementById('profileEmail').value = memberData.email || '';
    document.getElementById('profilePhone').value = memberData.phone || '';
    document.getElementById('profileOccupation').value = memberData.occupation || '';
    document.getElementById('profileAddress').value = memberData.address || '';
    
    // Membership Information
    document.getElementById('profileMemberId').textContent = memberData.id || '-';
    document.getElementById('profileMonthlyContribution').value = memberData.monthlyContribution || 0;
    document.getElementById('profileJoinDate').value = memberData.joinDate ? new Date(memberData.joinDate).toLocaleDateString() : '-';
    
    // Status
    document.getElementById('profileStatus').textContent = memberData.status || 'active';
    document.getElementById('profileStatus').className = `status-${memberData.status || 'active'}`;
}

// Update profile statistics
function updateProfileStats() {
    // Total contributions
    const totalContributions = Object.values(contributions).reduce((sum, contribution) => {
        return sum + (parseFloat(contribution.amount) || 0);
    }, 0);
    document.getElementById('totalContributionsStat').textContent = `GH₵ ${totalContributions.toFixed(2)}`;
    
    // Member since
    document.getElementById('memberSinceStat').textContent = memberData.joinDate ? 
        new Date(memberData.joinDate).toLocaleDateString() : '-';
    
    // Last login
    document.getElementById('lastLoginStat').textContent = memberData.lastLogin ? 
        new Date(memberData.lastLogin).toLocaleDateString() : '-';
}

// Toggle edit mode
function toggleEditMode() {
    isEditMode = !isEditMode;
    const formElements = document.querySelectorAll('#profileForm input, #profileForm textarea');
    const editBtn = document.getElementById('editProfileBtn');
    const formActions = document.getElementById('profileFormActions');
    
    if (isEditMode) {
        // Enable editing
        formElements.forEach(element => {
            if (element.id !== 'profileJoinDate') { // Don't enable join date
                element.disabled = false;
            }
        });
        editBtn.textContent = '❌ Cancel Edit';
        editBtn.classList.remove('btn-primary');
        editBtn.classList.add('btn-secondary');
        formActions.style.display = 'flex';
    } else {
        // Disable editing
        formElements.forEach(element => {
            element.disabled = true;
        });
        editBtn.textContent = '✏️ Edit Profile';
        editBtn.classList.remove('btn-secondary');
        editBtn.classList.add('btn-primary');
        formActions.style.display = 'none';
        
        // Reset form values
        updateProfileDisplay();
    }
}

// Cancel edit
function cancelEdit() {
    isEditMode = false;
    toggleEditMode();
}

// Save profile changes
async function saveProfileChanges() {
    const fullName = document.getElementById('profileFullName').value.trim();
    const email = document.getElementById('profileEmail').value.trim();
    const phone = document.getElementById('profilePhone').value.trim();
    const occupation = document.getElementById('profileOccupation').value.trim();
    const address = document.getElementById('profileAddress').value.trim();
    const monthlyContribution = parseFloat(document.getElementById('profileMonthlyContribution').value);
    const newPassword = document.getElementById('profilePassword').value;
    const confirmPassword = document.getElementById('profileConfirmPassword').value;

    // Validation
    if (!fullName || !email || !phone) {
        showToast('Please fill in all required fields.', 'error');
        return;
    }

    if (monthlyContribution < 10) {
        showToast('Minimum monthly contribution is GH₵ 10.00', 'error');
        return;
    }

    if (newPassword && newPassword !== confirmPassword) {
        showToast('Passwords do not match!', 'error');
        return;
    }

    try {
        const updates = {
            name: fullName,
            email: email,
            phone: phone,
            occupation: occupation,
            address: address,
            monthlyContribution: monthlyContribution,
            updatedAt: new Date().toISOString()
        };

        // Add password if changed
        if (newPassword) {
            updates.password = newPassword;
        }

        // Check if email is being changed and if it's already taken
        if (email !== memberData.email) {
            const members = await WelfareDB.getMembers();
            const emailExists = Object.values(members).some(member => 
                member.email === email && member.id !== memberId
            );
            
            if (emailExists) {
                showToast('Email already taken by another member!', 'error');
                return;
            }
        }

        await WelfareDB.updateMember(memberId, updates);
        
        // Update session storage if name changed
        if (fullName !== memberData.name) {
            sessionStorage.setItem('welfare_username', fullName);
            document.getElementById('welcomeMessage').textContent = `Welcome, ${fullName}`;
        }
        
        // Reload member data
        await loadMemberData();
        cancelEdit();
        showToast('Profile updated successfully!', 'success');
        
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('Error updating profile: ' + error.message, 'error');
    }
}

// Download member statement
async function downloadMemberStatement() {
    try {
        showToast('Generating your statement...', 'info');
        
        const memberContributions = await WelfareDB.getMemberContributions(memberId);
        const memberWithdrawals = await WelfareDB.getMemberWithdrawals(memberId);
        
        // Create statement content
        let statement = `SUNYANI MUNICIPAL WELFARE - MEMBER STATEMENT\n`;
        statement += `============================================\n\n`;
        statement += `Member: ${memberData.name}\n`;
        statement += `Member ID: ${memberData.id}\n`;
        statement += `Statement Date: ${new Date().toLocaleDateString()}\n\n`;
        
        // Contributions section
        statement += `CONTRIBUTIONS:\n`;
        statement += `--------------\n`;
        const contributionsArray = Object.values(memberContributions)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        let totalContributions = 0;
        contributionsArray.forEach(contribution => {
            const date = new Date(contribution.timestamp).toLocaleDateString();
            statement += `${date} - ${getMonthName(contribution.month)} ${contribution.year} - GH₵ ${parseFloat(contribution.amount).toFixed(2)}\n`;
            totalContributions += parseFloat(contribution.amount);
        });
        statement += `Total Contributions: GH₵ ${totalContributions.toFixed(2)}\n\n`;
        
        // Withdrawals section
        statement += `WITHDRAWALS:\n`;
        statement += `-------------\n`;
        const withdrawalsArray = Object.values(memberWithdrawals)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        let totalWithdrawals = 0;
        withdrawalsArray.forEach(withdrawal => {
            const date = new Date(withdrawal.timestamp).toLocaleDateString();
            statement += `${date} - ${withdrawal.purpose} - GH₵ ${parseFloat(withdrawal.amount).toFixed(2)}\n`;
            totalWithdrawals += parseFloat(withdrawal.amount);
        });
        statement += `Total Withdrawals: GH₵ ${totalWithdrawals.toFixed(2)}\n\n`;
        
        // Summary
        statement += `SUMMARY:\n`;
        statement += `--------\n`;
        statement += `Net Balance: GH₵ ${(totalContributions - totalWithdrawals).toFixed(2)}\n`;
        statement += `Available for Withdrawal: GH₵ ${(totalContributions * 0.5).toFixed(2)}\n`;
        
        // Create and download file
        const blob = new Blob([statement], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `welfare-statement-${memberData.id}-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Statement downloaded successfully!', 'success');
        
    } catch (error) {
        console.error('Error generating statement:', error);
        showToast('Error generating statement', 'error');
    }
}

// Change password
function changePassword() {
    document.getElementById('profilePassword').value = '';
    document.getElementById('profileConfirmPassword').value = '';
    
    if (!isEditMode) {
        toggleEditMode();
    }
    
    document.getElementById('profilePassword').focus();
    showToast('Please enter your new password above', 'info');
}

// Deactivate account
function deactivateAccount() {
    if (confirm('Are you sure you want to deactivate your account? You will no longer be able to access the welfare system.')) {
        if (confirm('This action cannot be undone. Are you absolutely sure?')) {
            WelfareDB.updateMember(memberId, {
                status: 'inactive',
                deactivatedAt: new Date().toISOString()
            })
            .then(() => {
                showToast('Account deactivated successfully', 'success');
                setTimeout(() => {
                    logout();
                }, 2000);
            })
            .catch(error => {
                console.error('Error deactivating account:', error);
                showToast('Error deactivating account', 'error');
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
document.getElementById('profileForm').addEventListener('submit', function(e) {
    e.preventDefault();
    saveProfileChanges();
});

// Initialize profile when page loads
document.addEventListener('DOMContentLoaded', initializeMemberProfile);