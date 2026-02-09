/**
 * Toggle Maintenance Mode Script
 * 
 * This script can be run in the browser console to toggle maintenance mode.
 * It calls the Firebase Cloud Function to update the maintenance configuration.
 * 
 * IMPORTANT: You must be logged in as an admin user to use this script.
 * 
 * Usage:
 *   1. Open your app in the browser
 *   2. Open the browser console (F12)
 *   3. Copy and paste this entire script
 *   4. Call one of the functions:
 *      - enableMaintenance()
 *      - disableMaintenance()
 *      - setCustomMaintenance(options)
 */

// Import Firebase functions (must be available in the page context)
const { httpsCallable } = window.firebase.functions;
const { getFunctions } = window.firebase.functions;

/**
 * Enable maintenance mode with default message
 */
async function enableMaintenance() {
  try {
    console.log('🔧 Enabling maintenance mode...');
    
    const functions = getFunctions();
    const setMaintenanceMode = httpsCallable(functions, 'setMaintenanceMode');
    
    const result = await setMaintenanceMode({
      isMaintenanceMode: true,
      title: 'Down for Maintenance',
      subtitle: "We're making some improvements. Check back soon!",
      date: '', // Optional: set an expected completion date/time
    });
    
    console.log('✅ Maintenance mode ENABLED!');
    console.log('📊 Configuration:', result.data);
    console.log('🔄 Page will reload to show maintenance page...');
    
    // Reload the page to show maintenance page
    setTimeout(() => window.location.reload(), 2000);
  } catch (error) {
    console.error('❌ Failed to enable maintenance mode:', error);
    console.error('Error details:', error.message);
    
    if (error.code === 'unauthenticated') {
      console.error('🔐 You must be logged in to toggle maintenance mode');
    } else if (error.code === 'permission-denied') {
      console.error('🔐 You must be an admin to toggle maintenance mode');
    }
  }
}

/**
 * Disable maintenance mode
 */
async function disableMaintenance() {
  try {
    console.log('🔧 Disabling maintenance mode...');
    
    const functions = getFunctions();
    const setMaintenanceMode = httpsCallable(functions, 'setMaintenanceMode');
    
    const result = await setMaintenanceMode({
      isMaintenanceMode: false,
    });
    
    console.log('✅ Maintenance mode DISABLED!');
    console.log('📊 Configuration:', result.data);
    console.log('🔄 Page will reload to restore normal operation...');
    
    // Reload the page to restore normal operation
    setTimeout(() => window.location.reload(), 2000);
  } catch (error) {
    console.error('❌ Failed to disable maintenance mode:', error);
    console.error('Error details:', error.message);
    
    if (error.code === 'unauthenticated') {
      console.error('🔐 You must be logged in to toggle maintenance mode');
    } else if (error.code === 'permission-denied') {
      console.error('🔐 You must be an admin to toggle maintenance mode');
    }
  }
}

/**
 * Set custom maintenance mode with specific message and date
 * @param {object} options - Configuration options
 * @param {boolean} options.enabled - Whether to enable maintenance mode
 * @param {string} [options.title] - Custom title for maintenance page
 * @param {string} [options.subtitle] - Custom message for maintenance page
 * @param {string} [options.date] - Expected completion date/time (e.g., "2024-03-20T15:00:00")
 */
async function setCustomMaintenance(options) {
  try {
    console.log('🔧 Setting custom maintenance mode...');
    
    const functions = getFunctions();
    const setMaintenanceMode = httpsCallable(functions, 'setMaintenanceMode');
    
    const config = {
      isMaintenanceMode: options.enabled,
      title: options.title || 'Down for Maintenance',
      subtitle: options.subtitle || "We're making some improvements. Check back soon!",
      date: options.date || '',
    };
    
    const result = await setMaintenanceMode(config);
    
    console.log(`✅ Maintenance mode ${options.enabled ? 'ENABLED' : 'DISABLED'}!`);
    console.log('📊 Configuration:', result.data);
    console.log('🔄 Page will reload in 2 seconds...');
    
    // Reload the page
    setTimeout(() => window.location.reload(), 2000);
  } catch (error) {
    console.error('❌ Failed to set maintenance mode:', error);
    console.error('Error details:', error.message);
    
    if (error.code === 'unauthenticated') {
      console.error('🔐 You must be logged in to toggle maintenance mode');
    } else if (error.code === 'permission-denied') {
      console.error('🔐 You must be an admin to toggle maintenance mode');
    }
  }
}

// Make functions available globally
window.enableMaintenance = enableMaintenance;
window.disableMaintenance = disableMaintenance;
window.setCustomMaintenance = setCustomMaintenance;

console.log('✅ Maintenance mode toggle script loaded!');
console.log('📋 Available functions:');
console.log('  - enableMaintenance()');
console.log('  - disableMaintenance()');
console.log('  - setCustomMaintenance({ enabled: true, title: "...", subtitle: "...", date: "..." })');
