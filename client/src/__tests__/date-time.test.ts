import { describe, it, expect, beforeAll } from 'vitest';
import { format, parseISO, addHours, subHours } from 'date-fns';

// MDT is UTC-6 (Mountain Daylight Time)
const MDT_TIMEZONE = 'America/Denver';

// Use dynamic import to avoid ESM/CJS issues in test environment
// date-fns-tz v3 uses toZonedTime and fromZonedTime instead of utcToZonedTime/zonedTimeToUtc
let toZonedTime: any;
let fromZonedTime: any;

describe('Date/Time Handling (MDT UTC-6)', () => {
  beforeAll(async () => {
    const dateFnsTz = await import('date-fns-tz');
    // date-fns-tz v3 API: toZonedTime (UTC -> zoned) and fromZonedTime (zoned -> UTC)
    toZonedTime = dateFnsTz.toZonedTime;
    fromZonedTime = dateFnsTz.fromZonedTime;
    
    if (!toZonedTime || !fromZonedTime) {
      throw new Error('Failed to import date-fns-tz functions. Available keys: ' + Object.keys(dateFnsTz).join(', '));
    }
  });

  it('should correctly convert UTC to MDT', () => {
    const utcDate = new Date('2025-01-20T18:00:00Z'); // 6 PM UTC
    const mdtDate = toZonedTime(utcDate, MDT_TIMEZONE);
    
    // 6 PM UTC = 12 PM MDT (UTC-6)
    expect(format(mdtDate, 'HH:mm')).toBe('12:00');
  });

  it('should correctly convert MDT to UTC', () => {
    const mdtDate = new Date('2025-01-20T12:00:00'); // 12 PM MDT
    const utcDate = fromZonedTime(mdtDate, MDT_TIMEZONE);
    
    // 12 PM MDT = 6 PM UTC (UTC-6)
    expect(format(utcDate, 'HH:mm')).toBe('18:00');
  });

  it('should handle scheduled pickup time in MDT', () => {
    const scheduledTime = '2025-01-20T14:00:00'; // 2 PM local (MDT)
    const parsed = parseISO(scheduledTime);
    const utc = fromZonedTime(parsed, MDT_TIMEZONE);
    
    // Should be 8 PM UTC (2 PM + 6 hours)
    expect(format(utc, 'HH:mm')).toBe('20:00');
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

