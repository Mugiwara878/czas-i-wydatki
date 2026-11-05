import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import clsx from 'clsx'
import { ArrowLeft, Check, ChevronDown, Eraser, Palette, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { db } from '../db/db'
import { GlassCard } from '../components/ui/GlassCard'
import { Button } from '../components/ui/Button'
import { ColorPicker } from '../components/ui/ColorPicker'
import { DrawingCanvas, type DrawingCanvasHandle } from '../components/ideas/DrawingCanvas'
import { DEFAULT_TASK_COLOR } from '../lib/color'
import type { Idea } from '../types'

const colorPresets = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#64748b']
const inkColors = ['#1e293b', '#ef4444', '#2563eb', '#16a34a', '#f59e0b']
const brushSizes = [3, 6, 10]

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diffMs / 60000)
  if (minutes < 1) return 'przed chwilą'
  if (minutes < 60) return `${minutes} min temu`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} godz. temu`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days} dni temu`
  return new Date(iso).toLocaleDateString('pl-PL')
}

export function Ideas() {
  const ideas = useLiveQuery(() => db.ideas.orderBy('updatedAt').reverse().toArray(), [])

  const [mode, setMode] = useState<'list' | 'editor'>('list')
  const [editing, setEditing] = useState<Idea | null>(null)
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [color, setColor] = useState(DEFAULT_TASK_COLOR)
  const [inkColor, setInkColor] = useState(inkColors[0])
  const [brushSize, setBrushSize] = useState(brushSizes[1])
  const [erase, setErase] = useState(false)
  const [showInkPicker, setShowInkPicker] = useState(false)
  const [drawingOpen, setDrawingOpen] = useState(false)

  const canvasRef = useRef<DrawingCanvasHandle>(null)

  function openNew() {
    setEditing(null)
    setTitle('')
    setText('')
    setColor(DEFAULT_TASK_COLOR)
    setInkColor(inkColors[0])
    setBrushSize(brushSizes[1])
    setErase(false)
    setShowInkPicker(false)
    setDrawingOpen(false)
    setMode('editor')
  }

  function openEdit(idea: Idea) {
    setEditing(idea)
    setTitle(idea.title)
    setText(idea.text ?? '')
    setColor(idea.color)
    setInkColor(inkColors[0])
    setBrushSize(brushSizes[1])
    setErase(false)
    setShowInkPicker(false)
    setDrawingOpen(!!idea.drawing)
    setMode('editor')
  }

  function closeEditor() {
    setMode('list')
  }

  async function handleSave() {
    const drawing = canvasRef.current && !canvasRef.current.isEmpty() ? canvasRef.current.exportImage() : undefined
    const now = new Date().toISOString()
    const payload = {
      title: title.trim() || 'Bez tytułu',
      text: text.trim() || undefined,
      drawing,
      color,
      updatedAt: now,
    }
    if (editing?.id) {
      await db.ideas.update(editing.id, payload)
    } else {
      await db.ideas.add({ ...payload, createdAt: now })
    }
    closeEditor()
  }

  async function handleDelete() {
    if (editing?.id) await db.ideas.delete(editing.id)
    closeEditor()
  }

  if (mode === 'editor') {
    return (
      <div className="space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <button
            onClick={closeEditor}
            className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <ArrowLeft size={16} /> Wróć
          </button>
          <div className="flex gap-2">
            {editing && (
              <Button variant="danger" onClick={handleDelete}>
                <Trash2 size={16} /> Usuń
              </Button>
            )}
            <Button onClick={handleSave}>Zapisz</Button>
          </div>
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tytuł pomysłu"
          className="w-full bg-transparent text-2xl font-bold tracking-tight outline-none placeholder:text-slate-400"
        />

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Kolor karty</span>
          {colorPresets.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/60 dark:border-white/10"
              style={{ backgroundColor: c }}
            >
              {color === c && <Check size={12} className="text-white drop-shadow" />}
            </button>
          ))}
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Opisz pomysł..."
          rows={4}
          className="w-full resize-none rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-sm outline-none focus:border-brand-400 dark:border-white/10 dark:bg-white/5"
        />

        <GlassCard className="p-3">
          <button
            onClick={() => setDrawingOpen((o) => !o)}
            className="flex w-full items-center justify-between rounded-2xl px-1 py-1 text-left"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Pencil size={15} className="text-slate-500 dark:text-slate-400" />
              Rysunek
              {!drawingOpen && editing?.drawing && (
                <span className="text-xs font-normal text-slate-400">(zapisany)</span>
              )}
            </span>
            <ChevronDown
              size={18}
              className={clsx('text-slate-400 transition-transform', drawingOpen && 'rotate-180')}
            />
          </button>

          <div className={clsx('mt-3', !drawingOpen && 'hidden')}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {inkColors.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setInkColor(c)
                  setErase(false)
                  setShowInkPicker(false)
                }}
                className={clsx(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition',
                  !erase && inkColor === c ? 'border-brand-500' : 'border-white/60 dark:border-white/10',
                )}
                style={{ backgroundColor: c }}
              />
            ))}
            <button
              onClick={() => setShowInkPicker((s) => !s)}
              className={clsx(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition',
                showInkPicker ? 'border-brand-500' : 'border-white/60 dark:border-white/10',
              )}
              style={{ backgroundColor: !inkColors.includes(inkColor) ? inkColor : undefined }}
            >
              {inkColors.includes(inkColor) && <Palette size={13} className="text-slate-500 dark:text-slate-400" />}
            </button>

            <div className="mx-1 h-6 w-px bg-slate-900/10 dark:bg-white/10" />

            {brushSizes.map((s) => (
              <button
                key={s}
                onClick={() => setBrushSize(s)}
                className={clsx(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition',
                  brushSize === s ? 'border-brand-500 bg-white dark:bg-slate-800' : 'border-white/60 dark:border-white/10',
                )}
              >
                <span className="rounded-full bg-slate-700 dark:bg-slate-200" style={{ width: s, height: s }} />
              </button>
            ))}

            <button
              onClick={() => setErase((e) => !e)}
              className={clsx(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition',
                erase ? 'border-brand-500 bg-white dark:bg-slate-800' : 'border-white/60 dark:border-white/10',
              )}
              title="Gumka"
            >
              <Eraser size={14} />
            </button>

            <button
              onClick={() => canvasRef.current?.undo()}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-white/60 transition hover:bg-white/50 dark:border-white/10 dark:hover:bg-white/10"
              title="Cofnij"
            >
              <RotateCcw size={14} />
            </button>

            <button
              onClick={() => canvasRef.current?.clear()}
              className="ml-auto text-xs font-medium text-slate-500 hover:text-red-500 dark:text-slate-400"
            >
              Wyczyść
            </button>
          </div>

          {showInkPicker && (
            <div className="mb-3">
              <ColorPicker value={inkColor} onChange={setInkColor} />
            </div>
          )}

          <DrawingCanvas
            key={editing?.id ?? 'new'}
            ref={canvasRef}
            initialImage={editing?.drawing}
            color={inkColor}
            brushSize={brushSize}
            erase={erase}
          />
          <p className="mt-2 text-center text-xs text-slate-400">
            Rysuj palcem, myszką albo rysikiem (np. Apple Pencil na iPadzie).
          </p>
          </div>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Pomysły</h1>
        <Button onClick={openNew}>
          <Plus size={16} /> Nowy pomysł
        </Button>
      </div>

      {(!ideas || ideas.length === 0) && (
        <GlassCard className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Brak zapisanych pomysłów. Dodaj pierwszy — tekstem albo rysunkiem.
        </GlassCard>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {ideas?.map((idea) => (
          <button
            key={idea.id}
            onClick={() => openEdit(idea)}
            className="glass flex flex-col overflow-hidden rounded-3xl text-left transition hover:brightness-105"
          >
            <div
              className="aspect-video w-full"
              style={{
                background: idea.drawing
                  ? `url(${idea.drawing}) center/cover`
                  : `linear-gradient(135deg, ${idea.color}, color-mix(in srgb, ${idea.color} 55%, black))`,
              }}
            />
            <div className="p-3">
              <p className="truncate text-sm font-semibold">{idea.title}</p>
              {idea.text && (
                <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{idea.text}</p>
              )}
              <p className="mt-1.5 text-[10px] text-slate-400">{relativeTime(idea.updatedAt)}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
