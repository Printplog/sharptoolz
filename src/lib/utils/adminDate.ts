type DateValue = Date | string | number;

const ADMIN_LOCALE = "en-US";
const ADMIN_TIME_ZONE = "UTC";

function toDate(value: DateValue): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatAdminDate(
  value: DateValue,
  options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  }
) {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(ADMIN_LOCALE, {
    ...options,
    timeZone: ADMIN_TIME_ZONE,
  }).format(date);
}

export function formatAdminTime(
  value: DateValue,
  options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
  }
) {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(ADMIN_LOCALE, {
    ...options,
    timeZone: ADMIN_TIME_ZONE,
  }).format(date);
}

export function formatAdminDateTime(
  value: DateValue,
  options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }
) {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(ADMIN_LOCALE, {
    ...options,
    timeZone: ADMIN_TIME_ZONE,
  }).format(date);
}

export function formatAdminRelativeTime(value: DateValue) {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  const formatter = new Intl.RelativeTimeFormat(ADMIN_LOCALE, {
    numeric: "auto",
  });

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  return formatter.format(diffDays, "day");
}
