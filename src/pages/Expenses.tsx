import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { addMonths, endOfMonth, format, startOfMonth } from 'date-fns'
import { pl } from 'date-fns/locale'
import { CheckSquare, ChevronLeft, ChevronRight, Plus, Square, Trash2, X } from 'lucide-react'
import clsx from 'clsx'
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
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [confirmingDelete, setConfirmingDelete] = useState(false)

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
    if (selectMode) {
      toggleSelected(t.id)
      return
    }
    setEditing(t)
    setModalOpen(true)
  }

  function toggleSelected(id: number | undefined) {
    if (id === undefined) return
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectMode() {
    setSelectMode((s) => !s)
    setSelectedIds(new Set())
    setConfirmingDelete(false)
  }

  function selectAll() {
    setSelectedIds(new Set((transactions ?? []).map((t) => t.id!).filter((id) => id !== undefined)))
  }

  async function handleDeleteSelected() {
    if (selectedIds.size === 0) return
    await db.transactions.bulkDelete([...selectedIds])
    setSelectedIds(new Set())
    setSelectMode(false)
    setConfirmingDelete(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Wydatki</h1>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={toggleSelectMode}>
            {selectMode ? <X size={16} /> : <CheckSquare size={16} />}
            {selectMode ? 'Anuluj' : 'Zaznacz'}
          </Button>
          {!selectMode && (
            <Button onClick={openNew}>
              <Plus size={16} /> Dodaj
            </Button>
          )}
        </div>
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

      {selectMode && (
        <GlassCard className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
          <button
            onClick={selectAll}
            className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            Zaznacz wszystkie ({transactions?.length ?? 0})
          </button>
          {confirmingDelete ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 dark:text-slate-400">Na pewno?</span>
              <Button variant="danger" onClick={handleDeleteSelected}>
                Tak, usuń ({selectedIds.size})
              </Button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="text-slate-400 hover:underline"
              >
                Nie
              </button>
            </div>
          ) : (
            <Button
              variant="danger"
              disabled={selectedIds.size === 0}
              onClick={() => setConfirmingDelete(true)}
            >
              <Trash2 size={16} /> Usuń zaznaczone ({selectedIds.size})
            </Button>
          )}
        </GlassCard>
      )}

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
                const selected = t.id !== undefined && selectedIds.has(t.id)
                return (
                  <button
                    key={t.id}
                    onClick={() => openEdit(t)}
                    className={clsx(
                      'flex w-full items-center gap-3 px-4 py-3 text-left first:rounded-t-3xl last:rounded-b-3xl hover:bg-white/40 dark:hover:bg-white/5',
                      selected && 'bg-brand-500/10',
                    )}
                  >
                    {selectMode &&
                      (selected ? (
                        <CheckSquare size={20} className="shrink-0 text-brand-500" />
                      ) : (
                        <Square size={20} className="shrink-0 text-slate-400" />
                      ))}
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
