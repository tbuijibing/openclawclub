import { Injectable } from '@nestjs/common';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import {
  isWithinInterval,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  eachDayOfInterval,
  isWeekend,
} from 'date-fns';

/** Standard business hours: 9:00 - 18:00 local time */
const BUSINESS_HOUR_START = 9;
const BUSINESS_HOUR_END = 18;

@Injectable()
export class TimezoneService {
  /**
   * Format a UTC Date/ISO string to a localized string in the user's timezone.
   * All database timestamps are stored in UTC; this converts for display.
   */
  formatDateTime(
    utcTime: Date | string,
    timezone: string,
    formatStr: string = 'yyyy-MM-dd HH:mm:ss',
  ): string {
    const date = typeof utcTime === 'string' ? new Date(utcTime) : utcTime;
    return formatInTimeZone(date, timezone, formatStr);
  }

  /**
   * Get the current time in a specific timezone.
   */
  nowInTimezone(timezone: string): Date {
    return toZonedTime(new Date(), timezone);
  }

  /**
   * Check if the current time falls within business hours (9:00-18:00)
   * in the given timezone, excluding weekends.
   */
  isBusinessHours(timezone: string, referenceTime?: Date): boolean {
    const now = referenceTime ?? new Date();
    const zonedNow = toZonedTime(now, timezone);

    if (isWeekend(zonedNow)) return false;

    const dayStart = setMilliseconds(
      setSeconds(setMinutes(setHours(zonedNow, BUSINESS_HOUR_START), 0), 0),
      0,
    );
    const dayEnd = setMilliseconds(
      setSeconds(setMinutes(setHours(zonedNow, BUSINESS_HOUR_END), 0), 0),
      0,
    );

    return isWithinInterval(zonedNow, { start: dayStart, end: dayEnd });
  }

  /**
   * Calculate the number of business hours between two UTC timestamps,
   * considering the user's timezone for business hour boundaries.
   * Useful for SLA response time calculations.
   */
  calculateBusinessHours(
    startUtc: Date | string,
    endUtc: Date | string,
    timezone: string,
  ): number {
    const start = typeof startUtc === 'string' ? new Date(startUtc) : startUtc;
    const end = typeof endUtc === 'string' ? new Date(endUtc) : endUtc;

    if (end <= start) return 0;

    const zonedStart = toZonedTime(start, timezone);
    const zonedEnd = toZonedTime(end, timezone);

    const days = eachDayOfInterval({ start: zonedStart, end: zonedEnd });
    let totalHours = 0;

    for (const day of days) {
      if (isWeekend(day)) continue;

      const businessStart = setMilliseconds(
        setSeconds(setMinutes(setHours(day, BUSINESS_HOUR_START), 0), 0),
        0,
      );
      const businessEnd = setMilliseconds(
        setSeconds(setMinutes(setHours(day, BUSINESS_HOUR_END), 0), 0),
        0,
      );

      const effectiveStart = zonedStart > businessStart ? zonedStart : businessStart;
      const effectiveEnd = zonedEnd < businessEnd ? zonedEnd : businessEnd;

      if (effectiveStart < effectiveEnd) {
        totalHours += (effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60);
      }
    }

    return Math.round(totalHours * 100) / 100;
  }

  /**
   * Ensure a Date is stored as UTC. Returns an ISO string in UTC.
   */
  toUtcIso(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString();
  }
}
