/**
 * Rollback Manager for Feature Flags
 * Provides safe rollback mechanisms for the unified header feature
 */

export class RollbackManager {
  private static readonly FEATURE_FLAG_KEY = 'HALCYON_UNIFIED_HEADER';
  private static readonly ENV_FLAG = 'VITE_ENABLE_UNIFIED_HEADER';

  /**
   * Enable the unified header feature
   */
  static enableUnifiedHeader(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.FEATURE_FLAG_KEY, 'true');
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Unified header enabled. Reloading page...');
      }
      window.location.reload();
    }
  }

  /**
   * Disable the unified header feature (rollback)
   */
  static disableUnifiedHeader(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.FEATURE_FLAG_KEY);
      if (process.env.NODE_ENV === 'development') {
        console.log('⏪ Unified header disabled. Rolling back to old layout...');
      }
      window.location.reload();
    }
  }

  /**
   * Check if unified header is enabled
   */
  static isUnifiedHeaderEnabled(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    
    const localStorageFlag = localStorage.getItem(this.FEATURE_FLAG_KEY) === 'true';
    const envFlag = import.meta.env[this.ENV_FLAG] === 'true';
    
    return localStorageFlag || envFlag;
  }

  /**
   * Toggle the unified header feature
   */
  static toggleUnifiedHeader(): void {
    if (this.isUnifiedHeaderEnabled()) {
      this.disableUnifiedHeader();
    } else {
      this.enableUnifiedHeader();
    }
  }
}

// Expose to window in development for easy console access
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).HALCYON_ROLLBACK = RollbackManager;
  console.log('🔧 Rollback Manager available: window.HALCYON_ROLLBACK');
  console.log('   - enableUnifiedHeader()');
  console.log('   - disableUnifiedHeader()');
  console.log('   - toggleUnifiedHeader()');
  console.log('   - isUnifiedHeaderEnabled()');
}




