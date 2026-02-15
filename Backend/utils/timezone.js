/**
 * Get current date/time in the configured APP_TIMEZONE.
 * Railway auto-converts TZ=Asia/Kolkata to Asia/Karachi (30 min off),
 * so we use APP_TIMEZONE with Intl API to get the correct local time.
 */
function getLocalNow() {
  const tz = process.env.APP_TIMEZONE || process.env.TZ || 'UTC';
  const now = new Date();

  // Use Intl to get correct local time parts in the configured timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = {};
  for (const { type, value } of formatter.formatToParts(now)) {
    parts[type] = value;
  }

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
    weekday: new Date(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:00`).getDay(),
    timezone: tz,
  };
}

module.exports = { getLocalNow };
