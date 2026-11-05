import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import clsx from 'clsx'
import { db } from '../../db/db'
import type { Transaction, TransactionType } from '../../types'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { resolveIcon } from '../../lib/icons'
import { todayIso } from '../../lib/format'

export function TransactionModal({
  open,
  onClose,
  editing,
}: {
  open: boolean
  onClose: () => void
  editing: Transaction | null
}) {
  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [date, setDate] = useState(todayIso())
  const [note, setNote] = useState('')

  const categories = useLiveQuery(() => db.categories.where('type').equals(type).toArray(), [type])

  useEffect(() => {
    if (!open) return
    if (editing) {
      setType(editing.type)
      setAmount(String(editing.amount))
      setCategoryId(editing.categoryId)
      setDate(editing.date)
      setNote(editing.note)
    } else {
      setType('expense')
      setAmount('')
      setCategoryId(null)
      setDate(todayIso())
      setNote('')
    }
  }, [open, editing])

  useEffect(() => {
    if (categories && categories.length > 0 && !categories.some((c) => c.id === categoryId)) {
      setCategoryId(categories[0].id ?? null)
    }
  }, [categories])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const numericAmount = parseFloat(amount.replace(',', '.'))
    if (!numericAmount || numericAmount <= 0 || categoryId === null) return

    if (editing?.id) {
      await db.transactions.update(editing.id, { type, amount: numericAmount, categoryId, date, note })
    } else {
      await db.transactions.add({ type, amount: numericAmount, categoryId, date, note })
    }
    onClose()
  }

  async function handleDelete() {
    if (editing?.id) {
      await db.transactions.delete(editing.id)
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edytuj transakcję' : 'Nowa transakcja'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-900/5 p-1 dark:bg-white/5">
          {(['expense', 'income'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={clsx(
                'rounded-xl py-2 text-sm font-medium transition',
                type === t
                  ? 'bg-white shadow-sm dark:bg-slate-800'
                  : 'text-slate-500 dark:text-slate-400',
              )}
            >
              {t === 'expense' ? 'Wydatek' : 'Przychód'}
            </button>
          ))}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Kwota (PLN)</label>
          <input
            autoFocus
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-lg font-semibold outline-none focus:border-brand-400 dark:border-white/10 dark:bg-white/5"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Kategoria</label>
          <div className="grid grid-cols-4 gap-2">
            {categories?.map((c) => {
              const Icon = resolveIcon(c.icon)
              const active = categoryId === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id ?? null)}
                  className={clsx(
                    'flex flex-col items-center gap-1 rounded-2xl p-2 text-[11px] font-medium transition',
                    active ? 'bg-white shadow-sm dark:bg-slate-800' : 'text-slate-500 dark:text-slate-400',
                  )}
                >
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
                    style={{ background: c.color }}
                  >
                    <Icon size={16} />
                  </div>
                  <span className="truncate">{c.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-2xl border border-white/60 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-white/10 dark:bg-white/5"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Notatka</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Opcjonalnie"
              className="w-full rounded-2xl border border-white/60 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-white/10 dark:bg-white/5"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          {editing && (
            <Button type="button" variant="danger" onClick={handleDelete}>
              Usuń
            </Button>
          )}
          <Button type="submit" className="flex-1">
            Zapisz
          </Button>
        </div>
      </form>
    </Modal>
  )
}
