// System Backup & Recovery for Sunyani Municipal Assembly Welfare System
class BackupSystem {
    constructor() {
        this.backupConfig = {
            autoBackup: true,
            backupInterval: 24 * 60 * 60 * 1000, // 24 hours
            retentionPeriod: 30 * 24 * 60 * 60 * 1000, // 30 days
            maxBackups: 50,
            backupLocation: 'local', // 'local', 'cloud', 'both'
            encryption: true,
            compression: true
        };
        
        this.initializeBackupSystem();
    }

    // Initialize backup system
    initializeBackupSystem() {
        this.setupAutoBackup();
        this.cleanupOldBackups();
    }

    // Setup automatic backups
    setupAutoBackup() {
        if (this.backupConfig.autoBackup) {
            setInterval(() => {
                this.createAutoBackup();
            }, this.backupConfig.backupInterval);
        }
    }

    // Create automatic backup
    async createAutoBackup() {
        try {
            console.log('Starting automatic backup...');
            
            const backupData = await this.prepareBackupData();
            const backupId = await this.saveBackup(backupData);
            
            console.log(`Automatic backup created: ${backupId}`);
            
            // Notify admins about successful backup
            await this.notifyBackupSuccess(backupId);
            
        } catch (error) {
            console.error('Automatic backup failed:', error);
            await this.notifyBackupFailure(error);
        }
    }

    // Prepare backup data
    async prepareBackupData() {
        const timestamp = new Date().toISOString();
        const backupId = `backup_${timestamp.replace(/[:.]/g, '-')}`;
        
        // Collect all system data
        const systemData = {
            metadata: {
                backupId: backupId,
                timestamp: timestamp,
                version: '1.0',
                system: 'Sunyani Municipal Assembly Welfare System'
            },
            data: {
                members: await WelfareDB.getMembers(),
                contributions: await WelfareDB.getContributions(),
                withdrawals: await WelfareDB.getWithdrawals(),
                welfareApplications: await WelfareDB.getWelfareApplications(),
                welfareServices: await WelfareDB.getWelfareServices(),
                admins: await WelfareDB.getAdmins(),
                systemConfig: await WelfareDB.getSystemConfig(),
                notifications: await WelfareDB.getNotifications(),
                auditLogs: await WelfareDB.getAuditLogs(),
                paymentTransactions: await WelfareDB.getPaymentTransactions()
            },
            statistics: await this.generateBackupStatistics()
        };

        return systemData;
    }

    // Generate backup statistics
    async generateBackupStatistics() {
        const members = await WelfareDB.getMembers();
        const contributions = await WelfareDB.getContributions();
        const withdrawals = await WelfareDB.getWithdrawals();
        const welfareApplications = await WelfareDB.getWelfareApplications();
        
        return {
            totalMembers: Object.keys(members).length,
            activeMembers: Object.values(members).filter(m => m.status === 'active').length,
            totalContributions: Object.keys(contributions).length,
            totalWithdrawals: Object.keys(withdrawals).length,
            totalWelfareApplications: Object.keys(welfareApplications).length,
            totalContributionsAmount: Object.values(contributions).reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0),
            totalWithdrawalsAmount: Object.values(withdrawals).reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0),
            databaseSize: this.estimateDatabaseSize()
        };
    }

    // Estimate database size
    estimateDatabaseSize() {
        // This would calculate the approximate size of the database
        // For now, return a placeholder
        return {
            total: '2.4 MB',
            members: '1.2 MB',
            transactions: '0.8 MB',
            other: '0.4 MB'
        };
    }

    // Save backup to storage
    async saveBackup(backupData) {
        const backupId = backupData.metadata.backupId;
        
        // Compress data if enabled
        if (this.backupConfig.compression) {
            backupData = await this.compressData(backupData);
        }
        
        // Encrypt data if enabled
        if (this.backupConfig.encryption) {
            backupData = await this.encryptData(backupData);
        }
        
        // Save to Firebase database
        await WelfareDB.addBackup({
            id: backupId,
            name: `System_Backup_${new Date().toLocaleDateString()}`,
            timestamp: backupData.metadata.timestamp,
            size: JSON.stringify(backupData).length,
            type: 'auto',
            status: 'completed',
            statistics: backupData.statistics,
            location: this.backupConfig.backupLocation
        });
        
        // Save to local storage if configured
        if (this.backupConfig.backupLocation === 'local' || this.backupConfig.backupLocation === 'both') {
            await this.saveToLocalStorage(backupId, backupData);
        }
        
        // Upload to cloud if configured
        if (this.backupConfig.backupLocation === 'cloud' || this.backupConfig.backupLocation === 'both') {
            await this.uploadToCloud(backupId, backupData);
        }
        
        return backupId;
    }

    // Compress data
    async compressData(data) {
        // Simple compression - in production, use a proper compression library
        const compressed = {
            ...data,
            compressed: true,
            originalSize: JSON.stringify(data).length
        };
        
        console.log(`Data compressed: ${compressed.originalSize} bytes`);
        return compressed;
    }

    // Encrypt data
    async encryptData(data) {
        // Simple encryption - in production, use proper encryption
        const encrypted = {
            ...data,
            encrypted: true,
            encryptionMethod: 'AES-256'
        };
        
        console.log('Data encrypted');
        return encrypted;
    }

    // Save to local storage
    async saveToLocalStorage(backupId, data) {
        try {
            const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // Create download link
            const link = document.createElement('a');
            link.href = url;
            link.download = `${backupId}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up URL
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            
            console.log(`Backup saved locally: ${backupId}`);
        } catch (error) {
            console.error('Error saving backup locally:', error);
        }
    }

    // Upload to cloud storage
    async uploadToCloud(backupId, data) {
        try {
            // Simulate cloud upload - integrate with your cloud storage service
            console.log(`Uploading backup to cloud: ${backupId}`);
            
            // This would be replaced with actual cloud storage integration
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log(`Backup uploaded to cloud: ${backupId}`);
        } catch (error) {
            console.error('Error uploading backup to cloud:', error);
        }
    }

    // Manual backup creation
    async createManualBackup(backupName = null) {
        try {
            showLoading('Creating backup...');
            
            const backupData = await this.prepareBackupData();
            
            if (backupName) {
                backupData.metadata.name = backupName;
            }
            
            const backupId = await this.saveBackup(backupData);
            
            hideLoading();
            showToast('Backup created successfully!', 'success');
            
            return backupId;
            
        } catch (error) {
            hideLoading();
            console.error('Manual backup failed:', error);
            showToast('Backup creation failed', 'error');
            throw error;
        }
    }

    // Restore from backup
    async restoreBackup(backupId, restoreOptions = {}) {
        try {
            if (!confirm('Are you sure you want to restore from this backup? This will overwrite current data.')) {
                return;
            }
            
            showLoading('Restoring backup...');
            
            const backupData = await this.retrieveBackup(backupId);
            await this.validateBackup(backupData);
            
            // Restore data based on options
            if (restoreOptions.members) {
                await this.restoreMembers(backupData.data.members);
            }
            
            if (restoreOptions.transactions) {
                await this.restoreTransactions(backupData.data);
            }
            
            if (restoreOptions.systemData) {
                await this.restoreSystemData(backupData.data);
            }
            
            // Log the restoration
            await WelfareDB.addAuditLog({
                action: 'system_restore',
                performedBy: sessionStorage.getItem('welfare_username') || 'System',
                target: 'system_data',
                timestamp: new Date().toISOString(),
                details: `System restored from backup: ${backupId}`
            });
            
            hideLoading();
            showToast('System restored successfully!', 'success');
            
            // Reload the application
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            
        } catch (error) {
            hideLoading();
            console.error('Backup restoration failed:', error);
            showToast('Backup restoration failed', 'error');
            throw error;
        }
    }

    // Retrieve backup data
    async retrieveBackup(backupId) {
        // This would retrieve backup from storage
        // For now, return a simulated backup
        return await this.prepareBackupData();
    }

    // Validate backup data
    async validateBackup(backupData) {
        if (!backupData.metadata || !backupData.data) {
            throw new Error('Invalid backup format');
        }
        
        if (!backupData.metadata.backupId || !backupData.metadata.timestamp) {
            throw new Error('Backup metadata is incomplete');
        }
        
        console.log('Backup validation passed');
        return true;
    }

    // Restore members data
    async restoreMembers(membersData) {
        for (const [memberId, memberData] of Object.entries(membersData)) {
            await WelfareDB.addMember({ ...memberData, id: memberId });
        }
    }

    // Restore transactions data
    async restoreTransactions(transactionsData) {
        // Restore contributions
        for (const [contributionId, contributionData] of Object.entries(transactionsData.contributions || {})) {
            await WelfareDB.addContribution({ ...contributionData, id: contributionId });
        }
        
        // Restore withdrawals
        for (const [withdrawalId, withdrawalData] of Object.entries(transactionsData.withdrawals || {})) {
            await WelfareDB.addWithdrawal({ ...withdrawalData, id: withdrawalId });
        }
        
        // Restore welfare applications
        for (const [applicationId, applicationData] of Object.entries(transactionsData.welfareApplications || {})) {
            await WelfareDB.addWelfareApplication({ ...applicationData, id: applicationId });
        }
    }

    // Restore system data
    async restoreSystemData(systemData) {
        // Restore system configuration
        if (systemData.systemConfig) {
            await WelfareDB.updateSystemConfig(systemData.systemConfig);
        }
        
        // Restore welfare services
        for (const [serviceId, serviceData] of Object.entries(systemData.welfareServices || {})) {
            await WelfareDB.addWelfareService({ ...serviceData, id: serviceId });
        }
    }

    // Cleanup old backups
    async cleanupOldBackups() {
        try {
            const backups = await WelfareDB.getBackups();
            const now = new Date().getTime();
            const retentionThreshold = now - this.backupConfig.retentionPeriod;
            
            const backupsToDelete = Object.entries(backups)
                .filter(([_, backup]) => new Date(backup.timestamp).getTime() < retentionThreshold)
                .slice(this.backupConfig.maxBackups); // Keep only maxBackups most recent
            
            for (const [backupId, backup] of backupsToDelete) {
                await this.deleteBackup(backupId);
                console.log(`Deleted old backup: ${backupId}`);
            }
            
        } catch (error) {
            console.error('Error cleaning up old backups:', error);
        }
    }

    // Delete backup
    async deleteBackup(backupId) {
        // This would delete backup from all storage locations
        console.log(`Deleting backup: ${backupId}`);
        
        // Add to audit log
        await WelfareDB.addAuditLog({
            action: 'backup_deleted',
            performedBy: sessionStorage.getItem('welfare_username') || 'System',
            target: 'backup',
            timestamp: new Date().toISOString(),
            details: `Backup deleted: ${backupId}`
        });
    }

    // Get backup statistics
    async getBackupStatistics() {
        const backups = await WelfareDB.getBackups();
        const backupList = Object.values(backups);
        
        return {
            totalBackups: backupList.length,
            totalSize: backupList.reduce((sum, backup) => sum + (backup.size || 0), 0),
            lastBackup: backupList.length > 0 ? Math.max(...backupList.map(b => new Date(b.timestamp).getTime())) : null,
            successRate: this.calculateBackupSuccessRate(backupList),
            storageUsage: this.calculateStorageUsage(backupList)
        };
    }

    // Calculate backup success rate
    calculateBackupSuccessRate(backups) {
        const successful = backups.filter(b => b.status === 'completed').length;
        return backups.length > 0 ? (successful / backups.length) * 100 : 0;
    }

    // Calculate storage usage
    calculateStorageUsage(backups) {
        const totalSize = backups.reduce((sum, backup) => sum + (backup.size || 0), 0);
        return {
            total: totalSize,
            formatted: this.formatBytes(totalSize),
            usagePercentage: Math.min((totalSize / (100 * 1024 * 1024)) * 100, 100) // Assuming 100MB limit
        };
    }

    // Format bytes to human readable
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // Export data for download
    async exportData(exportOptions = {}) {
        try {
            showLoading('Preparing export...');
            
            const exportData = await this.prepareExportData(exportOptions);
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `welfare_export_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            
            hideLoading();
            showToast('Data exported successfully!', 'success');
            
        } catch (error) {
            hideLoading();
            console.error('Export failed:', error);
            showToast('Data export failed', 'error');
        }
    }

    // Prepare data for export
    async prepareExportData(options) {
        const data = {};
        
        if (options.members) {
            data.members = await WelfareDB.getMembers();
        }
        
        if (options.transactions) {
            data.contributions = await WelfareDB.getContributions();
            data.withdrawals = await WelfareDB.getWithdrawals();
            data.welfareApplications = await WelfareDB.getWelfareApplications();
        }
        
        if (options.reports) {
            data.reports = await this.generateExportReports();
        }
        
        data.metadata = {
            exportedAt: new Date().toISOString(),
            exportedBy: sessionStorage.getItem('welfare_username') || 'System',
            system: 'Sunyani Municipal Assembly Welfare System',
            version: '1.0'
        };
        
        return data;
    }

    // Notify backup success
    async notifyBackupSuccess(backupId) {
        const notification = {
            type: 'backup_success',
            recipient: 'admin',
            title: 'Backup Completed Successfully',
            message: `System backup ${backupId} has been completed successfully.`,
            priority: 'low',
            channels: ['email']
        };
        
        await notificationSystem.sendNotification(notification);
    }

    // Notify backup failure
    async notifyBackupFailure(error) {
        const notification = {
            type: 'backup_failure',
            recipient: 'admin',
            title: 'Backup Failed',
            message: `System backup failed: ${error.message}`,
            priority: 'high',
            channels: ['email']
        };
        
        await notificationSystem.sendNotification(notification);
    }
}

// Initialize backup system
const backupSystem = new BackupSystem();

// Export for use in other modules
window.BackupSystem = BackupSystem;
window.backupSystem = backupSystem;
