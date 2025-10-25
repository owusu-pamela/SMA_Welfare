// Advanced Notification System for Sunyani Municipal Assembly Welfare System
class NotificationSystem {
    constructor() {
        this.config = {
            email: {
                enabled: true,
                provider: 'smtp', // or 'sendgrid', 'mailgun'
                templates: {
                    payment_reminder: 'payment-reminder.html',
                    welfare_approval: 'welfare-approval.html',
                    withdrawal_processed: 'withdrawal-processed.html',
                    general_announcement: 'general-announcement.html'
                }
            },
            sms: {
                enabled: true,
                provider: 'twilio', // or 'africastalking', 'hubtel'
                templates: {
                    payment_reminder: 'Your monthly contribution of GH₵ {amount} is due on {dueDate}. Pay now: {paymentLink}',
                    welfare_approval: 'Your welfare application for {service} has been {status}. Amount: GH₵ {amount}',
                    withdrawal_processed: 'Your withdrawal of GH₵ {amount} has been processed. Ref: {reference}'
                }
            },
            push: {
                enabled: true,
                providers: ['firebase', 'onesignal']
            }
        };
        
        this.initializeNotificationHandlers();
    }

    // Initialize notification event handlers
    initializeNotificationHandlers() {
        // Listen for system events that should trigger notifications
        document.addEventListener('paymentReceived', (event) => {
            this.handlePaymentReceived(event.detail);
        });

        document.addEventListener('welfareApplicationSubmitted', (event) => {
            this.handleWelfareApplication(event.detail);
        });

        document.addEventListener('withdrawalRequested', (event) => {
            this.handleWithdrawalRequest(event.detail);
        });

        document.addEventListener('contributionDue', (event) => {
            this.handleContributionDue(event.detail);
        });
    }

    // Handle payment received event
    async handlePaymentReceived(paymentData) {
        const notifications = [
            {
                type: 'member_payment_confirmation',
                recipient: paymentData.memberId,
                title: 'Payment Received',
                message: `Your payment of GH₵ ${paymentData.amount} has been received successfully.`,
                priority: 'high',
                channels: ['email', 'sms', 'push']
            },
            {
                type: 'admin_payment_notification',
                recipient: 'admin',
                title: 'New Payment Received',
                message: `${paymentData.memberName} paid GH₵ ${paymentData.amount}`,
                priority: 'medium',
                channels: ['email']
            }
        ];

        for (const notification of notifications) {
            await this.sendNotification(notification);
        }
    }

    // Handle welfare application event
    async handleWelfareApplication(applicationData) {
        const notifications = [
            {
                type: 'member_application_confirmation',
                recipient: applicationData.memberId,
                title: 'Application Submitted',
                message: `Your ${applicationData.serviceName} application has been submitted for review.`,
                priority: 'medium',
                channels: ['email', 'sms']
            },
            {
                type: 'admin_welfare_notification',
                recipient: 'admin',
                title: 'New Welfare Application',
                message: `${applicationData.memberName} applied for ${applicationData.serviceName} - GH₵ ${applicationData.amount}`,
                priority: 'high',
                channels: ['email', 'push']
            }
        ];

        for (const notification of notifications) {
            await this.sendNotification(notification);
        }
    }

    // Handle withdrawal request event
    async handleWithdrawalRequest(withdrawalData) {
        const notifications = [
            {
                type: 'member_withdrawal_confirmation',
                recipient: withdrawalData.memberId,
                title: 'Withdrawal Request Received',
                message: `Your withdrawal request for GH₵ ${withdrawalData.amount} is being processed.`,
                priority: 'medium',
                channels: ['email', 'sms']
            },
            {
                type: 'admin_withdrawal_notification',
                recipient: 'admin',
                title: 'New Withdrawal Request',
                message: `${withdrawalData.memberName} requested GH₵ ${withdrawalData.amount} withdrawal`,
                priority: 'high',
                channels: ['email']
            }
        ];

        for (const notification of notifications) {
            await this.sendNotification(notification);
        }
    }

    // Handle contribution due event
    async handleContributionDue(dueData) {
        const notifications = dueData.members.map(member => ({
            type: 'payment_reminder',
            recipient: member.id,
            title: 'Payment Reminder',
            message: `Your monthly contribution of GH₵ ${member.monthlyDue} is due on ${dueData.dueDate}.`,
            priority: 'high',
            channels: ['email', 'sms', 'push'],
            data: {
                dueDate: dueData.dueDate,
                amount: member.monthlyDue,
                paymentLink: `${window.location.origin}/member-dashboard.html`
            }
        }));

        for (const notification of notifications) {
            await this.sendNotification(notification);
        }
    }

    // Send notification through configured channels
    async sendNotification(notification) {
        const { recipient, channels, ...notificationData } = notification;
        
        try {
            // Save to database
            const notificationId = await this.saveNotificationToDatabase({
                ...notificationData,
                recipient,
                status: 'pending',
                createdAt: new Date().toISOString()
            });

            // Send through each channel
            const channelPromises = channels.map(channel => {
                switch (channel) {
                    case 'email':
                        return this.sendEmailNotification(recipient, notificationData);
                    case 'sms':
                        return this.sendSMSNotification(recipient, notificationData);
                    case 'push':
                        return this.sendPushNotification(recipient, notificationData);
                    default:
                        return Promise.resolve();
                }
            });

            await Promise.allSettled(channelPromises);
            
            // Update notification status
            await this.updateNotificationStatus(notificationId, 'sent');
            
            console.log(`Notification sent to ${recipient} via ${channels.join(', ')}`);
            
        } catch (error) {
            console.error('Error sending notification:', error);
            await this.updateNotificationStatus(notificationId, 'failed');
        }
    }

    // Send email notification
    async sendEmailNotification(recipient, notification) {
        if (!this.config.email.enabled) return;

        const emailData = await this.prepareEmailData(recipient, notification);
        
        // Simulate email sending - integrate with your email service
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                console.log('Email sent:', {
                    to: emailData.to,
                    subject: emailData.subject,
                    template: emailData.template
                });
                resolve();
            }, 1000);
        });
    }

    // Send SMS notification
    async sendSMSNotification(recipient, notification) {
        if (!this.config.sms.enabled) return;

        const smsData = await this.prepareSMSData(recipient, notification);
        
        // Simulate SMS sending - integrate with your SMS service
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                console.log('SMS sent:', {
                    to: smsData.to,
                    message: smsData.message
                });
                resolve();
            }, 500);
        });
    }

    // Send push notification
    async sendPushNotification(recipient, notification) {
        if (!this.config.push.enabled) return;

        const pushData = await this.preparePushData(recipient, notification);
        
        // Simulate push notification - integrate with your push service
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                console.log('Push notification sent:', {
                    to: recipient,
                    title: pushData.title,
                    body: pushData.body
                });
                resolve();
            }, 300);
        });
    }

    // Prepare email data
    async prepareEmailData(recipient, notification) {
        const member = await WelfareDB.getMember(recipient);
        const template = this.config.email.templates[notification.type] || 'general.html';
        
        return {
            to: member.email,
            subject: notification.title,
            template: template,
            data: {
                memberName: member.name,
                ...notification.data,
                ...notification
            }
        };
    }

    // Prepare SMS data
    async prepareSMSData(recipient, notification) {
        const member = await WelfareDB.getMember(recipient);
        const template = this.config.sms.templates[notification.type] || notification.message;
        
        // Replace template variables
        let message = template;
        if (notification.data) {
            Object.entries(notification.data).forEach(([key, value]) => {
                message = message.replace(new RegExp(`{${key}}`, 'g'), value);
            });
        }
        
        return {
            to: member.phone,
            message: message
        };
    }

    // Prepare push data
    async preparePushData(recipient, notification) {
        return {
            title: notification.title,
            body: notification.message,
            data: notification.data || {},
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png'
        };
    }

    // Save notification to database
    async saveNotificationToDatabase(notificationData) {
        return await WelfareDB.addNotification(notificationData);
    }

    // Update notification status
    async updateNotificationStatus(notificationId, status) {
        // This would update the notification status in the database
        console.log(`Notification ${notificationId} status updated to: ${status}`);
    }

    // Bulk notifications for announcements
    async sendBulkAnnouncement(announcementData) {
        const { title, message, target, channels } = announcementData;
        
        let recipients = [];
        
        if (target === 'all_members') {
            const members = await WelfareDB.getMembers();
            recipients = Object.values(members).filter(m => m.status === 'active');
        } else if (target === 'specific_department') {
            const members = await WelfareDB.getMembers();
            recipients = Object.values(members).filter(m => 
                m.status === 'active' && m.department === announcementData.department
            );
        } else if (target === 'overdue_members') {
            recipients = await this.getOverdueMembers();
        }
        
        const notifications = recipients.map(member => ({
            type: 'general_announcement',
            recipient: member.id,
            title: title,
            message: message,
            priority: 'medium',
            channels: channels || ['email'],
            data: {
                announcementDate: new Date().toLocaleDateString()
            }
        }));

        // Send in batches to avoid overwhelming the system
        const batchSize = 10;
        for (let i = 0; i < notifications.length; i += batchSize) {
            const batch = notifications.slice(i, i + batchSize);
            await Promise.allSettled(batch.map(notification => this.sendNotification(notification)));
            
            // Delay between batches
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        return {
            totalSent: notifications.length,
            success: true
        };
    }

    // Get members with overdue payments
    async getOverdueMembers() {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const members = await WelfareDB.getMembers();
        const contributions = await WelfareDB.getContributions();
        
        return Object.values(members).filter(member => {
            const hasPaid = Object.values(contributions).some(contribution => 
                contribution.memberId === member.id && 
                contribution.month === currentMonth && 
                contribution.year === currentYear
            );
            return !hasPaid && member.status === 'active';
        });
    }

    // Schedule automated notifications
    scheduleAutomatedNotifications() {
        // Schedule payment reminders (runs daily at 8:00 AM)
        this.scheduleDailyReminders();
        
        // Schedule monthly reports (runs on 1st of every month)
        this.scheduleMonthlyReports();
        
        // Schedule welfare application follow-ups (runs weekly)
        this.scheduleWeeklyFollowups();
    }

    // Schedule daily payment reminders
    scheduleDailyReminders() {
        const now = new Date();
        const nextRun = new Date();
        nextRun.setHours(8, 0, 0, 0); // 8:00 AM
        
        if (now > nextRun) {
            nextRun.setDate(nextRun.getDate() + 1);
        }
        
        const delay = nextRun.getTime() - now.getTime();
        
        setTimeout(() => {
            this.sendDailyPaymentReminders();
            // Reschedule for next day
            this.scheduleDailyReminders();
        }, delay);
    }

    // Send daily payment reminders
    async sendDailyPaymentReminders() {
        const currentDate = new Date();
        const dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 15); // 15th of month
        
        // Send reminders only if within 5 days of due date
        const daysUntilDue = Math.ceil((dueDate - currentDate) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue >= 0 && daysUntilDue <= 5) {
            const overdueMembers = await this.getOverdueMembers();
            
            if (overdueMembers.length > 0) {
                const dueData = {
                    members: overdueMembers,
                    dueDate: dueDate.toLocaleDateString()
                };
                
                await this.handleContributionDue(dueData);
                console.log(`Sent payment reminders to ${overdueMembers.length} members`);
            }
        }
    }

    // Schedule monthly reports
    scheduleMonthlyReports() {
        const now = new Date();
        const firstOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const delay = firstOfNextMonth.getTime() - now.getTime();
        
        setTimeout(() => {
            this.sendMonthlyReports();
            // Reschedule for next month
            this.scheduleMonthlyReports();
        }, delay);
    }

    // Send monthly reports
    async sendMonthlyReports() {
        // Implementation for sending monthly reports to admins
        console.log('Sending monthly reports...');
    }

    // Schedule weekly follow-ups
    scheduleWeeklyFollowups() {
        // Every Monday at 9:00 AM
        const now = new Date();
        const nextMonday = new Date();
        nextMonday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7));
        nextMonday.setHours(9, 0, 0, 0);
        
        const delay = nextMonday.getTime() - now.getTime();
        
        setTimeout(() => {
            this.sendWeeklyFollowups();
            // Reschedule for next week
            this.scheduleWeeklyFollowups();
        }, delay);
    }

    // Send weekly follow-ups
    async sendWeeklyFollowups() {
        // Implementation for weekly follow-up notifications
        console.log('Sending weekly follow-ups...');
    }

    // Notification analytics
    async getNotificationAnalytics(timeframe = 'month') {
        const notifications = await WelfareDB.getNotifications();
        const now = new Date();
        let startDate;
        
        switch (timeframe) {
            case 'day':
                startDate = new Date(now.setDate(now.getDate() - 1));
                break;
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'month':
                startDate = new Date(now.setMonth(now.getMonth() - 1));
                break;
            default:
                startDate = new Date(now.setMonth(now.getMonth() - 1));
        }
        
        const filteredNotifications = Object.values(notifications).filter(notification => 
            new Date(notification.createdAt) >= startDate
        );
        
        const analytics = {
            total: filteredNotifications.length,
            byType: this.groupBy(filteredNotifications, 'type'),
            byStatus: this.groupBy(filteredNotifications, 'status'),
            byChannel: this.calculateChannelDistribution(filteredNotifications),
            deliveryRate: this.calculateDeliveryRate(filteredNotifications)
        };
        
        return analytics;
    }

    // Group notifications by property
    groupBy(notifications, property) {
        return notifications.reduce((groups, notification) => {
            const key = notification[property];
            groups[key] = (groups[key] || 0) + 1;
            return groups;
        }, {});
    }

    // Calculate channel distribution
    calculateChannelDistribution(notifications) {
        const channels = {};
        notifications.forEach(notification => {
            notification.channels?.forEach(channel => {
                channels[channel] = (channels[channel] || 0) + 1;
            });
        });
        return channels;
    }

    // Calculate delivery rate
    calculateDeliveryRate(notifications) {
        const sent = notifications.filter(n => n.status === 'sent').length;
        const failed = notifications.filter(n => n.status === 'failed').length;
        const total = sent + failed;
        
        return total > 0 ? (sent / total) * 100 : 0;
    }
}

// Initialize notification system
const notificationSystem = new NotificationSystem();

// Export for use in other modules
window.NotificationSystem = NotificationSystem;
window.notificationSystem = notificationSystem;

// Start automated notifications when system loads
document.addEventListener('DOMContentLoaded', () => {
    notificationSystem.scheduleAutomatedNotifications();
});
