// Check authentication and role - only super admins can access
if (!checkAuth() || !checkSuperAdmin()) {
    window.location.href = 'dashboard.html';
    showToast('Access denied. Super admin privileges required.', 'error');
}

let admins = {};
let roles = {};
let systemConfig = {};
let currentEditingAdmin = null;

// Initialize admin settings
async function initializeAdminSettings() {
    try {
        console.log('Initializing admin settings...');
        
        await loadAdminData();
        setupRealtimeListeners();
        
        renderAdminsTable();
        renderRolesGrid();
        loadSystemConfig();
        loadBackupList();
        updateSystemHealth();
        
        console.log('Admin settings initialized successfully');
        
    } catch (error) {
        console.error('Error initializing admin settings:', error);
        showToast('Error loading admin settings', 'error');
    }
}

// Load admin data
async function loadAdminData() {
    try {
        admins = await WelfareDB.getAdmins();
        roles = await WelfareDB.getRoles();
        systemConfig = await WelfareDB.getSystemConfig();
        
        console.log('Admin data loaded:', {
            admins: Object.keys(admins).length,
            roles: Object.keys(roles).length,
            config: Object.keys(systemConfig).length
        });
        
    } catch (error) {
        console.error('Error loading admin data:', error);
        throw error;
    }
}

// Set up real-time listeners
function setupRealtimeListeners() {
    WelfareDB.onAdminsChange((newAdmins) => {
        admins = newAdmins;
        renderAdminsTable();
        updateAdminStats();
    });

    WelfareDB.onRolesChange((newRoles) => {
        roles = newRoles;
        renderRolesGrid();
    });

    WelfareDB.onSystemConfigChange((newConfig) => {
        systemConfig = newConfig;
        loadSystemConfig();
    });
}

// Render admins table
function renderAdminsTable() {
    const container = document.getElementById('adminsTable');
    const currentUser = sessionStorage.getItem('welfare_username');
    
    if (!admins || Object.keys(admins).length === 0) {
        container.innerHTML = '<tr><td colspan="7" class="no-data">No admin accounts found</td></tr>';
        return;
    }
    
    container.innerHTML = Object.values(admins).map(admin => {
        const lastLogin = admin.lastLogin ? new Date(admin.lastLogin).toLocaleDateString() : 'Never';
        const isCurrentUser = admin.username === currentUser;
        
        return `
            <tr class="${isCurrentUser ? 'current-user' : ''}">
                <td>
                    <div class="admin-info">
                        <strong>${admin.name}</strong>
                        ${isCurrentUser ? '<span class="you-badge">You</span>' : ''}
                    </div>
                </td>
                <td>${admin.username}</td>
                <td>
                    <span class="role-badge role-${admin.role}">
                        ${formatRoleName(admin.role)}
                    </span>
                </td>
                <td>
                    <div class="permissions-preview">
                        ${getPermissionPreview(admin.permissions)}
                    </div>
                </td>
                <td>${lastLogin}</td>
                <td>
                    <span class="status-${admin.status || 'active'}">
                        ${admin.status || 'active'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        ${!isCurrentUser ? `
                            <button class="btn-secondary" onclick="editAdmin('${admin.id}')">✏️ Edit</button>
                            <button class="btn-danger" onclick="deactivateAdmin('${admin.id}')">
                                ${admin.status === 'inactive' ? '✅ Activate' : '🚫 Deactivate'}
                            </button>
                        ` : `
                            <button class="btn-primary" onclick="editOwnProfile()">👤 My Profile</button>
                        `}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    updateAdminStats();
}

// Update admin statistics
function updateAdminStats() {
    const adminsArray = Object.values(admins);
    
    document.getElementById('totalAdmins').textContent = adminsArray.length;
    document.getElementById('activeAdmins').textContent = adminsArray.filter(a => a.status !== 'inactive').length;
    document.getElementById('superAdmins').textContent = adminsArray.filter(a => a.role === 'super_admin').length;
}

// Render roles grid
function renderRolesGrid() {
    const container = document.getElementById('rolesGrid');
    const predefinedRoles = {
        'super_admin': {
            name: 'Super Administrator',
            description: 'Full system access with all permissions. Can manage all admin accounts and system settings.',
            permissions: ['all'],
            immutable: true
        },
        'admin': {
            name: 'Administrator',
            description: 'Full access to member and transaction management. Cannot modify system settings or admin accounts.',
            permissions: ['member_management', 'contribution_management', 'withdrawal_management', 'welfare_management', 'report_generation'],
            immutable: false
        },
        'manager': {
            name: 'Manager',
            description: 'Can manage members, contributions, and withdrawals. Limited access to reports and welfare services.',
            permissions: ['member_management', 'contribution_management', 'withdrawal_management'],
            immutable: false
        },
        'viewer': {
            name: 'Viewer',
            description: 'Read-only access to view members, contributions, and basic reports.',
            permissions: ['report_generation'],
            immutable: false
        }
    };
    
    let rolesHTML = '';
    
    // Add predefined roles
    Object.entries(predefinedRoles).forEach(([roleId, role]) => {
        rolesHTML += `
            <div class="role-card ${roleId}">
                <div class="role-header">
                    <h4>${role.name}</h4>
                    <span class="role-badge">${role.immutable ? 'System' : 'Predefined'}</span>
                </div>
                <div class="role-description">
                    <p>${role.description}</p>
                </div>
                <div class="role-permissions">
                    ${role.permissions[0] === 'all' ? 
                        '<span class="permission-tag">All Permissions</span>' :
                        role.permissions.map(perm => `<span class="permission-tag">${formatPermissionName(perm)}</span>`).join('')
                    }
                </div>
                <div class="role-actions">
                    ${!role.immutable ? `
                        <button class="btn-secondary" onclick="editRole('${roleId}')">✏️ Edit</button>
                        <button class="btn-danger" onclick="deleteRole('${roleId}')">🗑️ Delete</button>
                    ` : `
                        <button class="btn-secondary" disabled>Immutable</button>
                    `}
                </div>
            </div>
        `;
    });
    
    // Add custom roles
    Object.entries(roles).forEach(([roleId, role]) => {
        if (!predefinedRoles[roleId]) {
            rolesHTML += `
                <div class="role-card custom">
                    <div class="role-header">
                        <h4>${role.name}</h4>
                        <span class="role-badge">Custom</span>
                    </div>
                    <div class="role-description">
                        <p>${role.description || 'Custom role with specific permissions'}</p>
                    </div>
                    <div class="role-permissions">
                        ${role.permissions.map(perm => `<span class="permission-tag">${formatPermissionName(perm)}</span>`).join('')}
                    </div>
                    <div class="role-actions">
                        <button class="btn-secondary" onclick="editRole('${roleId}')">✏️ Edit</button>
                        <button class="btn-danger" onclick="deleteRole('${roleId}')">🗑️ Delete</button>
                    </div>
                </div>
            `;
        }
    });
    
    container.innerHTML = rolesHTML;
}

// Load system configuration
function loadSystemConfig() {
    if (systemConfig) {
        document.getElementById('systemName').value = systemConfig.systemName || 'Sunyani Municipal Assembly Welfare System';
        document.getElementById('systemCurrency').value = systemConfig.currency || 'GHS';
        document.getElementById('contributionDeadline').value = systemConfig.contributionDeadline || 15;
        document.getElementById('withdrawalReserve').value = systemConfig.withdrawalReserve || 50;
        document.getElementById('autoReminders').value = systemConfig.autoReminders || 'enabled';
        document.getElementById('maxEmergencyWithdrawal').value = systemConfig.maxEmergencyWithdrawal || 30;
        
        // Security settings
        document.getElementById('sessionTimeout').value = systemConfig.sessionTimeout || 120;
        document.getElementById('maxLoginAttempts').value = systemConfig.maxLoginAttempts || 5;
        document.getElementById('passwordExpiry').value = systemConfig.passwordExpiry || 90;
        document.getElementById('requireStrongPassword').checked = systemConfig.requireStrongPassword !== false;
        document.getElementById('twoFactorAuth').checked = systemConfig.twoFactorAuth || false;
        document.getElementById('loginNotifications').checked = systemConfig.loginNotifications !== false;
    }
}

// Show add admin modal
function showAddAdminModal() {
    document.getElementById('addAdminForm').reset();
    document.getElementById('customPermissionsSection').style.display = 'none';
    document.getElementById('addAdminModal').style.display = 'block';
}

// Close add admin modal
function closeAddAdminModal() {
    document.getElementById('addAdminModal').style.display = 'none';
}

// Update permission display based on role selection
function updatePermissionDisplay() {
    const role = document.getElementById('adminRole').value;
    const customSection = document.getElementById('customPermissionsSection');
    
    if (role === 'custom') {
        customSection.style.display = 'block';
    } else {
        customSection.style.display = 'none';
        
        // Set predefined permissions based on role
        const permissions = document.querySelectorAll('input[name="permissions"]');
        permissions.forEach(checkbox => {
            checkbox.checked = getDefaultPermissions(role).includes(checkbox.value);
        });
    }
}

// Get default permissions for role
function getDefaultPermissions(role) {
    const defaultPermissions = {
        'super_admin': ['member_management', 'contribution_management', 'withdrawal_management', 'welfare_management', 'report_generation', 'system_settings'],
        'admin': ['member_management', 'contribution_management', 'withdrawal_management', 'welfare_management', 'report_generation'],
        'manager': ['member_management', 'contribution_management', 'withdrawal_management'],
        'viewer': ['report_generation']
    };
    
    return defaultPermissions[role] || [];
}

// Create new admin
async function createNewAdmin() {
    const formData = new FormData(document.getElementById('addAdminForm'));
    
    const adminData = {
        name: document.getElementById('adminFullName').value,
        email: document.getElementById('adminEmail').value,
        username: document.getElementById('adminUsername').value,
        role: document.getElementById('adminRole').value,
        password: document.getElementById('adminPassword').value,
        status: 'active',
        createdAt: new Date().toISOString(),
        createdBy: sessionStorage.getItem('welfare_username') || 'System',
        lastLogin: null,
        mustChangePassword: true
    };
    
    // Handle custom permissions
    if (adminData.role === 'custom') {
        const permissions = [];
        document.querySelectorAll('input[name="permissions"]:checked').forEach(checkbox => {
            permissions.push(checkbox.value);
        });
        adminData.permissions = permissions;
    } else {
        adminData.permissions = getDefaultPermissions(adminData.role);
    }

    try {
        // Check if username already exists
        const existingAdmin = Object.values(admins).find(a => a.username === adminData.username);
        if (existingAdmin) {
            showToast('Username already exists. Please choose a different username.', 'error');
            return;
        }

        // Check if email already exists
        const existingEmail = Object.values(admins).find(a => a.email === adminData.email);
        if (existingEmail) {
            showToast('Email address already registered.', 'error');
            return;
        }

        const adminId = 'admin_' + Date.now();
        adminData.id = adminId;

        await WelfareDB.addAdmin(adminData);
        
        // Log the action
        await WelfareDB.addAuditLog({
            action: 'admin_created',
            performedBy: sessionStorage.getItem('welfare_username') || 'System',
            target: adminData.username,
            timestamp: new Date().toISOString(),
            details: `Created admin account with role: ${adminData.role}`
        });

        closeAddAdminModal();
        showToast('Admin account created successfully', 'success');
        
    } catch (error) {
        console.error('Error creating admin:', error);
        showToast('Error creating admin account: ' + error.message, 'error');
    }
}

// Edit admin
function editAdmin(adminId) {
    const admin = admins[adminId];
    if (!admin) {
        showToast('Admin not found', 'error');
        return;
    }

    currentEditingAdmin = adminId;

    const editContent = `
        <div class="form-group">
            <label for="editAdminName">Full Name *</label>
            <input type="text" id="editAdminName" value="${admin.name}" required>
        </div>
        <div class="form-group">
            <label for="editAdminEmail">Email Address *</label>
            <input type="email" id="editAdminEmail" value="${admin.email}" required>
        </div>
        <div class="form-group">
            <label for="editAdminRole">Admin Role *</label>
            <select id="editAdminRole" required>
                <option value="super_admin" ${admin.role === 'super_admin' ? 'selected' : ''}>Super Administrator</option>
                <option value="admin" ${admin.role === 'admin' ? 'selected' : ''}>Administrator</option>
                <option value="manager" ${admin.role === 'manager' ? 'selected' : ''}>Manager</option>
                <option value="viewer" ${admin.role === 'viewer' ? 'selected' : ''}>Viewer</option>
                <option value="custom" ${admin.role === 'custom' ? 'selected' : ''}>Custom Role</option>
            </select>
        </div>
        <div class="form-group" id="editCustomPermissionsSection" style="${admin.role === 'custom' ? 'block' : 'none'}">
            <label>Custom Permissions</label>
            <div class="permissions-grid">
                <label class="checkbox-label">
                    <input type="checkbox" name="editPermissions" value="member_management" ${admin.permissions?.includes('member_management') ? 'checked' : ''}>
                    <span>Member Management</span>
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" name="editPermissions" value="contribution_management" ${admin.permissions?.includes('contribution_management') ? 'checked' : ''}>
                    <span>Contribution Management</span>
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" name="editPermissions" value="withdrawal_management" ${admin.permissions?.includes('withdrawal_management') ? 'checked' : ''}>
                    <span>Withdrawal Management</span>
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" name="editPermissions" value="welfare_management" ${admin.permissions?.includes('welfare_management') ? 'checked' : ''}>
                    <span>Welfare Management</span>
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" name="editPermissions" value="report_generation" ${admin.permissions?.includes('report_generation') ? 'checked' : ''}>
                    <span>Report Generation</span>
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" name="editPermissions" value="system_settings" ${admin.permissions?.includes('system_settings') ? 'checked' : ''}>
                    <span>System Settings</span>
                </label>
            </div>
        </div>
        <div class="form-group">
            <label for="editAdminStatus">Status</label>
            <select id="editAdminStatus">
                <option value="active" ${admin.status === 'active' ? 'selected' : ''}>Active</option>
                <option value="inactive" ${admin.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                <option value="suspended">Suspended</option>
            </select>
        </div>
        <div class="form-group">
            <label class="checkbox-label">
                <input type="checkbox" id="resetPassword">
                <span>Require password reset on next login</span>
            </label>
        </div>
        <div class="form-actions">
            <button type="button" class="btn-secondary" onclick="closeEditAdminModal()">Cancel</button>
            <button type="button" class="btn-primary" onclick="updateAdmin()">💾 Update Admin</button>
        </div>
    `;

    document.getElementById('editAdminContent').innerHTML = editContent;
    document.getElementById('editAdminModal').style.display = 'block';
    
    // Add event listener for role change
    document.getElementById('editAdminRole').addEventListener('change', function() {
        document.getElementById('editCustomPermissionsSection').style.display = 
            this.value === 'custom' ? 'block' : 'none';
    });
}

// Close edit admin modal
function closeEditAdminModal() {
    document.getElementById('editAdminModal').style.display = 'none';
    currentEditingAdmin = null;
}

// Update admin
async function updateAdmin() {
    const admin = admins[currentEditingAdmin];
    if (!admin) {
        showToast('Admin not found', 'error');
        return;
    }

    const updateData = {
        name: document.getElementById('editAdminName').value,
        email: document.getElementById('editAdminEmail').value,
        role: document.getElementById('editAdminRole').value,
        status: document.getElementById('editAdminStatus').value,
        updatedAt: new Date().toISOString(),
        updatedBy: sessionStorage.getItem('welfare_username') || 'System'
    };

    // Handle permissions
    if (updateData.role === 'custom') {
        const permissions = [];
        document.querySelectorAll('input[name="editPermissions"]:checked').forEach(checkbox => {
            permissions.push(checkbox.value);
        });
        updateData.permissions = permissions;
    } else {
        updateData.permissions = getDefaultPermissions(updateData.role);
    }

    // Handle password reset
    if (document.getElementById('resetPassword').checked) {
        updateData.mustChangePassword = true;
    }

    try {
        await WelfareDB.updateAdmin(currentEditingAdmin, updateData);
        
        // Log the action
        await WelfareDB.addAuditLog({
            action: 'admin_updated',
            performedBy: sessionStorage.getItem('welfare_username') || 'System',
            target: admin.username,
            timestamp: new Date().toISOString(),
            details: `Updated admin account: ${JSON.stringify(updateData)}`
        });

        closeEditAdminModal();
        showToast('Admin account updated successfully', 'success');
        
    } catch (error) {
        console.error('Error updating admin:', error);
        showToast('Error updating admin account', 'error');
    }
}

// Deactivate/Activate admin
async function deactivateAdmin(adminId) {
    const admin = admins[adminId];
    if (!admin) {
        showToast('Admin not found', 'error');
        return;
    }

    const currentUser = sessionStorage.getItem('welfare_username');
    if (admin.username === currentUser) {
        showToast('You cannot deactivate your own account', 'error');
        return;
    }

    const newStatus = admin.status === 'inactive' ? 'active' : 'inactive';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';

    if (confirm(`Are you sure you want to ${action} ${admin.name}?`)) {
        try {
            await WelfareDB.updateAdmin(adminId, {
                status: newStatus,
                updatedAt: new Date().toISOString(),
                updatedBy: currentUser
            });

            // Log the action
            await WelfareDB.addAuditLog({
                action: `admin_${action}d`,
                performedBy: currentUser,
                target: admin.username,
                timestamp: new Date().toISOString(),
                details: `${action.charAt(0).toUpperCase() + action.slice(1)} admin account`
            });

            showToast(`Admin ${action}d successfully`, 'success');
            
        } catch (error) {
            console.error(`Error ${action}ing admin:`, error);
            showToast(`Error ${action}ing admin account`, 'error');
        }
    }
}

// Save system configuration
async function saveSystemConfig() {
    const configData = {
        systemName: document.getElementById('systemName').value,
        currency: document.getElementById('systemCurrency').value,
        contributionDeadline: parseInt(document.getElementById('contributionDeadline').value),
        withdrawalReserve: parseInt(document.getElementById('withdrawalReserve').value),
        autoReminders: document.getElementById('autoReminders').value,
        maxEmergencyWithdrawal: parseInt(document.getElementById('maxEmergencyWithdrawal').value),
        updatedAt: new Date().toISOString(),
        updatedBy: sessionStorage.getItem('welfare_username') || 'System'
    };

    try {
        await WelfareDB.updateSystemConfig(configData);
        
        // Log the action
        await WelfareDB.addAuditLog({
            action: 'system_config_updated',
            performedBy: sessionStorage.getItem('welfare_username') || 'System',
            target: 'system_config',
            timestamp: new Date().toISOString(),
            details: 'Updated system configuration'
        });

        showToast('System configuration saved successfully', 'success');
        
    } catch (error) {
        console.error('Error saving system configuration:', error);
        showToast('Error saving system configuration', 'error');
    }
}

// Save security configuration
async function saveSecurityConfig() {
    const securityData = {
        sessionTimeout: parseInt(document.getElementById('sessionTimeout').value),
        maxLoginAttempts: parseInt(document.getElementById('maxLoginAttempts').value),
        passwordExpiry: parseInt(document.getElementById('passwordExpiry').value),
        requireStrongPassword: document.getElementById('requireStrongPassword').checked,
        twoFactorAuth: document.getElementById('twoFactorAuth').checked,
        loginNotifications: document.getElementById('loginNotifications').checked,
        updatedAt: new Date().toISOString(),
        updatedBy: sessionStorage.getItem('welfare_username') || 'System'
    };

    try {
        await WelfareDB.updateSystemConfig(securityData);
        
        // Log the action
        await WelfareDB.addAuditLog({
            action: 'security_config_updated',
            performedBy: sessionStorage.getItem('welfare_username') || 'System',
            target: 'security_config',
            timestamp: new Date().toISOString(),
            details: 'Updated security configuration'
        });

        showToast('Security configuration updated successfully', 'success');
        
    } catch (error) {
        console.error('Error saving security configuration:', error);
        showToast('Error saving security configuration', 'error');
    }
}

// Update system health
function updateSystemHealth() {
    // This would typically fetch real system metrics
    document.getElementById('dbSize').textContent = '2.4 MB';
    document.getElementById('activeUsers').textContent = '3';
    document.getElementById('systemUptime').textContent = '99.9%';
    document.getElementById('securityScore').textContent = 'A+';
}

// Create system backup
async function createBackup() {
    try {
        showLoading('Creating system backup...');
        
        const backupData = {
            id: 'backup_' + Date.now(),
            name: `System_Backup_${new Date().toISOString().split('T')[0]}`,
            type: 'full',
            size: 0,
            createdAt: new Date().toISOString(),
            createdBy: sessionStorage.getItem('welfare_username') || 'System',
            status: 'completed'
        };

        // In a real implementation, this would export all data
        const exportData = {
            members: await WelfareDB.getMembers(),
            contributions: await WelfareDB.getContributions(),
            withdrawals: await WelfareDB.getWithdrawals(),
            welfareApplications: await WelfareDB.getWelfareApplications(),
            admins: await WelfareDB.getAdmins(),
            systemConfig: await WelfareDB.getSystemConfig(),
            metadata: {
                exportedAt: new Date().toISOString(),
                version: '1.0',
                totalRecords: Object.keys(await WelfareDB.getMembers()).length +
                             Object.keys(await WelfareDB.getContributions()).length +
                             Object.keys(await WelfareDB.getWithdrawals()).length
            }
        };

        // Create downloadable file
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        backupData.size = dataBlob.size;

        // Save backup record
        await WelfareDB.addBackup(backupData);
        
        // Log the action
        await WelfareDB.addAuditLog({
            action: 'system_backup_created',
            performedBy: sessionStorage.getItem('welfare_username') || 'System',
            target: 'system_backup',
            timestamp: new Date().toISOString(),
            details: `Created system backup: ${backupData.name}`
        });

        hideLoading();
        showToast('System backup created successfully', 'success');
        loadBackupList();
        
    } catch (error) {
        hideLoading();
        console.error('Error creating backup:', error);
        showToast('Error creating system backup', 'error');
    }
}

// Load backup list
async function loadBackupList() {
    try {
        const backups = await WelfareDB.getBackups();
        const container = document.getElementById('backupsTable');
        
        if (!backups || Object.keys(backups).length === 0) {
            container.innerHTML = '<tr><td colspan="6" class="no-data">No backups found</td></tr>';
            return;
        }
        
        const backupsArray = Object.values(backups)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        container.innerHTML = backupsArray.map(backup => `
            <tr>
                <td><strong>${backup.name}</strong></td>
                <td>${new Date(backup.createdAt).toLocaleDateString()}</td>
                <td>${(backup.size / 1024 / 1024).toFixed(2)} MB</td>
                <td>
                    <span class="backup-type-${backup.type}">
                        ${backup.type.charAt(0).toUpperCase() + backup.type.slice(1)} Backup
                    </span>
                </td>
                <td><span class="status-${backup.status}">${backup.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-secondary" onclick="downloadBackup('${backup.id}')">📥 Download</button>
                        <button class="btn-danger" onclick="deleteBackup('${backup.id}')">🗑️ Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading backups:', error);
    }
}

// Utility functions
function formatRoleName(role) {
    const roleNames = {
        'super_admin': 'Super Administrator',
        'admin': 'Administrator',
        'manager': 'Manager',
        'viewer': 'Viewer',
        'custom': 'Custom Role'
    };
    return roleNames[role] || role;
}

function formatPermissionName(permission) {
    const permissionNames = {
        'member_management': 'Member Management',
        'contribution_management': 'Contributions',
        'withdrawal_management': 'Withdrawals',
        'welfare_management': 'Welfare Services',
        'report_generation': 'Reports',
        'system_settings': 'System Settings'
    };
    return permissionNames[permission] || permission;
}

function getPermissionPreview(permissions) {
    if (!permissions || permissions.length === 0) return 'No permissions';
    if (permissions[0] === 'all') return 'All permissions';
    
    return permissions.slice(0, 2).map(perm => formatPermissionName(perm)).join(', ') + 
           (permissions.length > 2 ? ` +${permissions.length - 2} more` : '');
}

// Check if current user is super admin
function checkSuperAdmin() {
    const currentUser = sessionStorage.getItem('welfare_username');
    const admin = Object.values(admins).find(a => a.username === currentUser);
    return admin && admin.role === 'super_admin';
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
document.getElementById('addAdminForm').addEventListener('submit', function(e) {
    e.preventDefault();
    createNewAdmin();
});

document.getElementById('systemConfigForm').addEventListener('submit', function(e) {
    e.preventDefault();
    saveSystemConfig();
});

document.getElementById('securityConfigForm').addEventListener('submit', function(e) {
    e.preventDefault();
    saveSecurityConfig();
});

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = ['addAdminModal', 'editAdminModal', 'systemBackupModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target === modal) {
            if (modalId === 'addAdminModal') closeAddAdminModal();
            if (modalId === 'editAdminModal') closeEditAdminModal();
            if (modalId === 'systemBackupModal') closeSystemBackupModal();
        }
    });
}

// Initialize admin settings when page loads
document.addEventListener('DOMContentLoaded', initializeAdminSettings);
