import { describe, it, expect } from 'vitest';
import { formatDateTimeIST, formatCalendarDateIST } from '../src/domain/dates';

describe('Date Formatting', () => {
  it('formats numeric string timestamps correctly in Asia/Kolkata', () => {
    // 05 Oct 2026, 20:08:00 IST is 1791211080000 ms
    const timestamp = '1791211080000';
    const formatted = formatDateTimeIST(timestamp);
    expect(formatted).toMatch(/05\sOct\s2026/);
    expect(formatted).toMatch(/8:08/);
    expect(formatted).toMatch(/pm/i);
  });

  it('treats 10-digit epoch timestamps as seconds', () => {
    const formatted = formatDateTimeIST('1791211080');
    expect(formatted).toMatch(/05\sOct\s2026/);
    expect(formatted).toMatch(/8:08/);
  });

  it('returns N/A for empty values and Invalid Date for garbage', () => {
    expect(formatDateTimeIST('')).toBe('N/A');
    expect(formatDateTimeIST(null)).toBe('N/A');
    expect(formatDateTimeIST('not-a-date')).toBe('Invalid Date');
  });

  it('formats the request calendar date without timezone drift', () => {
    expect(formatCalendarDateIST('2026-10-05')).toMatch(/05\sOct\s2026/);
    expect(formatCalendarDateIST('')).toBe('N/A');
  });
});
