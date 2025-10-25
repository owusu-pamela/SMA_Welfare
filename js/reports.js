// Check authentication and role
if (!checkAuth() || !checkAdmin()) {
    window.location.href = 'index.html';
}

let members = {};
let contributions = {};
let withdrawals = {};
let welfareApplications = {};
let welfareServices = {};
let currentReportData = null;
let charts = {};

// Initialize reports system
async function initializeReports() {
    try {
        console.log('Initializing reports system...');
        
        await loadReportData();
        setupRealtimeListeners();
        
        initializeCharts();
        loadRecentReports();
        loadScheduledReports();
        
        console.log('Reports system initialized successfully');
        
    } catch (error) {
        console.error('Error initializing reports:', error);
        showToast('Error loading report data', 'error');
    }
}

// Load report data
async function loadReportData() {
    try {
        members = await WelfareDB.getMembers();
        contributions = await WelfareDB.getContributions();
        withdrawals = await WelfareDB.getWithdrawals();
        welfareApplications = await WelfareDB.getWelfareApplications();
        welfareServices = await WelfareDB.getWelfareServices();
        
        console.log('Report data loaded:', {
            members: Object.keys(members).length,
            contributions: Object.keys(contributions).length,
            withdrawals: Object.keys(withdrawals).length,
            welfareApplications: Object.keys(welfareApplications).length,
            welfareServices: Object.keys(welfareServices).length
        });
        
    } catch (error) {
        console.error('Error loading report data:', error);
        throw error;
    }
}

// Set up real-time listeners
function setupRealtimeListeners() {
    WelfareDB.onMembersChange((newMembers) => {
        members = newMembers;
        updateCharts();
    });

    WelfareDB.onContributionsChange((newContributions) => {
        contributions = newContributions;
        updateCharts();
    });

    WelfareDB.onWithdrawalsChange((newWithdrawals) => {
        withdrawals = newWithdrawals;
        updateCharts();
    });

    WelfareDB.onWelfareApplicationsChange((newApplications) => {
        welfareApplications = newApplications;
        updateCharts();
    });
}

// Initialize charts
function initializeCharts() {
    createMonthlyContributionsChart();
    createWithdrawalTypesChart();
    createWelfareServicesChart();
    createMemberDistributionChart();
}

// Create monthly contributions chart
function createMonthlyContributionsChart() {
    const ctx = document.getElementById('monthlyContributionsChart').getContext('2d');
    
    // Calculate monthly contributions for current year
    const currentYear = new Date().getFullYear();
    const monthlyData = Array(12).fill(0);
    
    Object.values(contributions).forEach(contribution => {
        if (contribution.year === currentYear) {
            monthlyData[contribution.month - 1] += parseFloat(contribution.amount) || 0;
        }
    });
    
    charts.monthlyContributions = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Contributions (GH₵)',
                data: monthlyData,
                backgroundColor: 'rgba(54, 162, 235, 0.8)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: `Monthly Contributions - ${currentYear}`
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'GH₵ ' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// Create withdrawal types chart
function createWithdrawalTypesChart() {
    const ctx = document.getElementById('withdrawalTypesChart').getContext('2d');
    
    const withdrawalTypes = {
        'savings': 0,
        'emergency': 0,
        'welfare_payout': 0,
        'loan_repayment': 0,
        'other': 0
    };
    
    Object.values(withdrawals).forEach(withdrawal => {
        if (withdrawal.status === 'completed' || withdrawal.status === 'approved') {
            withdrawalTypes[withdrawal.type] += parseFloat(withdrawal.amount) || 0;
        }
    });
    
    charts.withdrawalTypes = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Savings', 'Emergency', 'Welfare Payout', 'Loan Repayment', 'Other'],
            datasets: [{
                data: Object.values(withdrawalTypes),
                backgroundColor: [
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(255, 159, 64, 0.8)',
                    'rgba(153, 102, 255, 0.8)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Withdrawal Distribution by Type'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: GH₵ ${value.toLocaleString()} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Create welfare services chart
function createWelfareServicesChart() {
    const ctx = document.getElementById('welfareServicesChart').getContext('2d');
    
    const serviceStats = {};
    Object.values(welfareApplications).forEach(application => {
        const serviceName = welfareServices[application.serviceId]?.name || 'Unknown Service';
        if (!serviceStats[serviceName]) {
            serviceStats[serviceName] = { count: 0, amount: 0 };
        }
        serviceStats[serviceName].count++;
        serviceStats[serviceName].amount += parseFloat(application.amount) || 0;
    });
    
    const labels = Object.keys(serviceStats);
    const counts = labels.map(service => serviceStats[service].count);
    const amounts = labels.map(service => serviceStats[service].amount);
    
    charts.welfareServices = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Number of Applications',
                    data: counts,
                    backgroundColor: 'rgba(75, 192, 192, 0.8)',
                    yAxisID: 'y'
                },
                {
                    label: 'Total Amount (GH₵)',
                    data: amounts,
                    backgroundColor: 'rgba(255, 159, 64, 0.8)',
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Welfare Services Utilization'
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Number of Applications'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Total Amount (GH₵)'
                    },
                    ticks: {
                        callback: function(value) {
                            return 'GH₵ ' + value.toLocaleString();
                        }
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

// Create member distribution chart
function createMemberDistributionChart() {
    const ctx = document.getElementById('memberDistributionChart').getContext('2d');
    
    const departmentStats = {};
    Object.values(members).forEach(member => {
        const department = member.department || 'Unknown';
        if (!departmentStats[department]) {
            departmentStats[department] = 0;
        }
        departmentStats[department]++;
    });
    
    charts.memberDistribution = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(departmentStats),
            datasets: [{
                data: Object.values(departmentStats),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 205, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)',
                    'rgba(255, 159, 64, 0.8)',
                    'rgba(201, 203, 207, 0.8)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Member Distribution by Department'
                }
            }
        }
    });
}

// Update charts when data changes
function updateCharts() {
    if (charts.monthlyContributions) charts.monthlyContributions.destroy();
    if (charts.withdrawalTypes) charts.withdrawalTypes.destroy();
    if (charts.welfareServices) charts.welfareServices.destroy();
    if (charts.memberDistribution) charts.memberDistribution.destroy();
    
    initializeCharts();
}

// Generate comprehensive report
async function generateComprehensiveReport() {
    try {
        showLoading('Generating comprehensive report...');
        
        const reportData = await gatherReportData('comprehensive');
        const pdf = await createComprehensivePDF(reportData);
        
        hideLoading();
        showToast('Comprehensive report generated successfully', 'success');
        
        // Save to recent reports
        await saveRecentReport('Comprehensive Report', 'comprehensive', pdf);
        
        // Show preview
        showReportPreview(pdf, 'Comprehensive Report');
        
    } catch (error) {
        hideLoading();
        console.error('Error generating comprehensive report:', error);
        showToast('Error generating report: ' + error.message, 'error');
    }
}

// Generate financial report
async function generateFinancialReport() {
    try {
        showLoading('Generating financial report...');
        
        const reportData = await gatherReportData('financial');
        const pdf = await createFinancialPDF(reportData);
        
        hideLoading();
        showToast('Financial report generated successfully', 'success');
        
        await saveRecentReport('Financial Report', 'financial', pdf);
        showReportPreview(pdf, 'Financial Report');
        
    } catch (error) {
        hideLoading();
        console.error('Error generating financial report:', error);
        showToast('Error generating financial report', 'error');
    }
}

// Generate members report
async function generateMembersReport() {
    try {
        showLoading('Generating members report...');
        
        const reportData = await gatherReportData('members');
        const pdf = await createMembersPDF(reportData);
        
        hideLoading();
        showToast('Members report generated successfully', 'success');
        
        await saveRecentReport('Members Directory', 'members', pdf);
        showReportPreview(pdf, 'Members Directory');
        
    } catch (error) {
        hideLoading();
        console.error('Error generating members report:', error);
        showToast('Error generating members report', 'error');
    }
}

// Generate contributions report
async function generateContributionsReport() {
    try {
        showLoading('Generating contributions report...');
        
        const reportData = await gatherReportData('contributions');
        const pdf = await createContributionsPDF(reportData);
        
        hideLoading();
        showToast('Contributions report generated successfully', 'success');
        
        await saveRecentReport('Contributions Report', 'contributions', pdf);
        showReportPreview(pdf, 'Contributions Report');
        
    } catch (error) {
        hideLoading();
        console.error('Error generating contributions report:', error);
        showToast('Error generating contributions report', 'error');
    }
}

// Generate withdrawals report
async function generateWithdrawalsReport() {
    try {
        showLoading('Generating withdrawals report...');
        
        const reportData = await gatherReportData('withdrawals');
        const pdf = await createWithdrawalsPDF(reportData);
        
        hideLoading();
        showToast('Withdrawals report generated successfully', 'success');
        
        await saveRecentReport('Withdrawals Report', 'withdrawals', pdf);
        showReportPreview(pdf, 'Withdrawals Report');
        
    } catch (error) {
        hideLoading();
        console.error('Error generating withdrawals report:', error);
        showToast('Error generating withdrawals report', 'error');
    }
}

// Generate welfare report
async function generateWelfareReport() {
    try {
        showLoading('Generating welfare services report...');
        
        const reportData = await gatherReportData('welfare');
        const pdf = await createWelfarePDF(reportData);
        
        hideLoading();
        showToast('Welfare services report generated successfully', 'success');
        
        await saveRecentReport('Welfare Services Report', 'welfare', pdf);
        showReportPreview(pdf, 'Welfare Services Report');
        
    } catch (error) {
        hideLoading();
        console.error('Error generating welfare report:', error);
        showToast('Error generating welfare report', 'error');
    }
}

// Generate audit report
async function generateAuditReport() {
    try {
        showLoading('Generating audit trail report...');
        
        const reportData = await gatherReportData('audit');
        const pdf = await createAuditPDF(reportData);
        
        hideLoading();
        showToast('Audit trail report generated successfully', 'success');
        
        await saveRecentReport('Audit Trail Report', 'audit', pdf);
        showReportPreview(pdf, 'Audit Trail Report');
        
    } catch (error) {
        hideLoading();
        console.error('Error generating audit report:', error);
        showToast('Error generating audit report', 'error');
    }
}

// Gather report data
async function gatherReportData(reportType, filters = {}) {
    const data = {
        reportType: reportType,
        generatedAt: new Date().toISOString(),
        generatedBy: sessionStorage.getItem('welfare_username') || 'Admin',
        filters: filters
    };

    // Basic statistics
    data.totalMembers = Object.keys(members).length;
    data.activeMembers = Object.values(members).filter(m => m.status === 'active').length;
    data.totalContributions = Object.values(contributions).reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
    data.totalWithdrawals = Object.values(withdrawals)
        .filter(w => w.status === 'completed' || w.status === 'approved')
        .reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0);
    data.availableBalance = data.totalContributions - data.totalWithdrawals;

    switch (reportType) {
        case 'financial':
            data.financialDetails = await getFinancialDetails(filters);
            break;
        case 'members':
            data.memberDetails = await getMemberDetails(filters);
            break;
        case 'contributions':
            data.contributionDetails = await getContributionDetails(filters);
            break;
        case 'withdrawals':
            data.withdrawalDetails = await getWithdrawalDetails(filters);
            break;
        case 'welfare':
            data.welfareDetails = await getWelfareDetails(filters);
            break;
        case 'comprehensive':
            data.financialDetails = await getFinancialDetails(filters);
            data.memberDetails = await getMemberDetails(filters);
            data.contributionDetails = await getContributionDetails(filters);
            data.withdrawalDetails = await getWithdrawalDetails(filters);
            data.welfareDetails = await getWelfareDetails(filters);
            break;
        case 'audit':
            data.auditDetails = await getAuditDetails(filters);
            break;
    }

    return data;
}

// Get financial details
async function getFinancialDetails(filters) {
    const currentYear = new Date().getFullYear();
    const monthlyContributions = Array(12).fill(0);
    const monthlyWithdrawals = Array(12).fill(0);
    
    Object.values(contributions).forEach(contribution => {
        if (contribution.year === currentYear) {
            monthlyContributions[contribution.month - 1] += parseFloat(contribution.amount) || 0;
        }
    });
    
    Object.values(withdrawals).forEach(withdrawal => {
        if ((withdrawal.status === 'completed' || withdrawal.status === 'approved') && withdrawal.timestamp) {
            const date = new Date(withdrawal.timestamp);
            if (date.getFullYear() === currentYear) {
                monthlyWithdrawals[date.getMonth()] += parseFloat(withdrawal.amount) || 0;
            }
        }
    });
    
    return {
        monthlyContributions,
        monthlyWithdrawals,
        currentYear
    };
}

// Get member details
async function getMemberDetails(filters) {
    let memberList = Object.values(members);
    
    // Apply filters
    if (filters.department && filters.department !== 'all') {
        memberList = memberList.filter(m => m.department === filters.department);
    }
    if (filters.status && filters.status !== 'all') {
        memberList = memberList.filter(m => m.status === filters.status);
    }
    
    return memberList.map(member => ({
        name: member.name,
        staffId: member.staffId,
        department: member.department,
        role: member.role,
        phone: member.phone,
        email: member.email,
        status: member.status,
        monthlyDue: member.monthlyDue,
        paymentMode: member.paymentMode,
        joinDate: member.joinDate
    }));
}

// Get contribution details
async function getContributionDetails(filters) {
    let contributionList = Object.values(contributions);
    
    // Apply date filter
    if (filters.startDate && filters.endDate) {
        const start = new Date(filters.startDate);
        const end = new Date(filters.endDate);
        contributionList = contributionList.filter(c => {
            const date = new Date(c.timestamp);
            return date >= start && date <= end;
        });
    }
    
    return contributionList.map(contribution => ({
        memberName: members[contribution.memberId]?.name || 'Unknown',
        amount: contribution.amount,
        month: contribution.month,
        year: contribution.year,
        paymentMethod: contribution.paymentMethod,
        timestamp: contribution.timestamp,
        status: contribution.status
    }));
}

// Create comprehensive PDF report
async function createComprehensivePDF(reportData) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    
    let yPosition = 20;
    
    // Header
    pdf.setFontSize(20);
    pdf.setTextColor(40, 40, 40);
    pdf.text('SUNYANI MUNICIPAL ASSEMBLY', 105, yPosition, { align: 'center' });
    yPosition += 10;
    
    pdf.setFontSize(16);
    pdf.setTextColor(100, 100, 100);
    pdf.text('WELFARE MANAGEMENT SYSTEM', 105, yPosition, { align: 'center' });
    yPosition += 15;
    
    pdf.setFontSize(14);
    pdf.text('COMPREHENSIVE REPORT', 105, yPosition, { align: 'center' });
    yPosition += 20;
    
    // Executive Summary
    pdf.setFontSize(12);
    pdf.setTextColor(40, 40, 40);
    pdf.text('EXECUTIVE SUMMARY', 20, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(10);
    pdf.setTextColor(80, 80, 80);
    const summaryLines = pdf.splitTextToSize(
        `This comprehensive report provides a complete overview of the Sunyani Municipal Assembly Welfare Management System. ` +
        `As of ${new Date().toLocaleDateString()}, the system manages ${reportData.totalMembers} members with GH₵ ${reportData.totalContributions.toFixed(2)} ` +
        `in total contributions and GH₵ ${reportData.availableBalance.toFixed(2)} in available balance.`, 170
    );
    pdf.text(summaryLines, 20, yPosition);
    yPosition += summaryLines.length * 5 + 15;
    
    // Key Statistics Table
    const statistics = [
        ['Total Members', reportData.totalMembers.toString()],
        ['Active Members', reportData.activeMembers.toString()],
        ['Total Contributions', `GH₵ ${reportData.totalContributions.toFixed(2)}`],
        ['Total Withdrawals', `GH₵ ${reportData.totalWithdrawals.toFixed(2)}`],
        ['Available Balance', `GH₵ ${reportData.availableBalance.toFixed(2)}`],
        ['System Reserve', `GH₵ ${(reportData.totalContributions * 0.5).toFixed(2)}`]
    ];
    
    pdf.autoTable({
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: statistics,
        theme: 'grid',
        headStyles: { fillColor: [30, 60, 114] },
        styles: { fontSize: 10 }
    });
    
    yPosition = pdf.lastAutoTable.finalY + 15;
    
    // Add more sections based on report data...
    // Financial Overview, Member Analysis, etc.
    
    // Footer
    const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
        pdf.text(`Generated on ${new Date().toLocaleDateString()} by ${reportData.generatedBy}`, 105, 295, { align: 'center' });
    }
    
    return pdf;
}

// Create financial PDF
async function createFinancialPDF(reportData) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    
    // Implementation similar to comprehensive but focused on financial data
    // Include balance sheets, income statements, cash flow, etc.
    
    return pdf;
}

// Create members PDF
async function createMembersPDF(reportData) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    
    let yPosition = 20;
    
    // Header
    pdf.setFontSize(20);
    pdf.setTextColor(40, 40, 40);
    pdf.text('SUNYANI MUNICIPAL ASSEMBLY', 105, yPosition, { align: 'center' });
    yPosition += 10;
    
    pdf.setFontSize(16);
    pdf.setTextColor(100, 100, 100);
    pdf.text('MEMBERS DIRECTORY', 105, yPosition, { align: 'center' });
    yPosition += 20;
    
    // Members Table
    const memberData = reportData.memberDetails.map(member => [
        member.staffId,
        member.name,
        member.department,
        member.role,
        member.phone,
        member.email,
        `GH₵ ${parseFloat(member.monthlyDue || 0).toFixed(2)}`,
        member.status
    ]);
    
    pdf.autoTable({
        startY: yPosition,
        head: [['Staff ID', 'Name', 'Department', 'Role', 'Phone', 'Email', 'Monthly Due', 'Status']],
        body: memberData,
        theme: 'grid',
        headStyles: { fillColor: [30, 60, 114] },
        styles: { fontSize: 8 },
        columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 30 },
            2: { cellWidth: 25 },
            3: { cellWidth: 25 },
            4: { cellWidth: 25 },
            5: { cellWidth: 35 },
            6: { cellWidth: 20 },
            7: { cellWidth: 15 }
        }
    });
    
    // Footer
    const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
        pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 295, { align: 'center' });
    }
    
    return pdf;
}

// Show custom report modal
function showCustomReportModal() {
    // Set default dates
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    document.getElementById('customStartDate').value = firstDay.toISOString().split('T')[0];
    document.getElementById('customEndDate').value = lastDay.toISOString().split('T')[0];
    
    document.getElementById('customReportModal').style.display = 'block';
}

// Close custom report modal
function closeCustomReportModal() {
    document.getElementById('customReportModal').style.display = 'none';
}

// Generate custom report
async function generateCustomReport() {
    try {
        const formData = new FormData(document.getElementById('customReportForm'));
        const reportType = document.getElementById('customReportType').value;
        const reportName = document.getElementById('customReportName').value;
        
        if (!reportType || !reportName) {
            showToast('Please fill all required fields', 'error');
            return;
        }
        
        showLoading(`Generating ${reportName}...`);
        
        const filters = {
            startDate: document.getElementById('customStartDate').value,
            endDate: document.getElementById('customEndDate').value,
            department: document.getElementById('departmentFilter').value,
            status: document.getElementById('memberStatusFilter').value,
            paymentMode: document.getElementById('paymentModeFilter').value,
            withdrawalType: document.getElementById('withdrawalTypeFilter').value
        };
        
        const reportData = await gatherReportData(reportType, filters);
        let pdf;
        
        switch (reportType) {
            case 'financial':
                pdf = await createFinancialPDF(reportData);
                break;
            case 'members':
                pdf = await createMembersPDF(reportData);
                break;
            case 'contributions':
                pdf = await createContributionsPDF(reportData);
                break;
            case 'withdrawals':
                pdf = await createWithdrawalsPDF(reportData);
                break;
            case 'welfare':
                pdf = await createWelfarePDF(reportData);
                break;
            case 'comprehensive':
                pdf = await createComprehensivePDF(reportData);
                break;
            default:
                throw new Error('Unknown report type');
        }
        
        hideLoading();
        showToast(`${reportName} generated successfully`, 'success');
        
        await saveRecentReport(reportName, reportType, pdf);
        showReportPreview(pdf, reportName);
        closeCustomReportModal();
        
    } catch (error) {
        hideLoading();
        console.error('Error generating custom report:', error);
        showToast('Error generating custom report: ' + error.message, 'error');
    }
}

// Show report preview
function showReportPreview(pdf, reportName) {
    currentReportData = { pdf, name: reportName };
    
    // Create a blob URL for the PDF
    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    const previewContent = `
        <div class="preview-header">
            <h4>${reportName}</h4>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        <div class="preview-frame">
            <iframe src="${pdfUrl}" width="100%" height="500px"></iframe>
        </div>
        <div class="preview-info">
            <p><strong>File Size:</strong> ${(pdfBlob.size / 1024 / 1024).toFixed(2)} MB</p>
            <p><strong>Pages:</strong> ${pdf.internal.getNumberOfPages()}</p>
        </div>
    `;
    
    document.getElementById('reportPreviewContent').innerHTML = previewContent;
    document.getElementById('reportPreviewModal').style.display = 'block';
}

// Close report preview
function closeReportPreviewModal() {
    document.getElementById('reportPreviewModal').style.display = 'none';
    if (currentReportData) {
        URL.revokeObjectURL(currentReportData.pdf.output('blob'));
        currentReportData = null;
    }
}

// Download current report
function downloadCurrentReport() {
    if (currentReportData) {
        currentReportData.pdf.save(`${currentReportData.name}_${new Date().toISOString().split('T')[0]}.pdf`);
    }
}

// Print current report
function printCurrentReport() {
    if (currentReportData) {
        const pdfBlob = currentReportData.pdf.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const printWindow = window.open(pdfUrl);
        printWindow?.print();
    }
}

// Save recent report
async function saveRecentReport(name, type, pdf) {
    const report = {
        id: 'report_' + Date.now(),
        name: name,
        type: type,
        generatedAt: new Date().toISOString(),
        generatedBy: sessionStorage.getItem('welfare_username') || 'Admin',
        size: pdf.output('blob').size,
        pages: pdf.internal.getNumberOfPages()
    };
    
    await WelfareDB.addRecentReport(report);
    loadRecentReports();
}

// Load recent reports
async function loadRecentReports() {
    try {
        const recentReports = await WelfareDB.getRecentReports();
        const container = document.getElementById('recentReportsTable');
        
        if (!recentReports || Object.keys(recentReports).length === 0) {
            container.innerHTML = '<tr><td colspan="6" class="no-data">No recent reports</td></tr>';
            return;
        }
        
        const reportsArray = Object.values(recentReports)
            .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt))
            .slice(0, 10);
        
        container.innerHTML = reportsArray.map(report => `
            <tr>
                <td><strong>${report.name}</strong></td>
                <td><span class="report-type-${report.type}">${report.type}</span></td>
                <td>${new Date(report.generatedAt).toLocaleDateString()}</td>
                <td>${new Date(report.generatedAt).toLocaleTimeString()}</td>
                <td>${(report.size / 1024 / 1024).toFixed(2)} MB</td>
                <td>
                    <button class="btn-secondary" onclick="regenerateReport('${report.id}')">🔄 Regenerate</button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading recent reports:', error);
    }
}

// Load scheduled reports
async function loadScheduledReports() {
    // Implementation for loading scheduled reports
}

// Show loading
function showLoading(message) {
    // Implementation for showing loading indicator
    console.log('Loading:', message);
}

// Hide loading
function hideLoading() {
    // Implementation for hiding loading indicator
    console.log('Loading complete');
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
document.getElementById('customReportForm').addEventListener('submit', function(e) {
    e.preventDefault();
    generateCustomReport();
});

document.getElementById('reportPeriod').addEventListener('change', function() {
    updateDateRange();
});

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = ['customReportModal', 'reportPreviewModal', 'scheduleReportModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target === modal) {
            if (modalId === 'customReportModal') closeCustomReportModal();
            if (modalId === 'reportPreviewModal') closeReportPreviewModal();
            if (modalId === 'scheduleReportModal') closeScheduleReportModal();
        }
    });
}

// Initialize reports when page loads
document.addEventListener('DOMContentLoaded', initializeReports);
