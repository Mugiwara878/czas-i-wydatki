import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import clsx from 'clsx'
import { Plus, Trash2 } from 'lucide-react'
import { db } from '../../db/db'
import type { TransactionType } from '../../types'
import { GlassCard } from '../ui/GlassCard'
import { resolveIcon } from '../../lib/icons'

const palette = ['#f97066', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#64748b', '#22c55e', '#0ea5e9']

export function CategoryManager() {
  const [type, setType] = useState<TransactionType>('expense')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const categories = useLiveQuery(() => db.categories.where('type').equals(type).toArray(), [type])

  async function addCategory() {
    const trimmed = name.trim()
    if (!trimmed) return
    const color = palette[Math.floor(Math.random() * palette.length)]
    await db.categories.add({ name: trimmed, type, color, icon: 'more-horizontal' })
    setName('')
  }

  async function removeCategory(id: number | undefined) {
    if (id === undefined) return
    const inUse = await db.transactions.where('categoryId').equals(id).count()
    if (inUse > 0) {
      setError('Nie można usunąć kategorii, która ma przypisane transakcje.')
      setTimeout(() => setError(null), 4000)
      return
    }
    await db.categories.delete(id)
  }

  return (
    <GlassCard className="p-5">
      <h2 className="mb-4 text-base font-semibold">Kategorie</h2>
      <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-900/5 p-1 dark:bg-white/5">
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={clsx(
              'rounded-xl py-2 text-sm font-medium transition',
              type === t ? 'bg-white shadow-sm dark:bg-slate-800' : 'text-slate-500 dark:text-slate-400',
            )}
          >
            {t === 'expense' ? 'Wydatki' : 'Przychody'}
          </button>
        ))}
      </div>

      <div className="mb-4 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCategory()}
          placeholder="Nazwa nowej kategorii"
          className="flex-1 rounded-2xl border border-white/60 bg-white/70 px-4 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-white/10 dark:bg-white/5"
        />
        <button
          onClick={addCategory}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-white"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="space-y-1">
        {categories?.map((c) => {
          const Icon = resolveIcon(c.icon)
          return (
            <div key={c.id} className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-white/40 dark:hover:bg-white/5">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ background: c.color }}
              >
                <Icon size={14} />
              </div>
              <span className="flex-1 text-sm font-medium">{c.name}</span>
              <button
                onClick={() => removeCategory(c.id)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )
        })}
      </div>
      {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
    </GlassCard>
  )
}
