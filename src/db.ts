import Dexie, { type EntityTable } from 'dexie'
import type { Ask, Settings } from './types'
import { DEFAULT_SETTINGS } from './types'

const db = new Dexie('raincheck') as Dexie & {
  asks: EntityTable<Ask, 'id'>
  settings: EntityTable<Settings, 'id'>
}

db.version(1).stores({
  asks: '++id, status, start, decideBy, createdAt',
  settings: 'id',
})

db.version(2)
  .stores({
    asks: '++id, kind, status, start, decideBy, createdAt',
    settings: 'id',
  })
  .upgrade((tx) =>
    tx.table('asks').toCollection().modify((a) => {
      a.kind = a.kind ?? 'ask'
    }),
  )

export async function getSettings(): Promise<Settings> {
  const stored = await db.settings.get('app')
  return { ...DEFAULT_SETTINGS, ...stored }
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  const current = await getSettings()
  await db.settings.put({ ...current, ...patch })
}

export async function exportJSON(): Promise<string> {
  const [asks, settings] = await Promise.all([db.asks.toArray(), getSettings()])
  return JSON.stringify({ raincheck: 1, exportedAt: new Date().toISOString(), asks, settings }, null, 2)
}

export async function importJSON(text: string): Promise<number> {
  const data = JSON.parse(text)
  if (data?.raincheck !== 1 || !Array.isArray(data.asks)) {
    throw new Error('Not a RainCheck backup file')
  }
  await db.transaction('rw', db.asks, db.settings, async () => {
    await db.asks.clear()
    await db.asks.bulkAdd(data.asks.map(({ id: _id, ...ask }: Ask) => ask))
    if (data.settings) await db.settings.put({ ...DEFAULT_SETTINGS, ...data.settings })
  })
  return data.asks.length
}

export { db }
