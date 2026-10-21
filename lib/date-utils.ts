/**
 * Parses a date-time string safely.
 * If the string does not have an explicit timezone indicator (e.g. "2026-10-21T11:00"),
 * it interprets it in the business local timezone (+06:00 / Asia/Dhaka) rather than
 * letting server-side Node.js default to UTC, which would shift the time by +6 hours when viewed.
 */
export function parseScheduledAtDate(raw: string | null | undefined): Date | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed) return null

  // Check if string contains timezone indicators: 'Z' or '+HH:mm' or '-HH:mm'
  const hasTimezone = /Z|[+-]\d{2}(?::?\d{2})?$/i.test(trimmed)
  const normalized = hasTimezone ? trimmed : `${trimmed.replace(' ', 'T')}+06:00`
  const parsed = new Date(normalized)

  return Number.isNaN(parsed.getTime()) ? null : parsed
}
