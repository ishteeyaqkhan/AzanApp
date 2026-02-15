/**
 * Get current date/time in the configured timezone.
 *
 * Railway auto-converts Asia/Kolkata → Asia/Karachi (30 min off).
 * So we use UTC_OFFSET_MINUTES (e.g. 330 for IST = UTC+5:30).
 * This is a plain number that Railway cannot auto-convert.
 */
function getLocalNow() {
  // Default 330 = IST (UTC+5:30). Override via UTC_OFFSET_MINUTES env var.
  const offsetMinutes = parseInt(process.env.UTC_OFFSET_MINUTES || '330', 10);
  const now = new Date();

  // Apply offset: UTC time + offset = local time
  const localMs = now.getTime() + (offsetMinutes * 60 * 1000);
  const local = new Date(localMs);

  // Extract parts from UTC methods (since we already shifted the time)
  const year = local.getUTCFullYear();
  const month = String(local.getUTCMonth() + 1).padStart(2, '0');
  const day = String(local.getUTCDate()).padStart(2, '0');
  const hour = String(local.getUTCHours()).padStart(2, '0');
  const minute = String(local.getUTCMinutes()).padStart(2, '0');
  const weekday = local.getUTCDay(); // 0=Sunday

  return {
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}`,
    weekday,
    offsetMinutes,
    offsetDisplay: `UTC+${Math.floor(offsetMinutes / 60)}:${String(offsetMinutes % 60).padStart(2, '0')}`,
  };
}

module.exports = { getLocalNow };
