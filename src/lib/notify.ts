import { db, getSettings } from '../db'

export async function ensurePermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  return (await Notification.requestPermission()) === 'granted'
}

/** shift a due time out of quiet hours if it lands inside them */
export function respectQuietHours(due: Date, quietStart: number, quietEnd: number): Date {
  const h = due.getHours()
  const inQuiet =
    quietStart > quietEnd
      ? h >= quietStart || h < quietEnd // window crosses midnight
      : h >= quietStart && h < quietEnd
  if (!inQuiet) return due
  const shifted = new Date(due)
  if (quietStart > quietEnd && h >= quietStart) shifted.setDate(shifted.getDate() + 1)
  shifted.setHours(quietEnd, 0, 0, 0)
  return shifted
}

const fired = new Set<number>()

/** Poll deferred asks and nudge when their decide-by time arrives (app open).
    True background push arrives with the Phase 3 backend. */
export function startReminderLoop(onDue?: () => void): () => void {
  const tick = async () => {
    const settings = await getSettings()
    const now = new Date()
    const due = await db.asks.where('status').equals('deferred').toArray()
    for (const ask of due) {
      if (!ask.decideBy || ask.id === undefined || fired.has(ask.id)) continue
      const dueAt = respectQuietHours(new Date(ask.decideBy), settings.quietStartHour, settings.quietEndHour)
      if (dueAt.getTime() > now.getTime()) continue
      fired.add(ask.id)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Time to decide 🌧', {
          body: `${ask.title}${ask.who ? ` — ${ask.who}` : ''}. Your calendar awaits your verdict.`,
          tag: `raincheck-${ask.id}`,
        })
      }
      onDue?.()
    }
  }
  tick()
  const id = window.setInterval(tick, 30_000)
  return () => window.clearInterval(id)
}
