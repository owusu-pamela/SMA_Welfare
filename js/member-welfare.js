// Check authentication and role
if (!checkAuth() || sessionStorage.getItem('welfare_role') !== 'member') {
    window.location.href = 'index.html';
}

const memberId = sessionStorage.getItem('welfare_userId');
let memberData = {};
let contributions = {};
let welfareApplications = {};
let selectedServiceType = '';

// Service configurations
const welfareServices = {
    medical: { name: 'Medical Support', maxAmount: 5000, minMonths: 6, icon: '🏥' },
    education: { name: 'Education Support', maxAmount: 3000, minMonths: 12, icon: '🎓' },
    housing: { name: 'Housing Support', maxAmount: 2500, minMonths: 9, icon: '🏠' },
    bereavement: { name: 'Bereavement Support', maxAmount: 1500, minMonths: 3, icon: '⚰️' },
    emergency: { name: 'Emergency Support', maxAmount: 1000, minMonths: 3, icon: '🚗' },
    business: { name: 'Business Support', maxAmount: 4000, minMonths: 18, icon: '💼' }
};

// Initialize member welfare
async function initializeMemberWelfare() {
    try {
        console.log('Initializing member welfare for:', memberId);
        
        await loadMemberData();
        await loadContributions();
        await loadWelfareApplications();
        
        calculateEligibility();
        renderApplicationsTable();
        
        console.log('Member welfare initialized successfully');
        
    } catch (error) {
        console.error('Error initializing member welfare:', error);
        showToast('Error loading welfare data', 'error');
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

// Load welfare applications
async function loadWelfareApplications() {
    try {
        welfareApplications = await WelfareDB.getMemberWelfareApplications(memberId);
        console.log('Welfare applications loaded:', Object.keys(welfareApplications).length);
    } catch (error) {
        console.error('Error loading welfare applications:', error);
        throw error;
    }
}

// Calculate eligibility
function calculateEligibility() {
    const joinDate = new Date(memberData.joinDate);
    const currentDate = new Date();
    const monthsAsMember = (currentDate.getFullYear() - joinDate.getFullYear()) * 12 + 
                          (currentDate.getMonth() - joinDate.getMonth());
    
    // Total contributions
    const totalContributions = Object.values(contributions).reduce((sum, contribution) => {
        return sum + (parseFloat(contribution.amount) || 0);
    }, 0);
    
    // Payment consistency (percentage of months paid)
    const expectedMonths = Math.max(1, monthsAsMember);
    const paidMonths = new Set(Object.values(contributions).map(c => `${c.year}-${c.month}`)).size;
    const paymentConsistency = Math.round((paidMonths / expectedMonths) * 100);
    
    // Update display
    document.getElementById('membershipDuration').textContent = `${monthsAsMember} months`;
    document.getElementById('totalContributionsEligibility').textContent = `GH₵ ${totalContributions.toFixed(2)}`;
    document.getElementById('paymentConsistency').textContent = `${paymentConsistency}%`;
    
    // Overall eligibility
    let eligibilityStatus = 'Not Eligible';
    let eligibilityClass = 'status-cancelled';
    
    if (monthsAsMember >= 3 && paymentConsistency >= 50) {
        eligibilityStatus = 'Partially Eligible';
        eligibilityClass = 'status-pending';
    }
    if (monthsAsMember >= 6 && paymentConsistency >= 75) {
        eligibilityStatus = 'Fully Eligible';
        eligibilityClass = 'status-verified';
    }
    
    document.getElementById('overallEligibility').textContent = eligibilityStatus;
    document.getElementById('overallEligibility').className = eligibilityClass;
    
    return {
        monthsAsMember,
        totalContributions,
        paymentConsistency,
        eligibilityStatus
    };
}

// Show application modal
function showApplicationModal(serviceType = '') {
    selectedServiceType = serviceType;
    
    // Reset form
    document.getElementById('applicationForm').reset();
    
    if (serviceType) {
        document.getElementById('applicationType').value = serviceType;
        updateAmountGuidance();
    }
    
    updateApplicationSummary();
    
    document.getElementById('applicationModal').style.display = 'block';
    
    // Add event listeners
    document.getElementById('applicationType').addEventListener('change', function() {
        selectedServiceType = this.value;
        updateAmountGuidance();
        updateApplicationSummary();
    });
    
    document.getElementById('applicationAmount').addEventListener('input', updateApplicationSummary);
}

// Close application modal
function closeApplicationModal() {
    document.getElementById('applicationModal').style.display = 'none';
    document.getElementById('applicationForm').reset();
    selectedServiceType = '';
    
    // Remove event listeners
    document.getElementById('applicationType').removeEventListener('change', updateAmountGuidance);
    document.getElementById('applicationAmount').removeEventListener('input', updateApplicationSummary);
}

// Update amount guidance based on selected service
function updateAmountGuidance() {
    const serviceType = document.getElementById('applicationType').value;
    const amountGuidance = document.getElementById('amountGuidance');
    
    if (serviceType && welfareServices[serviceType]) {
        const service = welfareServices[serviceType];
        amountGuidance.textContent = `Maximum amount for this service: GH₵ ${service.maxAmount.toFixed(2)}`;
        amountGuidance.style.display = 'block';
        
        // Set max amount
        document.getElementById('applicationAmount').max = service.maxAmount;
    } else {
        amountGuidance.style.display = 'none';
    }
}

// Update application summary
function updateApplicationSummary() {
    const serviceType = document.getElementById('applicationType').value;
    const amount = parseFloat(document.getElementById('applicationAmount').value) || 0;
    
    if (serviceType && welfareServices[serviceType]) {
        const service = welfareServices[serviceType];
        document.getElementById('summaryServiceType').textContent = service.name;
        document.getElementById('summaryAmount').textContent = `GH₵ ${amount.toFixed(2)}`;
        
        // Check eligibility for this specific service
        const eligibility = calculateEligibility();
        const isEligible = eligibility.monthsAsMember >= service.minMonths && 
                           eligibility.paymentConsistency >= 50;
        
        const eligibilityElement = document.getElementById('summaryEligibility');
        if (isEligible) {
            eligibilityElement.textContent = 'Eligible';
            eligibilityElement.className = 'status-verified';
        } else {
            eligibilityElement.textContent = 'Not Eligible';
            eligibilityElement.className = 'status-cancelled';
        }
    }
}

// Apply for specific service
function applyForService(serviceType) {
    showApplicationModal(serviceType);
}

// Submit welfare application
async function submitWelfareApplication() {
    const serviceType = document.getElementById('applicationType').value;
    const amount = parseFloat(document.getElementById('applicationAmount').value);
    const purpose = document.getElementById('applicationPurpose').value.trim();
    const urgency = document.getElementById('applicationUrgency').value;
    const documents = document.getElementById('applicationDocuments').value.trim();
    const bankDetails = document.getElementById('applicationBankDetails').value.trim();

    // Validation
    if (!serviceType || !amount || !purpose) {
        showToast('Please fill in all required fields.', 'error');
        return;
    }

    if (amount < 100 || amount > welfareServices[serviceType].maxAmount) {
        showToast(`Amount must be between GH₵ 100 and GH₵ ${welfareServices[serviceType].maxAmount}`, 'error');
        return;
    }

    // Check eligibility
    const eligibility = calculateEligibility();
    const service = welfareServices[serviceType];
    const isEligible = eligibility.monthsAsMember >= service.minMonths && 
                       eligibility.paymentConsistency >= 50;

    if (!isEligible) {
        showToast(`You are not eligible for ${service.name}. Minimum requirement: ${service.minMonths} months membership with good payment history.`, 'error');
        return;
    }

    const submitBtn = document.getElementById('submitApplicationBtn');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        const applicationData = {
            memberId: memberId,
            memberName: memberData.name,
            serviceType: serviceType,
            serviceName: welfareServices[serviceType].name,
            amount: amount,
            purpose: purpose,
            urgency: urgency,
            supportingDocuments: documents,
            bankDetails: bankDetails,
            eligibilityScore: eligibility.paymentConsistency,
            membershipDuration: eligibility.monthsAsMember,
            submittedAt: new Date().toISOString(),
            status: 'pending'
        };

        await WelfareDB.submitWelfareApplication(applicationData);
        
        closeApplicationModal();
        showToast('Welfare application submitted successfully! It will be reviewed by the committee.', 'success');
        
        // Reload applications
        await loadWelfareApplications();
        renderApplicationsTable();
        
    } catch (error) {
        console.error('Error submitting welfare application:', error);
        showToast('Error submitting application: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Render applications table
function renderApplicationsTable() {
    const tbody = document.getElementById('applicationsTableBody');
    const noApplications = document.getElementById('noApplications');
    const applicationsArray = Object.values(welfareApplications);
    
    if (applicationsArray.length === 0) {
        tbody.innerHTML = '';
        noApplications.style.display = 'block';
        return;
    }
    
    noApplications.style.display = 'none';
    
    // Sort by date descending
    applicationsArray.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    
    tbody.innerHTML = applicationsArray.map(application => {
        const submittedDate = new Date(application.submittedAt);
        const service = welfareServices[application.serviceType];
        
        return `
            <tr>
                <td>${submittedDate.toLocaleDateString()}</td>
                <td>${service?.icon || '📋'} ${application.serviceName}</td>
                <td><strong>GH₵ ${parseFloat(application.amount).toFixed(2)}</strong></td>
                <td>${application.purpose.substring(0, 50)}${application.purpose.length > 50 ? '...' : ''}</td>
                <td><span class="status-${application.status}">${application.status}</span></td>
                <td>${application.updatedAt ? new Date(application.updatedAt).toLocaleDateString() : '-'}</td>
                <td>
                    <button class="btn-secondary" onclick="viewApplicationDetails('${application.id}')">👁️ View</button>
                    ${application.status === 'pending' ? `
                        <button class="btn-danger" onclick="cancelApplication('${application.id}')">❌ Cancel</button>
                    ` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

// View application details
function viewApplicationDetails(applicationId) {
    const application = welfareApplications[applicationId];
    if (application) {
        const service = welfareServices[application.serviceType];
        const details = `
Welfare Application Details:
---------------------------
Application ID: ${application.id}
Service: ${service?.icon || ''} ${application.serviceName}
Amount Requested: GH₵ ${parseFloat(application.amount).toFixed(2)}
Purpose: ${application.purpose}
Urgency: ${application.urgency}
Status: ${application.status}
Submitted: ${new Date(application.submittedAt).toLocaleString()}
${application.updatedAt ? `Last Updated: ${new Date(application.updatedAt).toLocaleString()}` : ''}
${application.supportingDocuments ? `Supporting Documents: ${application.supportingDocuments}` : ''}
${application.bankDetails ? `Bank Details: ${application.bankDetails}` : ''}
${application.adminNotes ? `Admin Notes: ${application.adminNotes}` : ''}
        `;
        alert(details);
    }
}

// Cancel application
function cancelApplication(applicationId) {
    const application = welfareApplications[applicationId];
    if (application && application.status === 'pending') {
        if (confirm('Are you sure you want to cancel this welfare application?')) {
            WelfareDB.updateWelfareApplication(applicationId, {
                status: 'cancelled',
                cancelledAt: new Date().toISOString(),
                cancelledBy: 'Member'
            })
            .then(() => {
                showToast('Application cancelled successfully', 'success');
                // Reload applications
                loadWelfareApplications().then(renderApplicationsTable);
            })
            .catch(error => {
                console.error('Error cancelling application:', error);
                showToast('Error cancelling application', 'error');
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
document.getElementById('applicationForm').addEventListener('submit', function(e) {
    e.preventDefault();
    submitWelfareApplication();
});

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('applicationModal');
    if (event.target === modal) {
        closeApplicationModal();
    }
}

// Initialize welfare when page loads
document.addEventListener('DOMContentLoaded', initializeMemberWelfare);
