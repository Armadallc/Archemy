/**
 * Feature Flags for Full Calendar Integration
 * 
 * Controls gradual rollout of full-calendar features
 * All flags default to false for safety
 * 
 * Uses Vite's import.meta.env for environment variables
 */

export const FEATURE_FLAGS = {
  // Full Calendar Integration
  FULL_CALENDAR_VIEWS: import.meta.env.VITE_ENABLE_FULL_CALENDAR_VIEWS === 'true',
  FULL_CALENDAR_RESIZE: import.meta.env.VITE_ENABLE_EVENT_RESIZE === 'true',
  FULL_CALENDAR_AGENDA_VIEW: import.meta.env.VITE_ENABLE_AGENDA_VIEW === 'true',
  FULL_CALENDAR_TIME_FORMAT: import.meta.env.VITE_ENABLE_TIME_FORMAT === 'true',
  FULL_CALENDAR_STAFF_FILTER: import.meta.env.VITE_ENABLE_STAFF_FILTER === 'true',
  FULL_CALENDAR_MONTH_VIEW: import.meta.env.VITE_ENABLE_MONTH_VIEW === 'true',
  FULL_CALENDAR_YEAR_VIEW: import.meta.env.VITE_ENABLE_YEAR_VIEW === 'true',
  FULL_CALENDAR_LAYOUT: import.meta.env.VITE_ENABLE_FULL_CALENDAR_LAYOUT === 'true',
} as const;

// Debug: Log enabled feature flags in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  const enabledFlags = Object.entries(FEATURE_FLAGS)
    .filter(([_, enabled]) => enabled)
    .map(([name]) => name);
  if (enabledFlags.length > 0) {
    console.log('✅ Enabled Feature Flags:', enabledFlags);
  }
}

/**
 * Check if any full-calendar feature is enabled
 */
export const isFullCalendarEnabled = (): boolean => {
  return Object.values(FEATURE_FLAGS).some(flag => flag === true);
};

/**
 * Get all enabled feature flags (for debugging)
 */
export const getEnabledFlags = (): string[] => {
  return Object.entries(FEATURE_FLAGS)
    .filter(([_, enabled]) => enabled)
    .map(([name]) => name);
};

