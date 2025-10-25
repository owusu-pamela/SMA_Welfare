// Check authentication and role
if (!checkAuth() || !checkAdmin()) {
    window.location.href = 'index.html';
}

let welfareServices = {};
let welfareApplications = {};
let members = {};
let currentApplicationId = null;

// Initialize welfare management
async function initializeWelfareManagement() {
    try {
        console.log('Initializing welfare management...');
        
        await loadWelfareData();
        setupRealtimeListeners();
        
        updateWelfareStats();
        renderServicesGrid();
        renderApplicationsTable();
        populateQueueFilter();
        
        console.log('Welfare management initialized successfully');
        
    } catch (error) {
        console.error('Error initializing welfare management:', error);
        showToast('Error loading welfare data', 'error');
    }
}

// Load welfare data
async function loadWelfareData() {
    try {
        welfareServices = await WelfareDB.getWelfareServices();
        welfareApplications = await WelfareDB.getWelfareApplications();
        members = await WelfareDB.getMembers();
        
        console.log('Welfare data loaded:', {
            services: Object.keys(welfareServices).length,
            applications: Object.keys(welfareApplications).length,
            members: Object.keys(members).length
        });
        
    } catch (error) {
        console.error('Error loading welfare data:', error);
        throw error;
    }
}

// Set up real-time listeners
function setupRealtimeListeners() {
    WelfareDB.onWelfareServicesChange((newServices) => {
        welfareServices = newServices;
        renderServicesGrid();
        populateQueueFilter();
    });

    WelfareDB.onWelfareApplicationsChange((newApplications) => {
        welfareApplications = newApplications;
        updateWelfareStats();
        renderApplicationsTable();
        updateApplicationsQueue();
    });
}

// Update welfare statistics
function updateWelfareStats() {
    const applicationsArray = Object.values(welfareApplications);
    
    // Total applications
    document.getElementById('totalApplications').textContent = applicationsArray.length;
    
    // Pending applications
    const pendingApplications = applicationsArray.filter(app => app.status === 'pending').length;
    document.getElementById('pendingApplications').textContent = `${pendingApplications} Pending`;
    
    // Approved applications
    const approvedApplications = applicationsArray.filter(app => app.status === 'approved').length;
    document.getElementById('approvedApplications').textContent = approvedApplications;
    
    // Approved amount
    const approvedAmount = applicationsArray
        .filter(app => app.status === 'approved')
        .reduce((sum, app) => sum + (parseFloat(app.approvedAmount || app.amount) || 0), 0);
    document.getElementById('approvedAmount').textContent = `GH₵ ${approvedAmount.toFixed(2)}`;
    
    // Rejected applications
    const rejectedApplications = applicationsArray.filter(app => app.status === 'rejected').length;
    document.getElementById('rejectedApplications').textContent = rejectedApplications;
    
    // Total payout
    const totalPayout = applicationsArray
        .filter(app => app.status === 'completed')
        .reduce((sum, app) => sum + (parseFloat(app.payoutAmount || app.approvedAmount) || 0), 0);
    document.getElementById('totalPayout').textContent = `GH₵ ${totalPayout.toFixed(2)}`;
    
    // This month payout
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthPayout = applicationsArray
        .filter(app => app.status === 'completed' && app.completedAt)
        .filter(app => {
            const completedDate = new Date(app.completedAt);
            return completedDate.getMonth() + 1 === currentMonth && completedDate.getFullYear() === currentYear;
        })
        .reduce((sum, app) => sum + (parseFloat(app.payoutAmount || app.approvedAmount) || 0), 0);
    document.querySelector('#totalPayout + small').textContent = `This Month: GH₵ ${monthPayout.toFixed(2)}`;
}

// Render services grid
function renderServicesGrid() {
    const container = document.getElementById('servicesGrid');
    const activeServices = Object.values(welfareServices).filter(service => service.active !== false);
    
    if (activeServices.length === 0) {
        container.innerHTML = '<div class="no-data">No welfare services available</div>';
        return;
    }
    
    container.innerHTML = activeServices.map(service => `
        <div class="service-card">
            <div class="service-icon">🏥</div>
            <div class="service-info">
                <h4>${service.name}</h4>
                <p>${service.description || 'No description available'}</p>
                <div class="service-meta">
                    <span class="service-category">${service.category}</span>
                    ${service.maxAmount ? `<span class="service-amount">Max: GH₵ ${parseFloat(service.maxAmount).toFixed(2)}</span>` : ''}
                </div>
                <div class="service-requirements">
                    <small><strong>Requirements:</strong> ${service.requirements || 'None specified'}</small>
                </div>
            </div>
            <div class="service-actions">
                <button class="btn-secondary" onclick="editService('${service.id}')">✏️ Edit</button>
                <button class="btn-danger" onclick="toggleServiceActive('${service.id}')">🚫 Deactivate</button>
            </div>
        </div>
    `).join('');
}

// Render applications table
function renderApplicationsTable() {
    renderPendingApplications();
    renderApprovedApplications();
    renderRejectedApplications();
    renderCompletedApplications();
    updateApplicationsQueue();
}

// Render pending applications
function renderPendingApplications() {
    const container = document.getElementById('pendingApplicationsTable');
    const pendingApps = Object.values(welfareApplications)
        .filter(app => app.status === 'pending')
        .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
    
    if (pendingApps.length === 0) {
        container.innerHTML = '<tr><td colspan="8" class="no-data">No pending applications</td></tr>';
        return;
    }
    
    container.innerHTML = pendingApps.map((app, index) => {
        const member = members[app.memberId];
        const service = welfareServices[app.serviceId];
        const submittedDate = new Date(app.submittedAt);
        
        return `
            <tr>
                <td><strong>${app.id.substring(0, 8)}</strong></td>
                <td>
                    <div class="member-info">
                        <strong>${member?.name || 'Unknown Member'}</strong>
                        <small>${member?.staffId || 'N/A'}</small>
                    </div>
                </td>
                <td>${service?.name || 'Unknown Service'}</td>
                <td><strong>GH₵ ${parseFloat(app.amount).toFixed(2)}</strong></td>
                <td>${submittedDate.toLocaleDateString()}</td>
                <td>
                    <span class="priority-${app.priority || 'medium'}">
                        ${(app.priority || 'medium').toUpperCase()}
                    </span>
                </td>
                <td>${index + 1}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-primary" onclick="reviewApplication('${app.id}')">👁️ Review</button>
                        <button class="btn-secondary" onclick="fastTrackApplication('${app.id}')">⚡ Fast Track</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Render approved applications
function renderApprovedApplications() {
    const container = document.getElementById('approvedApplicationsTable');
    const approvedApps = Object.values(welfareApplications)
        .filter(app => app.status === 'approved')
        .sort((a, b) => new Date(b.approvedAt) - new Date(a.approvedAt));
    
    if (approvedApps.length === 0) {
        container.innerHTML = '<tr><td colspan="8" class="no-data">No approved applications</td></tr>';
        return;
    }
    
    container.innerHTML = approvedApps.map(app => {
        const member = members[app.memberId];
        const service = welfareServices[app.serviceId];
        const approvedDate = new Date(app.approvedAt);
        
        return `
            <tr>
                <td><strong>${app.id.substring(0, 8)}</strong></td>
                <td>${member?.name || 'Unknown Member'}</td>
                <td>${service?.name || 'Unknown Service'}</td>
                <td><strong>GH₵ ${parseFloat(app.approvedAmount || app.amount).toFixed(2)}</strong></td>
                <td>${approvedDate.toLocaleDateString()}</td>
                <td>${app.approvedBy || 'System'}</td>
                <td><span class="status-approved">Approved</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-primary" onclick="processPayout('${app.id}')">💰 Payout</button>
                        <button class="btn-secondary" onclick="viewApplicationDetails('${app.id}')">📋 Details</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Render rejected applications
function renderRejectedApplications() {
    const container = document.getElementById('rejectedApplicationsTable');
    const rejectedApps = Object.values(welfareApplications)
        .filter(app => app.status === 'rejected')
        .sort((a, b) => new Date(b.rejectedAt) - new Date(a.rejectedAt));
    
    if (rejectedApps.length === 0) {
        container.innerHTML = '<tr><td colspan="8" class="no-data">No rejected applications</td></tr>';
        return;
    }
    
    container.innerHTML = rejectedApps.map(app => {
        const member = members[app.memberId];
        const service = welfareServices[app.serviceId];
        const rejectedDate = new Date(app.rejectedAt);
        
        return `
            <tr>
                <td><strong>${app.id.substring(0, 8)}</strong></td>
                <td>${member?.name || 'Unknown Member'}</td>
                <td>${service?.name || 'Unknown Service'}</td>
                <td><strong>GH₵ ${parseFloat(app.amount).toFixed(2)}</strong></td>
                <td>${rejectedDate.toLocaleDateString()}</td>
                <td>${app.rejectionReason || 'No reason provided'}</td>
                <td>${app.rejectedBy || 'System'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-secondary" onclick="viewApplicationDetails('${app.id}')">📋 Details</button>
                        <button class="btn-primary" onclick="reconsiderApplication('${app.id}')">🔄 Reconsider</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Render completed applications
function renderCompletedApplications() {
    const container = document.getElementById('completedApplicationsTable');
    const completedApps = Object.values(welfareApplications)
        .filter(app => app.status === 'completed')
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    
    if (completedApps.length === 0) {
        container.innerHTML = '<tr><td colspan="8" class="no-data">No completed applications</td></tr>';
        return;
    }
    
    container.innerHTML = completedApps.map(app => {
        const member = members[app.memberId];
        const service = welfareServices[app.serviceId];
        const completedDate = new Date(app.completedAt);
        
        return `
            <tr>
                <td><strong>${app.id.substring(0, 8)}</strong></td>
                <td>${member?.name || 'Unknown Member'}</td>
                <td>${service?.name || 'Unknown Service'}</td>
                <td><strong>GH₵ ${parseFloat(app.payoutAmount || app.approvedAmount).toFixed(2)}</strong></td>
                <td>${completedDate.toLocaleDateString()}</td>
                <td>${app.serviceProvided || 'Financial Assistance'}</td>
                <td>${app.servedBy || 'System'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-secondary" onclick="viewApplicationDetails('${app.id}')">📋 Details</button>
                        <button class="btn-primary" onclick="generateServiceCertificate('${app.id}')">📄 Certificate</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Update applications queue
function updateApplicationsQueue() {
    const container = document.getElementById('applicationsQueue');
    const pendingApps = Object.values(welfareApplications)
        .filter(app => app.status === 'pending')
        .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt))
        .slice(0, 5);
    
    if (pendingApps.length === 0) {
        container.innerHTML = '<div class="no-data">No applications in queue</div>';
        return;
    }
    
    container.innerHTML = pendingApps.map((app, index) => {
        const member = members[app.memberId];
        const service = welfareServices[app.serviceId];
        const submittedDate = new Date(app.submittedAt);
        const waitingTime = Math.floor((new Date() - submittedDate) / (1000 * 60 * 60 * 24));
        
        return `
            <div class="queue-item">
                <div class="queue-position">#${index + 1}</div>
                <div class="queue-info">
                    <strong>${member?.name || 'Unknown Member'}</strong>
                    <small>${service?.name || 'Unknown Service'} • GH₵ ${parseFloat(app.amount).toFixed(2)}</small>
                    <small>Submitted: ${submittedDate.toLocaleDateString()} (${waitingTime} days ago)</small>
                </div>
                <div class="queue-actions">
                    <button class="btn-primary" onclick="reviewApplication('${app.id}')">Review Now</button>
                </div>
            </div>
        `;
    }).join('');
}

// Populate queue filter
function populateQueueFilter() {
    const filter = document.getElementById('queueFilter');
    const services = Object.values(welfareServices);
    
    filter.innerHTML = '<option value="">All Services</option>' +
        services.map(service => `<option value="${service.id}">${service.name}</option>`).join('');
}

// Filter applications
function filterApplications() {
    const serviceId = document.getElementById('queueFilter').value;
    // Implementation would filter the displayed applications
    showToast('Filter functionality will be implemented', 'info');
}

// Show add service modal
function showAddServiceModal() {
    document.getElementById('addServiceForm').reset();
    document.getElementById('addServiceModal').style.display = 'block';
}

// Close add service modal
function closeAddServiceModal() {
    document.getElementById('addServiceModal').style.display = 'none';
}

// Add new welfare service
async function addWelfareService() {
    const formData = new FormData(document.getElementById('addServiceForm'));
    
    const serviceData = {
        name: document.getElementById('serviceName').value,
        description: document.getElementById('serviceDescription').value,
        category: document.getElementById('serviceCategory').value,
        maxAmount: document.getElementById('serviceMaxAmount').value ? parseFloat(document.getElementById('serviceMaxAmount').value) : null,
        requirements: document.getElementById('serviceRequirements').value,
        documents: document.getElementById('serviceDocuments').value,
        active: document.getElementById('serviceActive').checked,
        createdAt: new Date().toISOString(),
        createdBy: sessionStorage.getItem('welfare_username') || 'Admin'
    };

    try {
        const serviceId = 'service_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        serviceData.id = serviceId;

        await WelfareDB.addWelfareService(serviceData);
        
        closeAddServiceModal();
        showToast('Welfare service added successfully!', 'success');
        
    } catch (error) {
        console.error('Error adding welfare service:', error);
        showToast('Error adding welfare service: ' + error.message, 'error');
    }
}

// Show manage services modal
function showManageServicesModal() {
    document.getElementById('manageServicesModal').style.display = 'block';
    renderServicesManagementList();
}

// Close manage services modal
function closeManageServicesModal() {
    document.getElementById('manageServicesModal').style.display = 'none';
}

// Render services management list
function renderServicesManagementList() {
    const container = document.getElementById('servicesManagementList');
    const allServices = Object.values(welfareServices);
    
    if (allServices.length === 0) {
        container.innerHTML = '<div class="no-data">No welfare services to manage</div>';
        return;
    }
    
    container.innerHTML = allServices.map(service => `
        <div class="service-management-item">
            <div class="service-management-info">
                <h4>${service.name} <span class="service-status ${service.active ? 'active' : 'inactive'}">${service.active ? 'ACTIVE' : 'INACTIVE'}</span></h4>
                <p>${service.description || 'No description'}</p>
                <div class="service-management-meta">
                    <span>Category: ${service.category}</span>
                    ${service.maxAmount ? `<span>Max Amount: GH₵ ${parseFloat(service.maxAmount).toFixed(2)}</span>` : ''}
                    <span>Applications: ${Object.values(welfareApplications).filter(app => app.serviceId === service.id).length}</span>
                </div>
            </div>
            <div class="service-management-actions">
                <button class="btn-primary" onclick="editService('${service.id}')">✏️ Edit</button>
                <button class="${service.active ? 'btn-danger' : 'btn-success'}" onclick="toggleServiceActive('${service.id}')">
                    ${service.active ? '🚫 Deactivate' : '✅ Activate'}
                </button>
                <button class="btn-danger" onclick="deleteService('${service.id}')">🗑️ Delete</button>
            </div>
        </div>
    `).join('');
}

// Toggle service active status
async function toggleServiceActive(serviceId) {
    const service = welfareServices[serviceId];
    if (service) {
        const newActiveStatus = !service.active;
        
        try {
            await WelfareDB.updateWelfareService(serviceId, {
                active: newActiveStatus,
                updatedAt: new Date().toISOString()
            });
            
            showToast(`Service ${newActiveStatus ? 'activated' : 'deactivated'} successfully`, 'success');
            
        } catch (error) {
            console.error('Error updating service status:', error);
            showToast('Error updating service status', 'error');
        }
    }
}

// Review application
async function reviewApplication(applicationId) {
    const application = welfareApplications[applicationId];
    if (!application) {
        showToast('Application not found', 'error');
        return;
    }

    const member = members[application.memberId];
    const service = welfareServices[application.serviceId];
    
    currentApplicationId = applicationId;

    const reviewContent = `
        <div class="application-review">
            <div class="review-section">
                <h4>Application Details</h4>
                <div class="review-details">
                    <div class="detail-item">
                        <label>Application ID:</label>
                        <span>${application.id}</span>
                    </div>
                    <div class="detail-item">
                        <label>Submitted:</label>
                        <span>${new Date(application.submittedAt).toLocaleString()}</span>
                    </div>
                    <div class="detail-item">
                        <label>Service Type:</label>
                        <span>${service?.name || 'Unknown Service'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Requested Amount:</label>
                        <span><strong>GH₵ ${parseFloat(application.amount).toFixed(2)}</strong></span>
                    </div>
                </div>
            </div>

            <div class="review-section">
                <h4>Member Information</h4>
                <div class="review-details">
                    <div class="detail-item">
                        <label>Name:</label>
                        <span>${member?.title || ''} ${member?.name || 'Unknown Member'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Staff ID:</label>
                        <span>${member?.staffId || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Department:</label>
                        <span>${member?.department || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Contact:</label>
                        <span>${member?.phone || 'N/A'} • ${member?.email || 'N/A'}</span>
                    </div>
                </div>
            </div>

            <div class="review-section">
                <h4>Application Description</h4>
                <div class="application-description">
                    <p>${application.description || 'No description provided'}</p>
                </div>
            </div>

            ${application.supportingDocuments ? `
            <div class="review-section">
                <h4>Supporting Documents</h4>
                <div class="supporting-documents">
                    <p>${application.supportingDocuments}</p>
                </div>
            </div>
            ` : ''}

            <div class="review-section">
                <h4>Review & Decision</h4>
                <form id="reviewDecisionForm">
                    <div class="form-group">
                        <label for="reviewStatus">Decision *</label>
                        <select id="reviewStatus" required onchange="toggleRejectionReason()">
                            <option value="">Select Decision</option>
                            <option value="approved">Approve Application</option>
                            <option value="rejected">Reject Application</option>
                            <option value="more_info">Request More Information</option>
                        </select>
                    </div>
                    
                    <div class="form-group" id="approvedAmountGroup" style="display: none;">
                        <label for="approvedAmount">Approved Amount (GH₵)</label>
                        <input type="number" id="approvedAmount" min="0" step="0.01" value="${application.amount}">
                    </div>
                    
                    <div class="form-group" id="rejectionReasonGroup" style="display: none;">
                        <label for="rejectionReason">Rejection Reason *</label>
                        <textarea id="rejectionReason" rows="3" placeholder="Provide reason for rejection"></textarea>
                    </div>
                    
                    <div class="form-group" id="moreInfoGroup" style="display: none;">
                        <label for="informationRequest">Information Needed *</label>
                        <textarea id="informationRequest" rows="3" placeholder="Specify what additional information is required"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="reviewNotes">Review Notes</label>
                        <textarea id="reviewNotes" rows="3" placeholder="Additional notes about this application"></textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="closeReviewModal()">Cancel</button>
                        <button type="submit" class="btn-primary">💾 Submit Decision</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('reviewApplicationContent').innerHTML = reviewContent;
    document.getElementById('reviewApplicationModal').style.display = 'block';
}

// Toggle rejection reason field
function toggleRejectionReason() {
    const status = document.getElementById('reviewStatus').value;
    
    document.getElementById('approvedAmountGroup').style.display = status === 'approved' ? 'block' : 'none';
    document.getElementById('rejectionReasonGroup').style.display = status === 'rejected' ? 'block' : 'none';
    document.getElementById('moreInfoGroup').style.display = status === 'more_info' ? 'block' : 'none';
}

// Close review modal
function closeReviewModal() {
    document.getElementById('reviewApplicationModal').style.display = 'none';
    currentApplicationId = null;
}

// Submit review decision
async function submitReviewDecision() {
    const application = welfareApplications[currentApplicationId];
    if (!application) {
        showToast('Application not found', 'error');
        return;
    }

    const status = document.getElementById('reviewStatus').value;
    const notes = document.getElementById('reviewNotes').value;
    const adminName = sessionStorage.getItem('welfare_username') || 'Admin';

    const updateData = {
        reviewedAt: new Date().toISOString(),
        reviewedBy: adminName,
        reviewNotes: notes
    };

    try {
        if (status === 'approved') {
            const approvedAmount = parseFloat(document.getElementById('approvedAmount').value) || parseFloat(application.amount);
            updateData.status = 'approved';
            updateData.approvedAmount = approvedAmount;
            updateData.approvedAt = new Date().toISOString();
            updateData.approvedBy = adminName;

            // Create notification for member
            await WelfareDB.addNotification({
                memberId: application.memberId,
                title: 'Welfare Application Approved',
                message: `Your application for ${welfareServices[application.serviceId]?.name} has been approved for GH₵ ${approvedAmount.toFixed(2)}`,
                type: 'approval',
                priority: 'high'
            });

        } else if (status === 'rejected') {
            const rejectionReason = document.getElementById('rejectionReason').value;
            if (!rejectionReason) {
                showToast('Please provide a rejection reason', 'error');
                return;
            }

            updateData.status = 'rejected';
            updateData.rejectionReason = rejectionReason;
            updateData.rejectedAt = new Date().toISOString();
            updateData.rejectedBy = adminName;

            // Create notification for member
            await WelfareDB.addNotification({
                memberId: application.memberId,
                title: 'Welfare Application Update',
                message: `Your application has been reviewed. Status: Rejected. Reason: ${rejectionReason}`,
                type: 'rejection',
                priority: 'medium'
            });

        } else if (status === 'more_info') {
            const informationRequest = document.getElementById('informationRequest').value;
            if (!informationRequest) {
                showToast('Please specify what information is needed', 'error');
                return;
            }

            updateData.status = 'more_info_required';
            updateData.informationRequest = informationRequest;

            // Create notification for member
            await WelfareDB.addNotification({
                memberId: application.memberId,
                title: 'Additional Information Required',
                message: `Your welfare application requires additional information: ${informationRequest}`,
                type: 'info_request',
                priority: 'medium'
            });
        }

        await WelfareDB.updateWelfareApplication(currentApplicationId, updateData);
        
        closeReviewModal();
        showToast(`Application ${status} successfully`, 'success');
        
    } catch (error) {
        console.error('Error updating application:', error);
        showToast('Error processing application decision', 'error');
    }
}

// Process payout
async function processPayout(applicationId) {
    const application = welfareApplications[applicationId];
    if (!application || application.status !== 'approved') {
        showToast('Application not found or not approved', 'error');
        return;
    }

    const member = members[application.memberId];
    const service = welfareServices[application.serviceId];
    
    currentApplicationId = applicationId;

    const payoutContent = `
        <div class="payout-details">
            <div class="detail-item">
                <label>Member:</label>
                <span>${member?.name || 'Unknown Member'}</span>
            </div>
            <div class="detail-item">
                <label>Service:</label>
                <span>${service?.name || 'Unknown Service'}</span>
            </div>
            <div class="detail-item">
                <label>Approved Amount:</label>
                <span><strong>GH₵ ${parseFloat(application.approvedAmount || application.amount).toFixed(2)}</strong></span>
            </div>
            <div class="detail-item">
                <label>Application ID:</label>
                <span>${application.id}</span>
            </div>
        </div>
    `;

    document.getElementById('payoutApplicationContent').innerHTML = payoutContent;
    document.getElementById('payoutAmount').value = parseFloat(application.approvedAmount || application.amount);
    document.getElementById('payoutModal').style.display = 'block';
}

// Close payout modal
function closePayoutModal() {
    document.getElementById('payoutModal').style.display = 'none';
    currentApplicationId = null;
}

// Submit payout
async function submitPayout() {
    const application = welfareApplications[currentApplicationId];
    if (!application) {
        showToast('Application not found', 'error');
        return;
    }

    const payoutAmount = parseFloat(document.getElementById('payoutAmount').value);
    const payoutMethod = document.getElementById('payoutMethod').value;
    const payoutPurpose = document.getElementById('payoutPurpose').value;
    const payoutNotes = document.getElementById('payoutNotes').value;
    const adminName = sessionStorage.getItem('welfare_username') || 'Admin';

    if (!payoutAmount || !payoutMethod || !payoutPurpose) {
        showToast('Please fill all required fields', 'error');
        return;
    }

    try {
        // Update application status
        await WelfareDB.updateWelfareApplication(currentApplicationId, {
            status: 'completed',
            payoutAmount: payoutAmount,
            payoutMethod: payoutMethod,
            payoutPurpose: payoutPurpose,
            payoutNotes: payoutNotes,
            servedBy: adminName,
            completedAt: new Date().toISOString()
        });

        // Record the withdrawal from system balance
        const withdrawalData = {
            memberId: application.memberId,
            memberName: members[application.memberId]?.name || 'Unknown Member',
            amount: payoutAmount,
            type: 'welfare_payout',
            purpose: `Welfare Service: ${payoutPurpose}`,
            method: payoutMethod,
            status: 'completed',
            processedBy: adminName,
            timestamp: new Date().toISOString(),
            reference: `WELFARE-${currentApplicationId.substring(0, 8)}`
        };

        await WelfareDB.addWithdrawal(withdrawalData);

        // Create notification for member
        await WelfareDB.addNotification({
            memberId: application.memberId,
            title: 'Welfare Service Completed',
            message: `Your welfare service has been processed. Amount: GH₵ ${payoutAmount.toFixed(2)}. Method: ${payoutMethod}`,
            type: 'payout',
            priority: 'high'
        });

        closePayoutModal();
        showToast('Payout processed successfully', 'success');
        
    } catch (error) {
        console.error('Error processing payout:', error);
        showToast('Error processing payout', 'error');
    }
}

// Tab functionality
function openTab(tabName) {
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

// Generate welfare report
function generateWelfareReport() {
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
document.getElementById('addServiceForm').addEventListener('submit', function(e) {
    e.preventDefault();
    addWelfareService();
});

document.getElementById('reviewDecisionForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    submitReviewDecision();
});

document.getElementById('payoutForm').addEventListener('submit', function(e) {
    e.preventDefault();
    submitPayout();
});

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = ['addServiceModal', 'manageServicesModal', 'reviewApplicationModal', 'payoutModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target === modal) {
            if (modalId === 'addServiceModal') closeAddServiceModal();
            if (modalId === 'manageServicesModal') closeManageServicesModal();
            if (modalId === 'reviewApplicationModal') closeReviewModal();
            if (modalId === 'payoutModal') closePayoutModal();
        }
    });
}

// Initialize welfare management when page loads
document.addEventListener('DOMContentLoaded', initializeWelfareManagement);
