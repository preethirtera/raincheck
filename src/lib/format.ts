export function fmtWhen(iso: string | null): string {
  if (!iso) return 'no time yet'
  const d = new Date(iso)
  const day = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return `${day} · ${time}`
}

export function fmtHours(h: number): string {
  if (h >= 20) return `${Math.round(h / 24)}d+`
  return h % 1 === 0 ? `${h}h` : `${h}h`.replace('.5h', '½h').replace('0½', '½')
}

/** "in 22h" / "in 3d" / "now" */
export function fmtUntil(iso: string, now: Date = new Date()): string {
  const ms = new Date(iso).getTime() - now.getTime()
  if (ms <= 0) return 'now'
  const mins = Math.ceil(ms / 60_000)
  if (mins < 60) return `in ${mins}m`
  const hours = Math.ceil(mins / 60)
  if (hours < 48) return `in ${hours}h`
  return `in ${Math.ceil(hours / 24)}d`
}

export const SIZE_LABELS: Record<string, string> = {
  small: 'small ask',
  evening: 'an evening',
  fullday: 'a full day',
  multiday: 'multi-day',
}
