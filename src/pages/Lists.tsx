import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { addDays, format, isToday } from 'date-fns'
import { pl } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Check } from 'lucide-react'
import clsx from 'clsx'
import { db } from '../db/db'
import { GlassCard } from '../components/ui/GlassCard'
import { Button } from '../components/ui/Button'
import { TaskModal } from '../components/time/TaskModal'
import { DEFAULT_TASK_COLOR } from '../lib/color'
import type { Task } from '../types'

export function Lists() {
  const [cursor, setCursor] = useState(new Date())
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)

  const dateIso = useMemo(() => format(cursor, 'yyyy-MM-dd'), [cursor])

  const tasks = useLiveQuery(
    () => db.tasks.where('date').equals(dateIso).sortBy('startTime'),
    [dateIso],
  )

  function openNew() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(t: Task) {
    setEditing(t)
    setModalOpen(true)
  }

  async function toggleTask(e: React.MouseEvent, id: number | undefined, done: boolean) {
    e.stopPropagation()
    if (id === undefined) return
    await db.tasks.update(id, { done: !done })
  }

  const done = tasks?.filter((t) => t.done).length ?? 0
  const total = tasks?.length ?? 0

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Listy</h1>
        <Button onClick={openNew}>
          <Plus size={16} /> Dodaj
        </Button>
      </div>

      <GlassCard className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setCursor(addDays(cursor, -1))}
          className="rounded-full p-1.5 hover:bg-white/50 dark:hover:bg-white/10"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <span className="text-sm font-semibold capitalize">
            {isToday(cursor) ? 'Dziś' : format(cursor, 'EEEE, d LLLL', { locale: pl })}
          </span>
          {total > 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {done}/{total} ukończone
            </p>
          )}
        </div>
        <button
          onClick={() => setCursor(addDays(cursor, 1))}
          className="rounded-full p-1.5 hover:bg-white/50 dark:hover:bg-white/10"
        >
          <ChevronRight size={18} />
        </button>
      </GlassCard>

      {(!tasks || tasks.length === 0) && (
        <GlassCard className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Brak zadań na ten dzień.
        </GlassCard>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tasks?.map((task) => {
          const color = task.color ?? DEFAULT_TASK_COLOR
          return (
            <button
              key={task.id}
              onClick={() => openEdit(task)}
              className={clsx(
                'group relative flex aspect-square flex-col justify-between overflow-hidden rounded-3xl p-3 text-left text-white shadow-lg transition hover:brightness-105 active:scale-[0.98]',
                task.done && 'opacity-60',
              )}
              style={{
                background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 55%, black))`,
              }}
            >
              <div className="flex items-start justify-between">
                <button
                  onClick={(e) => toggleTask(e, task.id, task.done)}
                  className={clsx(
                    'flex h-6 w-6 items-center justify-center rounded-full border-2 border-white/80 transition',
                    task.done && 'border-white bg-white',
                  )}
                >
                  {task.done && <Check size={14} className="text-slate-900" />}
                </button>
              </div>
              <div>
                <p className={clsx('line-clamp-3 text-sm font-semibold', task.done && 'line-through')}>
                  {task.title}
                </p>
                {(task.startTime || task.endTime) && (
                  <p className="mt-1 text-xs text-white/80">
                    {task.startTime}
                    {task.endTime ? ` – ${task.endTime}` : ''}
                  </p>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <TaskModal open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} defaultDate={dateIso} />
    </div>
  )
}
