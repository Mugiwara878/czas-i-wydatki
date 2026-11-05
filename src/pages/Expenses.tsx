import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { addMonths, endOfMonth, format, startOfMonth } from 'date-fns'
import { pl } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { db } from '../db/db'
import { GlassCard } from '../components/ui/GlassCard'
import { Button } from '../components/ui/Button'
import { IconChip } from '../components/ui/IconChip'
import { resolveIcon } from '../lib/icons'
import { formatCurrency, formatDateLabel } from '../lib/format'
import { TransactionModal } from '../components/expenses/TransactionModal'
import type { Transaction } from '../types'

export function Expenses() {
  const [cursor, setCursor] = useState(new Date())
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)

  const monthStart = useMemo(() => format(startOfMonth(cursor), 'yyyy-MM-dd'), [cursor])
  const monthEnd = useMemo(() => format(endOfMonth(cursor), 'yyyy-MM-dd'), [cursor])

  const transactions = useLiveQuery(
    () =>
      db.transactions
        .where('date')
        .between(monthStart, monthEnd, true, true)
        .reverse()
        .sortBy('date'),
    [monthStart, monthEnd],
  )
  const categories = useLiveQuery(() => db.categories.toArray(), [])
  const categoryMap = new Map(categories?.map((c) => [c.id, c]))

  const grouped = useMemo(() => {
    if (!transactions) return []
    const byDate = new Map<string, Transaction[]>()
    for (const t of transactions) {
      const list = byDate.get(t.date) ?? []
      list.push(t)
      byDate.set(t.date, list)
    }
    return [...byDate.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1))
  }, [transactions])

  function openNew() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(t: Transaction) {
    setEditing(t)
    setModalOpen(true)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Wydatki</h1>
        <Button onClick={openNew}>
          <Plus size={16} /> Dodaj
        </Button>
      </div>

      <GlassCard className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setCursor(addMonths(cursor, -1))}
          className="rounded-full p-1.5 hover:bg-white/50 dark:hover:bg-white/10"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-semibold capitalize">{format(cursor, 'LLLL yyyy', { locale: pl })}</span>
        <button
          onClick={() => setCursor(addMonths(cursor, 1))}
          className="rounded-full p-1.5 hover:bg-white/50 dark:hover:bg-white/10"
        >
          <ChevronRight size={18} />
        </button>
      </GlassCard>

      {grouped.length === 0 && (
        <GlassCard className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Brak transakcji w tym miesiącu.
        </GlassCard>
      )}

      <div className="space-y-4">
        {grouped.map(([date, items]) => (
          <div key={date}>
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {formatDateLabel(date)}
            </p>
            <GlassCard className="divide-y divide-slate-900/5 dark:divide-white/5">
              {items.map((t) => {
                const category = categoryMap.get(t.categoryId)
                if (!category) return null
                const Icon = resolveIcon(category.icon)
                return (
                  <button
                    key={t.id}
                    onClick={() => openEdit(t)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left first:rounded-t-3xl last:rounded-b-3xl hover:bg-white/40 dark:hover:bg-white/5"
                  >
                    <IconChip icon={Icon} color={category.color} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{category.name}</p>
                      {t.note && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{t.note}</p>}
                    </div>
                    <span
                      className={
                        t.type === 'income'
                          ? 'text-sm font-semibold text-emerald-600 dark:text-emerald-400'
                          : 'text-sm font-semibold'
                      }
                    >
                      {t.type === 'income' ? '+' : '-'}
                      {formatCurrency(t.amount)}
                    </span>
                  </button>
                )
              })}
            </GlassCard>
          </div>
        ))}
      </div>

      <TransactionModal open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} />
    </div>
  )
}
