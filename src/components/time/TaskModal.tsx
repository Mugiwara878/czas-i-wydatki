import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { Check, Palette } from 'lucide-react'
import { db } from '../../db/db'
import type { Task, TaskPriority } from '../../types'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { ColorPicker } from '../ui/ColorPicker'
import { DEFAULT_TASK_COLOR } from '../../lib/color'

const priorities: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Niski', color: 'bg-sky-400' },
  { value: 'medium', label: 'Średni', color: 'bg-amber-400' },
  { value: 'high', label: 'Wysoki', color: 'bg-red-400' },
]

const colorPresets = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#64748b']

export function TaskModal({
  open,
  onClose,
  editing,
  defaultDate,
}: {
  open: boolean
  onClose: () => void
  editing: Task | null
  defaultDate: string
}) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(defaultDate)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [note, setNote] = useState('')
  const [color, setColor] = useState(DEFAULT_TASK_COLOR)
  const [showCustomPicker, setShowCustomPicker] = useState(false)

  useEffect(() => {
    if (!open) return
    if (editing) {
      setTitle(editing.title)
      setDate(editing.date)
      setStartTime(editing.startTime ?? '')
      setEndTime(editing.endTime ?? '')
      setPriority(editing.priority)
      setNote(editing.note ?? '')
      setColor(editing.color ?? DEFAULT_TASK_COLOR)
      setShowCustomPicker(!colorPresets.includes(editing.color ?? DEFAULT_TASK_COLOR))
    } else {
      setTitle('')
      setDate(defaultDate)
      setStartTime('')
      setEndTime('')
      setPriority('medium')
      setNote('')
      setColor(DEFAULT_TASK_COLOR)
      setShowCustomPicker(false)
    }
  }, [open, editing, defaultDate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    const payload = {
      title: title.trim(),
      date,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      priority,
      note: note.trim() || undefined,
      color,
    }

    if (editing?.id) {
      await db.tasks.update(editing.id, payload)
    } else {
      await db.tasks.add({ ...payload, done: false })
    }
    onClose()
  }

  async function handleDelete() {
    if (editing?.id) {
      await db.tasks.delete(editing.id)
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edytuj zadanie' : 'Nowe zadanie'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Co trzeba zrobić?</label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="np. Spotkanie z zespołem"
            className="w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-sm font-medium outline-none focus:border-brand-400 dark:border-white/10 dark:bg-white/5"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-2xl border border-white/60 bg-white/70 px-2 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-white/10 dark:bg-white/5"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Start</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-2xl border border-white/60 bg-white/70 px-2 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-white/10 dark:bg-white/5"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Koniec</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-2xl border border-white/60 bg-white/70 px-2 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-white/10 dark:bg-white/5"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Priorytet</label>
          <div className="grid grid-cols-3 gap-2">
            {priorities.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPriority(p.value)}
                className={clsx(
                  'flex items-center justify-center gap-2 rounded-2xl py-2 text-sm font-medium transition',
                  priority === p.value
                    ? 'bg-white shadow-sm dark:bg-slate-800'
                    : 'text-slate-500 dark:text-slate-400',
                )}
              >
                <span className={clsx('h-2 w-2 rounded-full', p.color)} />
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Kolor</label>
          <div className="flex flex-wrap items-center gap-2">
            {colorPresets.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setColor(c)
                  setShowCustomPicker(false)
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/60 transition dark:border-white/10"
                style={{ backgroundColor: c }}
              >
                {!showCustomPicker && color === c && <Check size={14} className="text-white drop-shadow" />}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowCustomPicker((s) => !s)}
              className={clsx(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition',
                showCustomPicker ? 'border-brand-500' : 'border-white/60 dark:border-white/10',
              )}
              style={{ backgroundColor: showCustomPicker || !colorPresets.includes(color) ? color : undefined }}
            >
              {!showCustomPicker && colorPresets.includes(color) && <Palette size={14} className="text-slate-500 dark:text-slate-400" />}
            </button>
          </div>
          {showCustomPicker && (
            <div className="mt-3">
              <ColorPicker value={color} onChange={setColor} />
            </div>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Notatka</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Opcjonalnie"
            className="w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-white/10 dark:bg-white/5"
          />
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
