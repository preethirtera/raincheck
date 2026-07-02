import type { Ask } from '../types'

/** Monday 00:00 local time of the week containing `d` */
export function weekStart(d: Date = new Date()): Date {
  const out = new Date(d)
  out.setHours(0, 0, 0, 0)
  const day = out.getDay() // 0 = Sun
  out.setDate(out.getDate() - ((day + 6) % 7))
  return out
}

export function weekEnd(d: Date = new Date()): Date {
  const out = weekStart(d)
  out.setDate(out.getDate() + 7)
  return out
}

export function isThisWeek(iso: string | null, now: Date = new Date()): boolean {
  if (!iso) return false
  const t = new Date(iso).getTime()
  return t >= weekStart(now).getTime() && t < weekEnd(now).getTime()
}

/** hours already committed this week */
export function spentHours(asks: Ask[], now: Date = new Date()): number {
  return asks
    .filter((a) => a.status === 'committed' && isThisWeek(a.start, now))
    .reduce((sum, a) => sum + a.durationHours, 0)
}

export function percentSpent(asks: Ask[], budgetHours: number, now: Date = new Date()): number {
  if (budgetHours <= 0) return 0
  return Math.round((spentHours(asks, now) / budgetHours) * 100)
}

/** find an existing commitment that overlaps the given ask, if any */
export function findConflict(ask: Ask, asks: Ask[]): Ask | null {
  if (!ask.start) return null
  const start = new Date(ask.start).getTime()
  const end = start + ask.durationHours * 3_600_000
  for (const other of asks) {
    if (other.id === ask.id || other.status !== 'committed' || !other.start) continue
    const oStart = new Date(other.start).getTime()
    const oEnd = oStart + other.durationHours * 3_600_000
    if (start < oEnd && oStart < end) return other
  }
  return null
}
