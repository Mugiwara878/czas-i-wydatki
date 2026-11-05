import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { pl } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, CheckCircle2, Circle } from 'lucide-react'
import clsx from 'clsx'
import { db } from '../db/db'
import { GlassCard } from '../components/ui/GlassCard'
import { Button } from '../components/ui/Button'
import { TaskModal } from '../components/time/TaskModal'
import { IconChip } from '../components/ui/IconChip'
import { resolveIcon } from '../lib/icons'
import { formatCurrency } from '../lib/format'
import type { Task } from '../types'

const weekdays = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd']

export function Calendar() {
  const [cursor, setCursor] = useState(new Date())
  const [selected, setSelected] = useState(new Date())
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)

  const monthStart = startOfMonth(cursor)
  const monthEnd = endOfMonth(cursor)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = useMemo(() => eachDayOfInterval({ start: gridStart, end: gridEnd }), [gridStart, gridEnd])

  const gridStartIso = format(gridStart, 'yyyy-MM-dd')
  const gridEndIso = format(gridEnd, 'yyyy-MM-dd')
  const selectedIso = format(selected, 'yyyy-MM-dd')

  const monthTasks = useLiveQuery(
    () => db.tasks.where('date').between(gridStartIso, gridEndIso, true, true).toArray(),
    [gridStartIso, gridEndIso],
  )
  const monthTransactions = useLiveQuery(
    () => db.transactions.where('date').between(gridStartIso, gridEndIso, true, true).toArray(),
    [gridStartIso, gridEndIso],
  )
  const categories = useLiveQuery(() => db.categories.toArray(), [])
  const categoryMap = new Map(categories?.map((c) => [c.id, c]))

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const t of monthTasks ?? []) {
      const list = map.get(t.date) ?? []
      list.push(t)
      map.set(t.date, list)
    }
    return map
  }, [monthTasks])

  const expenseByDay = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of monthTransactions ?? []) {
      if (t.type !== 'expense') continue
      map.set(t.date, (map.get(t.date) ?? 0) + t.amount)
    }
    return map
  }, [monthTransactions])

  const selectedTasks = tasksByDay.get(selectedIso) ?? []
  const selectedTransactions = (monthTransactions ?? []).filter((t) => t.date === selectedIso)

  function openNew() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(t: Task) {
    setEditing(t)
    setModalOpen(true)
  }

  async function toggleTask(id: number | undefined, done: boolean) {
    if (id === undefined) return
    await db.tasks.update(id, { done: !done })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Kalendarz</h1>
        <Button onClick={openNew}>
          <Plus size={16} /> Dodaj
        </Button>
      </div>

      <GlassCard className="p-4">
        <div className="mb-4 flex items-center justify-between">
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
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-500 dark:text-slate-400">
          {weekdays.map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const iso = format(day, 'yyyy-MM-dd')
            const inMonth = isSameMonth(day, cursor)
            const hasTasks = tasksByDay.has(iso)
            const hasExpense = expenseByDay.has(iso)
            const isSelected = isSameDay(day, selected)

            return (
              <button
                key={iso}
                onClick={() => setSelected(day)}
                className={clsx(
                  'flex aspect-square flex-col items-center justify-center gap-0.5 rounded-2xl text-sm transition',
                  isSelected
                    ? 'bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-md shadow-brand-500/25'
                    : isToday(day)
                      ? 'bg-white/60 font-semibold dark:bg-white/10'
                      : 'hover:bg-white/40 dark:hover:bg-white/5',
                  !inMonth && !isSelected && 'text-slate-400 dark:text-slate-600',
                )}
              >
                <span>{format(day, 'd')}</span>
                <span className="flex gap-0.5">
                  {hasTasks && (
                    <span
                      className={clsx('h-1 w-1 rounded-full', isSelected ? 'bg-white' : 'bg-brand-500')}
                    />
                  )}
                  {hasExpense && (
                    <span className={clsx('h-1 w-1 rounded-full', isSelected ? 'bg-white' : 'bg-red-400')} />
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </GlassCard>

      <div>
        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {isToday(selected) ? 'Dziś' : format(selected, 'EEEE, d LLLL', { locale: pl })}
        </p>

        {selectedTransactions.length > 0 && (
          <GlassCard className="mb-3 divide-y divide-slate-900/5 dark:divide-white/5">
            {selectedTransactions.map((t) => {
              const category = categoryMap.get(t.categoryId)
              if (!category) return null
              const Icon = resolveIcon(category.icon)
              return (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3 first:rounded-t-3xl last:rounded-b-3xl">
                  <IconChip icon={Icon} color={category.color} size="sm" />
                  <span className="flex-1 text-sm font-medium">{category.name}</span>
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
                </div>
              )
            })}
          </GlassCard>
        )}

        {selectedTasks.length === 0 && selectedTransactions.length === 0 && (
          <GlassCard className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Brak zadań i transakcji tego dnia.
          </GlassCard>
        )}

        {selectedTasks.length > 0 && (
          <GlassCard className="divide-y divide-slate-900/5 dark:divide-white/5">
            {selectedTasks
              .slice()
              .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''))
              .map((task) => (
                <div key={task.id} className="flex items-center gap-3 px-4 py-3 first:rounded-t-3xl last:rounded-b-3xl">
                  <button onClick={() => toggleTask(task.id, task.done)} className="shrink-0">
                    {task.done ? (
                      <CheckCircle2 className="text-emerald-500" size={22} />
                    ) : (
                      <Circle className="text-slate-400" size={22} />
                    )}
                  </button>
                  <button onClick={() => openEdit(task)} className="min-w-0 flex-1 text-left">
                    <p className={clsx('truncate text-sm font-medium', task.done && 'text-slate-400 line-through')}>
                      {task.title}
                    </p>
                    {(task.startTime || task.endTime) && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {task.startTime}
                        {task.endTime ? ` – ${task.endTime}` : ''}
                      </p>
                    )}
                  </button>
                </div>
              ))}
          </GlassCard>
        )}
      </div>

      <TaskModal open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} defaultDate={selectedIso} />
    </div>
  )
}
