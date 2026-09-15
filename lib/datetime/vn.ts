import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { differenceInCalendarDays, format } from "date-fns";

const VN_TIMEZONE = "Asia/Ho_Chi_Minh";

/** Today's calendar date in Vietnam time, as "yyyy-MM-dd". */
export function todayInVietnam(now: Date = new Date()): string {
  return format(toZonedTime(now, VN_TIMEZONE), "yyyy-MM-dd");
}

/**
 * UTC instant range [start, end) covering one calendar day in Vietnam time —
 * for filtering `logged_at` (stored UTC) by a Vietnam-local date.
 */
export function vietnamDayRangeUtc(dateStr: string): { startUtc: Date; endUtc: Date } {
  const startUtc = fromZonedTime(`${dateStr}T00:00:00`, VN_TIMEZONE);
  const endUtc = fromZonedTime(`${dateStr}T23:59:59.999`, VN_TIMEZONE);
  return { startUtc, endUtc };
}

/** Calendar-day difference in Vietnam time between now and an ISO timestamp (UTC in the DB). */
export function daysSinceInVietnam(isoTimestamp: string, now: Date = new Date()): number {
  const zonedNow = toZonedTime(now, VN_TIMEZONE);
  const zonedThen = toZonedTime(new Date(isoTimestamp), VN_TIMEZONE);
  return differenceInCalendarDays(zonedNow, zonedThen);
}

export function isTodayInVietnam(isoTimestamp: string, now: Date = new Date()): boolean {
  return daysSinceInVietnam(isoTimestamp, now) === 0;
}

export function formatDateVN(isoTimestamp: string): string {
  return format(toZonedTime(new Date(isoTimestamp), VN_TIMEZONE), "dd/MM/yyyy");
}

export function formatTimeVN(isoTimestamp: string): string {
  return format(toZonedTime(new Date(isoTimestamp), VN_TIMEZONE), "HH:mm");
}

/** The Vietnam-local calendar date ("yyyy-MM-dd") an ISO (UTC) timestamp falls on. */
export function vietnamDateKey(isoTimestamp: string): string {
  return format(toZonedTime(new Date(isoTimestamp), VN_TIMEZONE), "yyyy-MM-dd");
}

/** The last `days` Vietnam-local calendar dates, oldest first, ending today. */
export function lastNDaysInVietnam(days: number, now: Date = new Date()): string[] {
  const today = toZonedTime(now, VN_TIMEZONE);
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(format(d, "yyyy-MM-dd"));
  }
  return dates;
}
