import { describe, it, expect, beforeAll } from 'vitest';
import { format, parseISO, addHours, subHours } from 'date-fns';

// Mountain Time (America/Denver) - automatically handles MST (UTC-7) and MDT (UTC-6)
// In January, Denver is in MST (UTC-7), not MDT (UTC-6)
const MOUNTAIN_TIMEZONE = 'America/Denver';

// Use dynamic import to avoid ESM/CJS issues in test environment
// date-fns-tz v3 uses toZonedTime and fromZonedTime instead of utcToZonedTime/zonedTimeToUtc
let toZonedTime: any;
let fromZonedTime: any;

describe('Date/Time Handling (Mountain Time - America/Denver)', () => {
  beforeAll(async () => {
    const dateFnsTz = await import('date-fns-tz');
    // date-fns-tz v3 API: toZonedTime (UTC -> zoned) and fromZonedTime (zoned -> UTC)
    toZonedTime = dateFnsTz.toZonedTime;
    fromZonedTime = dateFnsTz.fromZonedTime;
    
    if (!toZonedTime || !fromZonedTime) {
      throw new Error('Failed to import date-fns-tz functions. Available keys: ' + Object.keys(dateFnsTz).join(', '));
    }
  });

  it('should correctly convert UTC to Mountain Time', () => {
    const utcDate = new Date('2025-01-20T18:00:00Z'); // 6 PM UTC
    const mountainDate = toZonedTime(utcDate, MOUNTAIN_TIMEZONE);
    
    // 6 PM UTC = 11 AM MST (UTC-7) in January (standard time, not daylight time)
    expect(format(mountainDate, 'HH:mm')).toBe('11:00');
  });

  it('should correctly convert Mountain Time to UTC', () => {
    const mountainDate = new Date('2025-01-20T12:00:00'); // 12 PM Mountain Time
    const utcDate = fromZonedTime(mountainDate, MOUNTAIN_TIMEZONE);
    
    // 12 PM MST = 7 PM UTC (UTC-7) in January
    expect(format(utcDate, 'HH:mm')).toBe('19:00');
  });

  it('should handle scheduled pickup time in Mountain Time', () => {
    const scheduledTime = '2025-01-20T14:00:00'; // 2 PM local (MST in January)
    const parsed = parseISO(scheduledTime);
    const utc = fromZonedTime(parsed, MOUNTAIN_TIMEZONE);
    
    // Should be 9 PM UTC (2 PM + 7 hours for MST)
    expect(format(utc, 'HH:mm')).toBe('21:00');
  });

  it('should format time for display correctly', () => {
    const date = new Date('2025-01-20T14:30:00');
    const formatted = format(date, 'h:mm a');
    expect(formatted).toMatch(/\d{1,2}:\d{2} (AM|PM)/);
  });

  it('should handle date comparisons correctly', () => {
    const today = new Date();
    const tomorrow = addHours(today, 24);
    const yesterday = subHours(today, 24);

    expect(tomorrow.getTime()).toBeGreaterThan(today.getTime());
    expect(yesterday.getTime()).toBeLessThan(today.getTime());
  });

  it('should validate ISO date string format', () => {
    const validISO = '2025-01-20T14:00:00Z';
    const parsed = parseISO(validISO);
    expect(parsed).toBeInstanceOf(Date);
    expect(isNaN(parsed.getTime())).toBe(false);
  });

  it('should reject invalid date strings', () => {
    const invalidDate = 'not-a-date';
    const parsed = parseISO(invalidDate);
    expect(isNaN(parsed.getTime())).toBe(true);
  });
});

