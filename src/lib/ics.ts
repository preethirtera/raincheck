import type { Ask } from '../types'

function icsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/[,;]/g, (m) => `\\${m}`).replace(/\n/g, '\\n')
}

/** Export committed plans (alone time included) as a calendar file. */
export function buildICS(asks: Ask[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//RainCheck//raincheck//EN',
    'CALSCALE:GREGORIAN',
  ]
  for (const ask of asks) {
    if (ask.status !== 'committed' || !ask.start) continue
    const start = new Date(ask.start)
    const end = new Date(start.getTime() + ask.durationHours * 3_600_000)
    const summary = ask.kind === 'alone' ? 'Alone time 💜' : ask.title + (ask.who ? ` w/ ${ask.who}` : '')
    lines.push(
      'BEGIN:VEVENT',
      `UID:raincheck-${ask.id}-${start.getTime()}@raincheck`,
      `DTSTAMP:${icsDate(new Date(ask.createdAt))}`,
      `DTSTART:${icsDate(start)}`,
      `DTEND:${icsDate(end)}`,
      `SUMMARY:${escapeText(summary)}`,
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export interface ImportedEvent {
  title: string
  start: Date
  durationHours: number
}

/** Minimal .ics reader: enough for invite files shared into the app. */
export function parseICS(text: string): ImportedEvent[] {
  // unfold wrapped lines (RFC 5545: continuation lines start with a space/tab)
  const unfolded = text.replace(/\r?\n[ \t]/g, '')
  const events: ImportedEvent[] = []
  const blocks = unfolded.split('BEGIN:VEVENT').slice(1)
  for (const block of blocks) {
    const body = block.split('END:VEVENT')[0]
    const get = (prop: string): string | null => {
      const m = body.match(new RegExp(`^${prop}[^:\\n]*:(.+)$`, 'mi'))
      return m ? m[1].trim() : null
    }
    const startRaw = get('DTSTART')
    if (!startRaw) continue
    const start = parseICSDate(startRaw)
    if (!start) continue
    const endRaw = get('DTEND')
    const end = endRaw ? parseICSDate(endRaw) : null
    const durationHours = end
      ? Math.max(0.5, (end.getTime() - start.getTime()) / 3_600_000)
      : 2
    const title = (get('SUMMARY') ?? 'Imported plan').replace(/\\([,;n])/g, (_m, c) => (c === 'n' ? ' ' : c))
    events.push({ title, start, durationHours })
  }
  return events
}

function parseICSDate(raw: string): Date | null {
  const m = raw.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/)
  if (!m) return null
  const [, y, mo, d, h = '9', mi = '0', s = '0', z] = m
  if (z) return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s))
  return new Date(+y, +mo - 1, +d, +h, +mi, +s)
}

export function downloadICS(asks: Ask[]): void {
  const blob = new Blob([buildICS(asks)], { type: 'text/calendar' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'raincheck.ics'
  a.click()
  URL.revokeObjectURL(a.href)
}
