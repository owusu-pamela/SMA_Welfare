// Payment Gateway Integration for Sunyani Municipal Assembly Welfare System
class PaymentGateway {
    constructor() {
        this.providers = {
            'mtn_momo': {
                name: 'MTN Mobile Money',
                logo: '📱',
                supported: true,
                fees: {
                    percentage: 1.5,
                    minimum: 0.50
                },
                limits: {
                    min: 1,
                    max: 5000
                }
            },
            'vodafone_cash': {
                name: 'Vodafone Cash',
                logo: '💳',
                supported: true,
                fees: {
                    percentage: 1.5,
                    minimum: 0.50
                },
                limits: {
                    min: 1,
                    max: 5000
                }
            },
            'airtel_tigo': {
                name: 'AirtelTigo Money',
                logo: '📲',
                supported: true,
                fees: {
                    percentage: 1.5,
                    minimum: 0.50
                },
                limits: {
                    min: 1,
                    max: 5000
                }
            },
            'bank_transfer': {
                name: 'Bank Transfer',
                logo: '🏦',
                supported: true,
                fees: {
                    fixed: 5.00
                },
                limits: {
                    min: 10,
                    max: 100000
                }
            },
            'cash': {
                name: 'Cash Payment',
                logo: '💵',
                supported: true,
                fees: {
                    fixed: 0
                },
                limits: {
                    min: 1,
                    max: 10000
                }
            },
            'card': {
                name: 'Credit/Debit Card',
                logo: '💳',
                supported: false, // To be integrated
                fees: {
                    percentage: 3.0,
                    minimum: 2.00
                },
                limits: {
                    min: 5,
                    max: 50000
                }
            }
        };
        
        this.initializePaymentHandlers();
    }

    // Initialize payment event handlers
    initializePaymentHandlers() {
        // Listen for payment initiation from various parts of the system
        document.addEventListener('paymentRequested', (event) => {
            this.showPaymentModal(event.detail);
        });
    }

    // Show payment modal with provider options
    showPaymentModal(paymentData) {
        const modal = this.createPaymentModal(paymentData);
        document.body.appendChild(modal);
        modal.style.display = 'block';
    }

    // Create payment modal
    createPaymentModal(paymentData) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'paymentGatewayModal';
        modal.innerHTML = `
            <div class="modal-content large-modal">
                <div class="modal-header">
                    <h3>💳 Make Payment</h3>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="payment-flow">
                    <!-- Payment Steps -->
                    <div class="payment-steps">
                        <div class="step active" data-step="1">Method</div>
                        <div class="step" data-step="2">Details</div>
                        <div class="step" data-step="3">Confirm</div>
                        <div class="step" data-step="4">Complete</div>
                    </div>

                    <!-- Step 1: Payment Method Selection -->
                    <div class="payment-step active" data-step="1">
                        <h4>Select Payment Method</h4>
                        <div class="payment-providers">
                            ${this.renderPaymentProviders(paymentData.amount)}
                        </div>
                        <div class="payment-summary-step1">
                            <h5>Payment Summary</h5>
                            <div class="summary-item">
                                <span>Amount:</span>
                                <span>GH₵ ${parseFloat(paymentData.amount).toFixed(2)}</span>
                            </div>
                            <div class="summary-item fee-estimate">
                                <span>Estimated Fee:</span>
                                <span id="estimatedFee">GH₵ 0.00</span>
                            </div>
                            <div class="summary-item total">
                                <span>Total to Pay:</span>
                                <span id="totalToPay">GH₵ ${parseFloat(paymentData.amount).toFixed(2)}</span>
                            </div>
                        </div>
                        <div class="step-actions">
                            <button class="btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                            <button class="btn-primary" onclick="paymentGateway.nextStep()" disabled id="nextStep1">Next →</button>
                        </div>
                    </div>

                    <!-- Step 2: Payment Details -->
                    <div class="payment-step" data-step="2">
                        <h4 id="step2Title">Payment Details</h4>
                        <form id="paymentDetailsForm">
                            <div id="paymentDetailsContent">
                                <!-- Dynamic content based on payment method -->
                            </div>
                        </form>
                        <div class="step-actions">
                            <button class="btn-secondary" onclick="paymentGateway.previousStep()">← Back</button>
                            <button class="btn-primary" onclick="paymentGateway.nextStep()" id="nextStep2">Next →</button>
                        </div>
                    </div>

                    <!-- Step 3: Confirmation -->
                    <div class="payment-step" data-step="3">
                        <h4>Confirm Payment</h4>
                        <div class="confirmation-details" id="confirmationDetails">
                            <!-- Confirmation details will be populated here -->
                        </div>
                        <div class="security-notice">
                            <div class="security-icon">🔒</div>
                            <div class="security-text">
                                <strong>Secure Payment</strong>
                                <p>Your payment details are encrypted and secure</p>
                            </div>
                        </div>
                        <div class="step-actions">
                            <button class="btn-secondary" onclick="paymentGateway.previousStep()">← Back</button>
                            <button class="btn-primary" onclick="paymentGateway.processPayment()" id="confirmPayment">
                                🔒 Confirm & Pay
                            </button>
                        </div>
                    </div>

                    <!-- Step 4: Completion -->
                    <div class="payment-step" data-step="4">
                        <div class="payment-result" id="paymentResult">
                            <!-- Payment result will be shown here -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        return modal;
    }

    // Render payment providers
    renderPaymentProviders(amount) {
        let providersHTML = '';
        
        Object.entries(this.providers).forEach(([providerId, provider]) => {
            if (provider.supported) {
                const isWithinLimits = amount >= provider.limits.min && amount <= provider.limits.max;
                const fee = this.calculateFee(amount, providerId);
                
                providersHTML += `
                    <div class="provider-card ${!isWithinLimits ? 'disabled' : ''}" 
                         data-provider="${providerId}"
                         onclick="paymentGateway.selectProvider('${providerId}')">
                        <div class="provider-logo">${provider.logo}</div>
                        <div class="provider-info">
                            <h5>${provider.name}</h5>
                            <p>Fee: GH₵ ${fee.toFixed(2)}</p>
                            ${!isWithinLimits ? 
                                `<small class="limit-warning">Limit: GH₵ ${provider.limits.min} - ${provider.limits.max}</small>` : 
                                `<small>Instant processing</small>`
                            }
                        </div>
                        <div class="provider-select">
                            <input type="radio" name="paymentProvider" value="${providerId}" 
                                   ${!isWithinLimits ? 'disabled' : ''}>
                        </div>
                    </div>
                `;
            }
        });
        
        return providersHTML;
    }

    // Calculate payment fees
    calculateFee(amount, providerId) {
        const provider = this.providers[providerId];
        if (!provider) return 0;
        
        if (provider.fees.percentage) {
            const percentageFee = amount * (provider.fees.percentage / 100);
            const minimumFee = provider.fees.minimum || 0;
            return Math.max(percentageFee, minimumFee);
        } else if (provider.fees.fixed) {
            return provider.fees.fixed;
        }
        
        return 0;
    }

    // Select payment provider
    selectProvider(providerId) {
        const provider = this.providers[providerId];
        if (!provider || !provider.supported) return;
        
        // Update UI
        document.querySelectorAll('.provider-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelector(`[data-provider="${providerId}"]`).classList.add('selected');
        
        // Update radio button
        document.querySelector(`input[value="${providerId}"]`).checked = true;
        
        // Enable next button
        document.getElementById('nextStep1').disabled = false;
        
        // Update fee estimate
        this.updateFeeEstimate(providerId);
        
        // Store selected provider
        this.selectedProvider = providerId;
    }

    // Update fee estimate
    updateFeeEstimate(providerId) {
        const amount = parseFloat(this.currentPaymentData.amount);
        const fee = this.calculateFee(amount, providerId);
        const total = amount + fee;
        
        document.getElementById('estimatedFee').textContent = `GH₵ ${fee.toFixed(2)}`;
        document.getElementById('totalToPay').textContent = `GH₵ ${total.toFixed(2)}`;
    }

    // Navigate to next step
    nextStep() {
        const currentStep = document.querySelector('.payment-step.active');
        const currentStepNum = parseInt(currentStep.dataset.step);
        const nextStepNum = currentStepNum + 1;
        
        // Validate current step
        if (currentStepNum === 1 && !this.validateStep1()) return;
        if (currentStepNum === 2 && !this.validateStep2()) return;
        
        // Hide current step
        currentStep.classList.remove('active');
        document.querySelector(`.step[data-step="${currentStepNum}"]`).classList.remove('active');
        
        // Show next step
        document.querySelector(`.payment-step[data-step="${nextStepNum}"]`).classList.add('active');
        document.querySelector(`.step[data-step="${nextStepNum}"]`).classList.add('active');
        
        // Initialize next step
        this.initializeStep(nextStepNum);
    }

    // Navigate to previous step
    previousStep() {
        const currentStep = document.querySelector('.payment-step.active');
        const currentStepNum = parseInt(currentStep.dataset.step);
        const prevStepNum = currentStepNum - 1;
        
        // Hide current step
        currentStep.classList.remove('active');
        document.querySelector(`.step[data-step="${currentStepNum}"]`).classList.remove('active');
        
        // Show previous step
        document.querySelector(`.payment-step[data-step="${prevStepNum}"]`).classList.add('active');
        document.querySelector(`.step[data-step="${prevStepNum}"]`).classList.add('active');
    }

    // Validate step 1 (provider selection)
    validateStep1() {
        if (!this.selectedProvider) {
            showToast('Please select a payment method', 'error');
            return false;
        }
        return true;
    }

    // Validate step 2 (payment details)
    validateStep2() {
        const provider = this.providers[this.selectedProvider];
        
        if (this.selectedProvider.includes('momo') || this.selectedProvider.includes('cash')) {
            const phoneNumber = document.getElementById('mobileNumber').value;
            if (!phoneNumber) {
                showToast('Please enter your mobile money number', 'error');
                return false;
            }
            if (!this.validatePhoneNumber(phoneNumber)) {
                showToast('Please enter a valid Ghanaian phone number', 'error');
                return false;
            }
        } else if (this.selectedProvider === 'bank_transfer') {
            const accountNumber = document.getElementById('accountNumber').value;
            if (!accountNumber) {
                showToast('Please enter your account number', 'error');
                return false;
            }
        }
        
        return true;
    }

    // Validate Ghanaian phone number
    validatePhoneNumber(phone) {
        const cleaned = phone.replace(/\D/g, '');
        const ghanaPattern = /^(233|0)(20|24|25|26|27|28|29|30|31|32|33|34|35|36|37|38|39|50|54|55|56|57|58|59)[0-9]{7}$/;
        return ghanaPattern.test(cleaned);
    }

    // Initialize step content
    initializeStep(stepNumber) {
        switch (stepNumber) {
            case 2:
                this.initializeStep2();
                break;
            case 3:
                this.initializeStep3();
                break;
            case 4:
                // Step 4 is initialized after payment processing
                break;
        }
    }

    // Initialize step 2 (payment details)
    initializeStep2() {
        const provider = this.providers[this.selectedProvider];
        let detailsHTML = '';
        
        document.getElementById('step2Title').textContent = `${provider.name} Details`;
        
        if (this.selectedProvider.includes('momo') || this.selectedProvider === 'vodafone_cash' || this.selectedProvider === 'airtel_tigo') {
            detailsHTML = `
                <div class="form-group">
                    <label for="mobileNumber">Mobile Money Number *</label>
                    <input type="tel" id="mobileNumber" placeholder="e.g., 0551234567" required>
                    <small>Enter your ${provider.name} number</small>
                </div>
                <div class="form-group">
                    <label for="mobileNetwork">Mobile Network *</label>
                    <select id="mobileNetwork" required>
                        <option value="">Select Network</option>
                        <option value="MTN">MTN</option>
                        <option value="Vodafone">Vodafone</option>
                        <option value="AirtelTigo">AirtelTigo</option>
                    </select>
                </div>
                <div class="payment-instructions">
                    <h5>📱 Payment Instructions</h5>
                    <ol>
                        <li>Enter your ${provider.name} number above</li>
                        <li>You will receive a prompt on your phone</li>
                        <li>Enter your Mobile Money PIN to authorize payment</li>
                        <li>Wait for payment confirmation</li>
                    </ol>
                </div>
            `;
        } else if (this.selectedProvider === 'bank_transfer') {
            detailsHTML = `
                <div class="form-group">
                    <label for="accountNumber">Account Number *</label>
                    <input type="text" id="accountNumber" placeholder="Enter your account number" required>
                </div>
                <div class="form-group">
                    <label for="bankName">Bank Name *</label>
                    <select id="bankName" required>
                        <option value="">Select Bank</option>
                        <option value="GCB Bank">GCB Bank</option>
                        <option value="Agricultural Development Bank">Agricultural Development Bank</option>
                        <option value="National Investment Bank">National Investment Bank</option>
                        <option value="Consolidated Bank Ghana">Consolidated Bank Ghana</option>
                        <option value="Republic Bank">Republic Bank</option>
                        <option value="Stanbic Bank">Stanbic Bank</option>
                        <option value="Ecobank">Ecobank</option>
                        <option value="Cal Bank">Cal Bank</option>
                        <option value="Fidelity Bank">Fidelity Bank</option>
                        <option value="Zenith Bank">Zenith Bank</option>
                        <option value="Standard Chartered">Standard Chartered</option>
                        <option value="Barclays Bank">Barclays Bank</option>
                        <option value="First National Bank">First National Bank</option>
                        <option value="Bank of Africa">Bank of Africa</option>
                        <option value="Universal Merchant Bank">Universal Merchant Bank</option>
                        <option value="Prudential Bank">Prudential Bank</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="accountName">Account Name *</label>
                    <input type="text" id="accountName" placeholder="Account holder name" required>
                </div>
                <div class="payment-instructions">
                    <h5>🏦 Bank Transfer Details</h5>
                    <div class="bank-details">
                        <p><strong>Bank:</strong> GCB Bank</p>
                        <p><strong>Account Name:</strong> Sunyani Municipal Assembly Welfare</p>
                        <p><strong>Account Number:</strong> 1234567890123</p>
                        <p><strong>Branch:</strong> Sunyani Main</p>
                        <p><strong>Reference:</strong> <span id="transferReference">${this.generateReference()}</span></p>
                    </div>
                    <p><strong>Important:</strong> Use the reference number above when making transfer</p>
                </div>
            `;
        } else if (this.selectedProvider === 'cash') {
            detailsHTML = `
                <div class="form-group">
                    <label for="cashLocation">Payment Location *</label>
                    <select id="cashLocation" required>
                        <option value="">Select Location</option>
                        <option value="assembly_office">Sunyani Municipal Assembly Office</option>
                        <option value="finance_department">Finance Department - Room 12</option>
                        <option value="welfare_office">Welfare Office - Room 8</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="preferredTime">Preferred Time</label>
                    <input type="datetime-local" id="preferredTime">
                </div>
                <div class="payment-instructions">
                    <h5>💵 Cash Payment Instructions</h5>
                    <ol>
                        <li>Visit the selected location during working hours (8:00 AM - 5:00 PM)</li>
                        <li>Provide your name and staff ID to the officer</li>
                        <li>Make payment and collect receipt</li>
                        <li>Payment will be reflected in your account within 24 hours</li>
                    </ol>
                    <div class="contact-info">
                        <p><strong>Contact:</strong> Welfare Office - 0352021234</p>
                    </div>
                </div>
            `;
        }
        
        document.getElementById('paymentDetailsContent').innerHTML = detailsHTML;
        
        // Pre-fill account name for bank transfer
        if (this.selectedProvider === 'bank_transfer') {
            document.getElementById('accountName').value = this.currentPaymentData.memberName || '';
        }
    }

    // Initialize step 3 (confirmation)
    initializeStep3() {
        const provider = this.providers[this.selectedProvider];
        const amount = parseFloat(this.currentPaymentData.amount);
        const fee = this.calculateFee(amount, this.selectedProvider);
        const total = amount + fee;
        
        let confirmationHTML = `
            <div class="confirmation-item">
                <span>Payment Method:</span>
                <span>${provider.name}</span>
            </div>
            <div class="confirmation-item">
                <span>Amount:</span>
                <span>GH₵ ${amount.toFixed(2)}</span>
            </div>
            <div class="confirmation-item">
                <span>Service Fee:</span>
                <span>GH₵ ${fee.toFixed(2)}</span>
            </div>
            <div class="confirmation-item total">
                <span>Total to Pay:</span>
                <span>GH₵ ${total.toFixed(2)}</span>
            </div>
        `;
        
        // Add provider-specific details
        if (this.selectedProvider.includes('momo') || this.selectedProvider.includes('cash')) {
            const phoneNumber = document.getElementById('mobileNumber').value;
            const network = document.getElementById('mobileNetwork').value;
            confirmationHTML += `
                <div class="confirmation-item">
                    <span>Mobile Number:</span>
                    <span>${phoneNumber}</span>
                </div>
                <div class="confirmation-item">
                    <span>Network:</span>
                    <span>${network}</span>
                </div>
            `;
        } else if (this.selectedProvider === 'bank_transfer') {
            const accountNumber = document.getElementById('accountNumber').value;
            const bankName = document.getElementById('bankName').value;
            confirmationHTML += `
                <div class="confirmation-item">
                    <span>Bank:</span>
                    <span>${bankName}</span>
                </div>
                <div class="confirmation-item">
                    <span>Account Number:</span>
                    <span>${accountNumber}</span>
                </div>
                <div class="confirmation-item">
                    <span>Reference:</span>
                    <span>${document.getElementById('transferReference').textContent}</span>
                </div>
            `;
        } else if (this.selectedProvider === 'cash') {
            const location = document.getElementById('cashLocation').value;
            const time = document.getElementById('preferredTime').value;
            confirmationHTML += `
                <div class="confirmation-item">
                    <span>Location:</span>
                    <span>${this.getLocationName(location)}</span>
                </div>
                ${time ? `
                <div class="confirmation-item">
                    <span>Preferred Time:</span>
                    <span>${new Date(time).toLocaleString()}</span>
                </div>
                ` : ''}
            `;
        }
        
        document.getElementById('confirmationDetails').innerHTML = confirmationHTML;
    }

    // Process payment
    async processPayment() {
        const confirmButton = document.getElementById('confirmPayment');
        confirmButton.disabled = true;
        confirmButton.innerHTML = '⏳ Processing...';
        
        try {
            // Simulate payment processing
            const paymentResult = await this.executePayment();
            
            // Move to completion step
            this.nextStep();
            
            // Show payment result
            this.showPaymentResult(paymentResult);
            
        } catch (error) {
            console.error('Payment processing error:', error);
            showToast('Payment failed. Please try again.', 'error');
            confirmButton.disabled = false;
            confirmButton.innerHTML = '🔒 Confirm & Pay';
        }
    }

    // Execute payment (simulated - would integrate with real payment gateway)
    async executePayment() {
        return new Promise((resolve, reject) => {
            // Simulate API call delay
            setTimeout(() => {
                // Simulate successful payment 90% of the time
                if (Math.random() > 0.1) {
                    resolve({
                        success: true,
                        transactionId: 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                        amount: this.currentPaymentData.amount,
                        fee: this.calculateFee(this.currentPaymentData.amount, this.selectedProvider),
                        provider: this.selectedProvider,
                        timestamp: new Date().toISOString()
                    });
                } else {
                    reject(new Error('Payment failed. Please check your details and try again.'));
                }
            }, 3000);
        });
    }

    // Show payment result
    showPaymentResult(result) {
        const resultHTML = result.success ? `
            <div class="payment-success">
                <div class="success-icon">✅</div>
                <h3>Payment Successful!</h3>
                <p>Your payment has been processed successfully.</p>
                <div class="payment-receipt">
                    <h5>Payment Receipt</h5>
                    <div class="receipt-item">
                        <span>Transaction ID:</span>
                        <span>${result.transactionId}</span>
                    </div>
                    <div class="receipt-item">
                        <span>Amount Paid:</span>
                        <span>GH₵ ${parseFloat(result.amount).toFixed(2)}</span>
                    </div>
                    <div class="receipt-item">
                        <span>Service Fee:</span>
                        <span>GH₵ ${result.fee.toFixed(2)}</span>
                    </div>
                    <div class="receipt-item total">
                        <span>Total:</span>
                        <span>GH₵ ${(parseFloat(result.amount) + result.fee).toFixed(2)}</span>
                    </div>
                    <div class="receipt-item">
                        <span>Date & Time:</span>
                        <span>${new Date(result.timestamp).toLocaleString()}</span>
                    </div>
                </div>
                <div class="result-actions">
                    <button class="btn-secondary" onclick="paymentGateway.downloadReceipt()">📄 Download Receipt</button>
                    <button class="btn-primary" onclick="paymentGateway.closePaymentModal()">Done</button>
                </div>
            </div>
        ` : `
            <div class="payment-failed">
                <div class="failed-icon">❌</div>
                <h3>Payment Failed</h3>
                <p>We couldn't process your payment. Please try again.</p>
                <div class="result-actions">
                    <button class="btn-secondary" onclick="paymentGateway.previousStep()">← Try Again</button>
                    <button class="btn-primary" onclick="paymentGateway.closePaymentModal()">Cancel</button>
                </div>
            </div>
        `;
        
        document.getElementById('paymentResult').innerHTML = resultHTML;
        
        // If payment was successful, record it in the system
        if (result.success) {
            this.recordSuccessfulPayment(result);
        }
    }

    // Record successful payment in the system
    async recordSuccessfulPayment(paymentResult) {
        const paymentData = {
            ...this.currentPaymentData,
            transactionId: paymentResult.transactionId,
            paymentMethod: this.selectedProvider,
            status: 'completed',
            processedAt: new Date().toISOString(),
            fee: paymentResult.fee
        };
        
        try {
            // Save to contributions
            await WelfareDB.addContribution(paymentData);
            
            // Create notification
            await WelfareDB.addNotification({
                memberId: sessionStorage.getItem('welfare_userId'),
                title: 'Payment Received',
                message: `Your payment of GH₵ ${paymentData.amount} has been received successfully.`,
                type: 'payment_success',
                priority: 'high'
            });
            
            // Update member's last payment date
            await WelfareDB.updateMember(sessionStorage.getItem('welfare_userId'), {
                lastPayment: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('Error recording payment:', error);
        }
    }

    // Download receipt
    downloadReceipt() {
        showToast('Receipt download feature will be available soon', 'info');
        // Implementation for PDF receipt generation
    }

    // Close payment modal
    closePaymentModal() {
        const modal = document.getElementById('paymentGatewayModal');
        if (modal) {
            modal.remove();
        }
        
        // Refresh the page or update UI as needed
        if (this.currentPaymentData.onSuccess) {
            this.currentPaymentData.onSuccess();
        }
    }

    // Utility methods
    generateReference() {
        return 'SMA' + Date.now().toString().substr(-8) + Math.random().toString(36).substr(2, 3).toUpperCase();
    }

    getLocationName(locationKey) {
        const locations = {
            'assembly_office': 'Sunyani Municipal Assembly Office',
            'finance_department': 'Finance Department - Room 12',
            'welfare_office': 'Welfare Office - Room 8'
        };
        return locations[locationKey] || locationKey;
    }

    // Public method to initiate payment
    initiatePayment(paymentData) {
        this.currentPaymentData = paymentData;
        this.showPaymentModal(paymentData);
    }
}

// Initialize payment gateway
const paymentGateway = new PaymentGateway();

// Export for use in other modules
window.PaymentGateway = PaymentGateway;
window.paymentGateway = paymentGateway;
