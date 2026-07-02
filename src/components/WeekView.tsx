import { useState } from 'react'
import { db } from '../db'
import { weekStart, isThisWeek } from '../lib/budget'
import { downloadICS } from '../lib/ics'
import { fmtHours } from '../lib/format'
import type { Ask } from '../types'

const TRACK_START = 8 // 8:00
const TRACK_HOURS = 16 // through midnight

interface Props {
  asks: Ask[]
  onOpen: (id: number) => void
  /** compact = read-only glance for the inbox tab */
  compact?: boolean
}

export function WeekView({ asks, onOpen, compact }: Props) {
  const [adding, setAdding] = useState(false)
  const [aloneDay, setAloneDay] = useState(() => new Date().toISOString().slice(0, 10))
  const [aloneHour, setAloneHour] = useState(19)
  const [aloneLen, setAloneLen] = useState(2)

  const start = weekStart()
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return d
  })
  const committed = asks.filter((a) => a.status === 'committed' && isThisWeek(a.start))
  const today = new Date().toDateString()

  async function addAlone() {
    const startAt = new Date(`${aloneDay}T00:00`)
    startAt.setHours(aloneHour, 0, 0, 0)
    const now = new Date().toISOString()
    await db.asks.add({
      kind: 'alone',
      rawText: 'alone time',
      title: 'Alone time',
      who: null,
      start: startAt.toISOString(),
      durationHours: aloneLen,
      size: 'small',
      status: 'committed',
      createdAt: now,
      decideBy: null,
      yesLockedUntil: null,
      decidedAt: now,
    })
    setAdding(false)
  }

  return (
    <section className="week" aria-label="This week">
      <div className="week-head">
        <h2 className="list-title">This week</h2>
        {!compact && (
          <button className="btn-mini" type="button" onClick={() => downloadICS(committed)}>
            ⤓ add to calendar
          </button>
        )}
      </div>

      {days.map((day) => {
        const dayAsks = committed
          .filter((a) => a.start && new Date(a.start).toDateString() === day.toDateString())
          .sort((x, y) => x.start!.localeCompare(y.start!))
        const hours = dayAsks.reduce((s, a) => s + a.durationHours, 0)
        const heavy = dayAsks.length >= 2 || hours >= 5
        return (
          <div key={day.toISOString()} className={`day ${day.toDateString() === today ? 'day-today' : ''}`}>
            <span className="day-label">
              {day.toLocaleDateString(undefined, { weekday: 'short' })}
              <span className="day-num">{day.getDate()}</span>
              {heavy && <span className="day-heavy" title="Heavy day">●</span>}
            </span>
            <div className="day-track">
              {dayAsks.map((a) => {
                const h = new Date(a.start!).getHours() + new Date(a.start!).getMinutes() / 60
                const left = Math.max(0, ((h - TRACK_START) / TRACK_HOURS) * 100)
                const width = Math.min(100 - left, (a.durationHours / TRACK_HOURS) * 100)
                return (
                  <button
                    key={a.id}
                    type="button"
                    className={`block ${a.kind === 'alone' ? 'block-alone' : ''}`}
                    style={{ left: `${left}%`, width: `${Math.max(width, 6)}%` }}
                    title={`${a.title} · ${fmtHours(a.durationHours)}`}
                    onClick={() => onOpen(a.id!)}
                  >
                    {a.kind === 'alone' ? '💜' : a.title}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {compact ? null : !adding ? (
        <button className="btn-mini btn-alone" type="button" onClick={() => setAdding(true)}>
          + protect alone time
        </button>
      ) : (
        <div className="alone-form">
          <input type="date" value={aloneDay} onChange={(e) => setAloneDay(e.target.value)} />
          <select value={aloneHour} onChange={(e) => setAloneHour(Number(e.target.value))}>
            {Array.from({ length: 16 }, (_, i) => i + 8).map((h) => (
              <option key={h} value={h}>
                {h % 12 === 0 ? 12 : h % 12}
                {h < 12 ? 'am' : 'pm'}
              </option>
            ))}
          </select>
          <select value={aloneLen} onChange={(e) => setAloneLen(Number(e.target.value))}>
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n}h
              </option>
            ))}
          </select>
          <button className="btn-mini" type="button" onClick={addAlone}>
            protect it
          </button>
          <button className="btn-mini btn-mini-quiet" type="button" onClick={() => setAdding(false)}>
            cancel
          </button>
        </div>
      )}
      {!compact && (
        <p className="week-note">Alone time counts like any plan. If someone asks, you already have plans.</p>
      )}
    </section>
  )
}
