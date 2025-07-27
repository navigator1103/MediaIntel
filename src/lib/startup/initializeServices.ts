/**
 * Application Service Initialization
 * Initializes background services when the app starts
 */

import { initializeBackupScheduler } from '../scheduler/backupScheduler';

let servicesInitialized = false;

export function initializeServices() {
  if (servicesInitialized) {
    return; // Already initialized
  }

  try {
    console.log('🚀 Initializing application services...');
    
    // Initialize backup scheduler
    initializeBackupScheduler();
    
    servicesInitialized = true;
    console.log('✅ All services initialized successfully');
    
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
    // Don't throw - app should still work even if background services fail
  }
}

// Auto-initialize when this module is imported in a server context
// Only initialize once per process, not per import
if (typeof window === 'undefined' && !global.__servicesInitialized) {
  // We're on the server and haven't initialized yet
  global.__servicesInitialized = true;
  initializeServices();
}