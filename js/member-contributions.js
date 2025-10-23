// Check authentication and role
if (!checkAuth() || sessionStorage.getItem('welfare_role') !== 'member') {
    window.location.href = 'index.html';
}

const memberId = sessionStorage.getItem('welfare_userId');
let memberData = {};
let contributions = {};
let currentFilters = {
    year: '',
    month: ''
};

// Initialize member contributions
async function initializeMemberContributions() {
    try {
        console.log('Initializing member contributions for:', memberId);
        
        await loadMemberData();
        await loadContributions();
        setupRealtimeListeners();
        
        updateSummaryCards();
        renderPaymentCalendar();
        applyFilters();
        
        console.log('Member contributions initialized successfully');
        
    } catch (error) {
        console.error('Error initializing member contributions:', error);
        showToast('Error loading contributions data', 'error');
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
        document.getElementById('monthlyContributionDisplay').textContent = `GH₵ ${parseFloat(memberData.monthlyContribution || 0).toFixed(2)}`;
        
    } catch (error) {
        console.error('Error loading member data:', error);
        throw error;
    }
}

// Load contributions
async function loadContributions() {
    try {
        contributions = await WelfareDB.getMemberContributions(memberId);
        console.log('Member contributions loaded:', Object.keys(contributions).length);
    } catch (error) {
        console.error('Error loading contributions:', error);
        throw error;
    }
}

// Set up real-time listeners
function setupRealtimeListeners() {
    WelfareDB.onContributionsChange((newContributions) => {
        const memberContributions = {};
        Object.keys(newContributions).forEach(key => {
            if (newContributions[key].memberId === memberId) {
                memberContributions[key] = newContributions[key];
            }
        });
        contributions = memberContributions;
        updateSummaryCards();
        renderPaymentCalendar();
        applyFilters();
    });
}

// Update summary cards
function updateSummaryCards() {
    const contributionsArray = Object.values(contributions);
    const currentYear = new Date().getFullYear();
    
    // Total paid
    const totalPaid = contributionsArray.reduce((sum, contribution) => {
        return sum + (parseFloat(contribution.amount) || 0);
    }, 0);
    document.getElementById('totalPaidAmount').textContent = `GH₵ ${totalPaid.toFixed(2)}`;
    
    // This year's payments
    const yearPaid = contributionsArray.reduce((sum, contribution) => {
        if (contribution.year == currentYear) {
            return sum + (parseFloat(contribution.amount) || 0);
        }
        return sum;
    }, 0);
    document.getElementById('yearPaidAmount').textContent = `GH₵ ${yearPaid.toFixed(2)}`;
    
    // Average payment
    const averagePayment = contributionsArray.length > 0 ? totalPaid / contributionsArray.length : 0;
    document.getElementById('averagePayment').textContent = `GH₵ ${averagePayment.toFixed(2)}`;
    
    // Payment streak
    const streak = calculatePaymentStreak(contributionsArray);
    document.getElementById('paymentStreak').textContent = `${streak} months`;
}

// Calculate payment streak
function calculatePaymentStreak(contributionsArray) {
    if (contributionsArray.length === 0) return 0;
    
    // Sort by date descending
    const sortedContributions = contributionsArray.sort((a, b) => {
        const dateA = new Date(a.year, a.month - 1);
        const dateB = new Date(b.year, b.month - 1);
        return dateB - dateA;
    });
    
    let streak = 0;
    const currentDate = new Date();
    let expectedMonth = currentDate.getMonth() + 1;
    let expectedYear = currentDate.getFullYear();
    
    for (let i = 0; i < sortedContributions.length; i++) {
        const contribution = sortedContributions[i];
        if (contribution.month === expectedMonth && contribution.year === expectedYear) {
            streak++;
            expectedMonth--;
            if (expectedMonth === 0) {
                expectedMonth = 12;
                expectedYear--;
            }
        } else {
            break;
        }
    }
    
    return streak;
}

// Render payment calendar
function renderPaymentCalendar() {
    const calendarYears = document.getElementById('calendarYears');
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];
    
    calendarYears.innerHTML = years.map(year => `
        <div class="calendar-year">
            <h4>${year}</h4>
            <div class="calendar-months">
                ${Array.from({length: 12}, (_, i) => {
                    const month = i + 1;
                    const paid = Object.values(contributions).some(c => 
                        c.month == month && c.year == year
                    );
                    const currentMonth = new Date().getMonth() + 1;
                    const currentYear = new Date().getFullYear();
                    const isFuture = year > currentYear || (year === currentYear && month > currentMonth);
                    
                    return `
                        <div class="calendar-month ${paid ? 'paid' : ''} ${isFuture ? 'future' : ''}" 
                             onclick="${!paid && !isFuture ? `quickPay(${month}, ${year})` : ''}">
                            <span class="month-name">${getMonthName(month).substring(0, 3)}</span>
                            <span class="month-status">${paid ? '✓' : isFuture ? '' : '●'}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `).join('');
}

// Quick pay function
function quickPay(month, year) {
    document.getElementById('paymentMonth').value = month;
    document.getElementById('paymentYear').value = year;
    document.getElementById('paymentAmount').value = memberData.monthlyContribution || 0;
    
    makePayment();
}

// Apply filters
function applyFilters() {
    currentFilters.year = document.getElementById('contributionYearFilter').value;
    currentFilters.month = document.getElementById('contributionMonthFilter').value;
    
    const filteredContributions = Object.values(contributions).filter(contribution => {
        if (currentFilters.year && contribution.year != currentFilters.year) return false;
        if (currentFilters.month && contribution.month != currentFilters.month) return false;
        return true;
    });
    
    renderContributionsTable(filteredContributions);
}

// Clear filters
function clearFilters() {
    document.getElementById('contributionYearFilter').value = '';
    document.getElementById('contributionMonthFilter').value = '';
    currentFilters.year = '';
    currentFilters.month = '';
    applyFilters();
}

// Render contributions table
function renderContributionsTable(contributionsArray) {
    const tbody = document.getElementById('contributionsTableBody');
    const noContributions = document.getElementById('noContributions');
    
    if (contributionsArray.length === 0) {
        tbody.innerHTML = '';
        noContributions.style.display = 'block';
        return;
    }
    
    noContributions.style.display = 'none';
    
    // Sort by date descending
    contributionsArray.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    tbody.innerHTML = contributionsArray.map(contribution => {
        const paymentDate = new Date(contribution.timestamp);
        const status = contribution.status || 'completed';
        
        return `
            <tr>
                <td>${paymentDate.toLocaleDateString()}</td>
                <td>${getMonthName(contribution.month)}</td>
                <td>${contribution.year}</td>
                <td><strong class="amount">GH₵ ${parseFloat(contribution.amount).toFixed(2)}</strong></td>
                <td>${contribution.paymentMethod || 'N/A'}</td>
                <td><span class="status-${status}">${status}</span></td>
                <td>${contribution.reference || 'N/A'}</td>
                <td>
                    <button class="btn-secondary" onclick="viewContributionDetails('${contribution.id}')">👁️ View</button>
                    ${status === 'pending' ? `
                        <button class="btn-danger" onclick="cancelContribution('${contribution.id}')">❌ Cancel</button>
                    ` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

// View contribution details
function viewContributionDetails(contributionId) {
    const contribution = contributions[contributionId];
    if (contribution) {
        const details = `
Contribution Details:
--------------------
Date: ${new Date(contribution.timestamp).toLocaleString()}
Month: ${getMonthName(contribution.month)} ${contribution.year}
Amount: GH₵ ${parseFloat(contribution.amount).toFixed(2)}
Payment Method: ${contribution.paymentMethod}
Reference: ${contribution.reference || 'N/A'}
Status: ${contribution.status}
Recorded By: ${contribution.recordedBy}
${contribution.notes ? `Notes: ${contribution.notes}` : ''}
        `;
        alert(details);
    }
}

// Cancel contribution (only for pending ones)
function cancelContribution(contributionId) {
    const contribution = contributions[contributionId];
    if (contribution && contribution.status === 'pending') {
        if (confirm('Are you sure you want to cancel this pending payment?')) {
            WelfareDB.updateContribution(contributionId, {
                status: 'cancelled',
                cancelledAt: new Date().toISOString()
            })
            .then(() => {
                showToast('Payment cancelled successfully', 'success');
            })
            .catch(error => {
                console.error('Error cancelling payment:', error);
                showToast('Error cancelling payment', 'error');
            });
        }
    }
}

// Make payment function
function makePayment() {
    const currentDate = new Date();
    if (!document.getElementById('paymentMonth').value) {
        document.getElementById('paymentMonth').value = currentDate.getMonth() + 1;
    }
    if (!document.getElementById('paymentYear').value) {
        document.getElementById('paymentYear').value = currentDate.getFullYear();
    }
    if (!document.getElementById('paymentAmount').value) {
        document.getElementById('paymentAmount').value = memberData.monthlyContribution || 0;
    }
    
    updatePaymentSummary();
    
    document.getElementById('paymentModal').style.display = 'block';
    
    // Add event listeners for real-time summary updates
    document.getElementById('paymentAmount').addEventListener('input', updatePaymentSummary);
    document.getElementById('paymentMonth').addEventListener('change', updatePaymentSummary);
    document.getElementById('paymentYear').addEventListener('change', updatePaymentSummary);
}

// Close payment modal
function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
    document.getElementById('paymentForm').reset();
    
    // Remove event listeners
    document.getElementById('paymentAmount').removeEventListener('input', updatePaymentSummary);
    document.getElementById('paymentMonth').removeEventListener('change', updatePaymentSummary);
    document.getElementById('paymentYear').removeEventListener('change', updatePaymentSummary);
}

// Update payment summary
function updatePaymentSummary() {
    const amount = parseFloat(document.getElementById('paymentAmount').value) || 0;
    const month = document.getElementById('paymentMonth').value;
    const year = document.getElementById('paymentYear').value;
    
    document.getElementById('summaryPaymentAmount').textContent = `GH₵ ${amount.toFixed(2)}`;
    
    if (month && year) {
        document.getElementById('summaryPaymentPeriod').textContent = `${getMonthName(month)} ${year}`;
    }
}

// Submit payment
async function submitPayment() {
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const month = document.getElementById('paymentMonth').value;
    const year = document.getElementById('paymentYear').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const reference = document.getElementById('paymentReference').value.trim();
    const notes = document.getElementById('paymentNotes').value.trim();

    if (!amount || !month || !year || !paymentMethod || !reference) {
        showToast('Please fill in all required fields.', 'error');
        return;
    }

    if (amount <= 0) {
        showToast('Please enter a valid amount.', 'error');
        return;
    }

    try {
        // Check if payment already exists for this month
        const existingPayment = Object.values(contributions).find(contribution => 
            contribution.memberId === memberId && 
            contribution.month == month && 
            contribution.year == year
        );

        if (existingPayment && existingPayment.status !== 'cancelled') {
            const overwrite = confirm(`You already have a payment recorded for ${getMonthName(month)} ${year}. Do you want to update it?`);
            if (!overwrite) {
                return;
            }
        }

        const contributionData = {
            memberId: memberId,
            memberName: memberData.name,
            amount: amount,
            month: parseInt(month),
            year: parseInt(year),
            paymentMethod: paymentMethod,
            reference: reference,
            notes: notes,
            status: 'pending', // Admin will verify
            timestamp: new Date().toISOString(),
            recordedBy: 'Member Self-Service'
        };

        await WelfareDB.addContribution(contributionData);
        
        closePaymentModal();
        showToast('Payment submitted successfully! It will be verified by admin.', 'success');
        
    } catch (error) {
        console.error('Error submitting payment:', error);
        showToast('Error submitting payment: ' + error.message, 'error');
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
document.getElementById('paymentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    submitPayment();
});

// Filter event listeners
document.getElementById('contributionYearFilter').addEventListener('change', applyFilters);
document.getElementById('contributionMonthFilter').addEventListener('change', applyFilters);

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('paymentModal');
    if (event.target === modal) {
        closePaymentModal();
    }
}

// Initialize contributions when page loads
document.addEventListener('DOMContentLoaded', initializeMemberContributions);
