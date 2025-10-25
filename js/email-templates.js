// Email Template System for Sunyani Municipal Assembly Welfare System
class EmailTemplateSystem {
    constructor() {
        this.templates = {
            'payment-reminder': {
                subject: 'Payment Reminder - Sunyani Municipal Assembly Welfare',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: #1e3c72; color: white; padding: 20px; text-align: center; }
                            .content { background: #f9f9f9; padding: 20px; }
                            .footer { background: #333; color: white; padding: 10px; text-align: center; font-size: 12px; }
                            .button { background: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
                            .due-date { color: #e74c3c; font-weight: bold; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>Sunyani Municipal Assembly</h1>
                                <h2>Welfare Management System</h2>
                            </div>
                            <div class="content">
                                <h3>Dear {memberName},</h3>
                                <p>This is a friendly reminder that your monthly welfare contribution of <strong>GH₵ {amount}</strong> is due on <span class="due-date">{dueDate}</span>.</p>
                                
                                <p>Please make your payment before the due date to avoid any interruptions in your welfare benefits.</p>
                                
                                <div style="text-align: center; margin: 30px 0;">
                                    <a href="{paymentLink}" class="button">Make Payment Now</a>
                                </div>
                                
                                <p><strong>Payment Methods Available:</strong></p>
                                <ul>
                                    <li>Mobile Money (MTN, Vodafone, AirtelTigo)</li>
                                    <li>Bank Transfer</li>
                                    <li>Cash Payment at Assembly Office</li>
                                </ul>
                                
                                <p>If you have already made your payment, please disregard this reminder.</p>
                                
                                <p>Best regards,<br>
                                Welfare Management Team<br>
                                Sunyani Municipal Assembly</p>
                            </div>
                            <div class="footer">
                                <p>This is an automated message. Please do not reply to this email.</p>
                                <p>Sunyani Municipal Assembly &copy; {currentYear}. All rights reserved.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            },
            'welfare-approval': {
                subject: 'Welfare Application Update - Sunyani Municipal Assembly',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: #1e3c72; color: white; padding: 20px; text-align: center; }
                            .content { background: #f9f9f9; padding: 20px; }
                            .footer { background: #333; color: white; padding: 10px; text-align: center; font-size: 12px; }
                            .status-approved { color: #27ae60; font-weight: bold; }
                            .status-rejected { color: #e74c3c; font-weight: bold; }
                            .details { background: white; padding: 15px; border-left: 4px solid #3498db; margin: 15px 0; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>Sunyani Municipal Assembly</h1>
                                <h2>Welfare Management System</h2>
                            </div>
                            <div class="content">
                                <h3>Dear {memberName},</h3>
                                <p>Your welfare application has been reviewed and <span class="status-{status}">{status}</span>.</p>
                                
                                <div class="details">
                                    <p><strong>Service Type:</strong> {serviceName}</p>
                                    <p><strong>Requested Amount:</strong> GH₵ {requestedAmount}</p>
                                    <p><strong>Approved Amount:</strong> GH₵ {approvedAmount}</p>
                                    <p><strong>Application Date:</strong> {applicationDate}</p>
                                    {#if status === 'approved'}
                                    <p><strong>Next Steps:</strong> {nextSteps}</p>
                                    {/if}
                                    {#if comments}
                                    <p><strong>Comments:</strong> {comments}</p>
                                    {/if}
                                </div>
                                
                                {#if status === 'approved'}
                                <p>Your approved amount will be processed within 3-5 working days. You will receive another notification when the payment is made.</p>
                                {/if}
                                
                                {#if status === 'rejected'}
                                <p>If you have any questions about this decision, please contact the welfare office.</p>
                                {/if}
                                
                                <p>Best regards,<br>
                                Welfare Management Team<br>
                                Sunyani Municipal Assembly</p>
                            </div>
                            <div class="footer">
                                <p>This is an automated message. Please do not reply to this email.</p>
                                <p>Sunyani Municipal Assembly &copy; {currentYear}. All rights reserved.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            },
            'withdrawal-processed': {
                subject: 'Withdrawal Processed - Sunyani Municipal Assembly Welfare',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: #1e3c72; color: white; padding: 20px; text-align: center; }
                            .content { background: #f9f9f9; padding: 20px; }
                            .footer { background: #333; color: white; padding: 10px; text-align: center; font-size: 12px; }
                            .receipt { background: white; padding: 15px; border: 1px solid #ddd; margin: 15px 0; }
                            .receipt-item { display: flex; justify-content: space-between; margin: 5px 0; }
                            .total { border-top: 2px solid #333; padding-top: 10px; font-weight: bold; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>Sunyani Municipal Assembly</h1>
                                <h2>Welfare Management System</h2>
                            </div>
                            <div class="content">
                                <h3>Dear {memberName},</h3>
                                <p>Your withdrawal request has been processed successfully.</p>
                                
                                <div class="receipt">
                                    <h4>Withdrawal Receipt</h4>
                                    <div class="receipt-item">
                                        <span>Transaction Reference:</span>
                                        <span>{reference}</span>
                                    </div>
                                    <div class="receipt-item">
                                        <span>Amount Withdrawn:</span>
                                        <span>GH₵ {amount}</span>
                                    </div>
                                    <div class="receipt-item">
                                        <span>Withdrawal Method:</span>
                                        <span>{method}</span>
                                    </div>
                                    <div class="receipt-item">
                                        <span>Processing Date:</span>
                                        <span>{processingDate}</span>
                                    </div>
                                    <div class="receipt-item total">
                                        <span>New Balance:</span>
                                        <span>GH₵ {newBalance}</span>
                                    </div>
                                </div>
                                
                                <p><strong>Payment Details:</strong></p>
                                <p>{paymentDetails}</p>
                                
                                <p>If you did not initiate this withdrawal or have any concerns, please contact the welfare office immediately.</p>
                                
                                <p>Best regards,<br>
                                Welfare Management Team<br>
                                Sunyani Municipal Assembly</p>
                            </div>
                            <div class="footer">
                                <p>This is an automated message. Please do not reply to this email.</p>
                                <p>Sunyani Municipal Assembly &copy; {currentYear}. All rights reserved.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            },
            'general-announcement': {
                subject: 'Announcement - Sunyani Municipal Assembly Welfare',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: #1e3c72; color: white; padding: 20px; text-align: center; }
                            .content { background: #f9f9f9; padding: 20px; }
                            .footer { background: #333; color: white; padding: 10px; text-align: center; font-size: 12px; }
                            .announcement { background: white; padding: 20px; border-left: 4px solid #f39c12; margin: 15px 0; }
                            .important { background: #fff3cd; border-left-color: #ffc107; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>Sunyani Municipal Assembly</h1>
                                <h2>Welfare Management System</h2>
                            </div>
                            <div class="content">
                                <h3>Dear {memberName},</h3>
                                
                                <div class="announcement {#if important}important{/if}">
                                    <h4>{announcementTitle}</h4>
                                    <p>{announcementContent}</p>
                                    
                                    {#if effectiveDate}
                                    <p><strong>Effective Date:</strong> {effectiveDate}</p>
                                    {/if}
                                    
                                    {#if actionRequired}
                                    <p><strong>Action Required:</strong> {actionRequired}</p>
                                    {/if}
                                </div>
                                
                                {#if additionalInfo}
                                <div style="margin-top: 20px;">
                                    <p><strong>Additional Information:</strong></p>
                                    <p>{additionalInfo}</p>
                                </div>
                                {/if}
                                
                                <p>Best regards,<br>
                                Welfare Management Team<br>
                                Sunyani Municipal Assembly</p>
                            </div>
                            <div class="footer">
                                <p>This is an automated message. Please do not reply to this email.</p>
                                <p>Sunyani Municipal Assembly &copy; {currentYear}. All rights reserved.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            }
        };
    }

    // Render email template with data
    renderTemplate(templateName, data) {
        const template = this.templates[templateName];
        if (!template) {
            throw new Error(`Template '${templateName}' not found`);
        }

        let html = template.html;
        let subject = template.subject;

        // Replace variables in subject and HTML
        Object.entries(data).forEach(([key, value]) => {
            const placeholder = new RegExp(`{${key}}`, 'g');
            subject = subject.replace(placeholder, value);
            html = html.replace(placeholder, value);
        });

        // Handle conditional blocks
        html = this.processConditionalBlocks(html, data);

        // Add current year if not provided
        if (!data.currentYear) {
            html = html.replace(/{currentYear}/g, new Date().getFullYear());
            subject = subject.replace(/{currentYear}/g, new Date().getFullYear());
        }

        return { subject, html };
    }

    // Process conditional blocks in templates
    processConditionalBlocks(html, data) {
        // Simple conditional block processor
        return html.replace(/{#if ([^}]+)}([\s\S]*?){\/if}/g, (match, condition, content) => {
            const conditionMet = this.evaluateCondition(condition, data);
            return conditionMet ? content : '';
        });
    }

    // Evaluate condition in template
    evaluateCondition(condition, data) {
        // Simple condition evaluator
        if (condition.includes('===')) {
            const [left, right] = condition.split('===').map(part => part.trim().replace(/['"]/g, ''));
            return data[left] === right;
        }
        return !!data[condition];
    }

    // Get available templates
    getAvailableTemplates() {
        return Object.keys(this.templates);
    }

    // Add custom template
    addTemplate(templateName, template) {
        this.templates[templateName] = template;
    }

    // Remove template
    removeTemplate(templateName) {
        delete this.templates[templateName];
    }
}

// Initialize email template system
const emailTemplateSystem = new EmailTemplateSystem();

// Export for use in other modules
window.EmailTemplateSystem = EmailTemplateSystem;
window.emailTemplateSystem = emailTemplateSystem;
