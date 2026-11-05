import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Moon, Sun, Monitor, Download, Upload, AlertTriangle, Landmark, Undo2 } from 'lucide-react'
import clsx from 'clsx'
import { db } from '../db/db'
import { GlassCard } from '../components/ui/GlassCard'
import { Button } from '../components/ui/Button'
import { CategoryManager } from '../components/settings/CategoryManager'
import { ImportCsvModal } from '../components/settings/ImportCsvModal'
import { getStoredTheme, setTheme, type Theme } from '../lib/theme'
import { relativeTime } from '../lib/format'

const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Jasny', icon: Sun },
  { value: 'dark', label: 'Ciemny', icon: Moon },
  { value: 'system', label: 'Systemowy', icon: Monitor },
]

export function Settings() {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme())
  const [status, setStatus] = useState<string | null>(null)
  const [csvModalOpen, setCsvModalOpen] = useState(false)
  const [confirmingBatch, setConfirmingBatch] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const recentBatches = useLiveQuery(
    () => db.importBatches.orderBy('createdAt').reverse().limit(5).toArray(),
    [],
  )

  function handleCsvImported(count: number) {
    setStatus(`Zaimportowano ${count} transakcji z wyciągu bankowego.`)
    setTimeout(() => setStatus(null), 4000)
  }

  async function handleUndoImport(batchId: number | undefined) {
    if (batchId === undefined) return
    await db.transaction('rw', db.transactions, db.importBatches, async () => {
      await db.transactions.where('importBatchId').equals(batchId).delete()
      await db.importBatches.delete(batchId)
    })
    setConfirmingBatch(null)
    setStatus('Import cofnięty.')
    setTimeout(() => setStatus(null), 4000)
  }

  function handleThemeChange(value: Theme) {
    setTheme(value)
    setThemeState(value)
  }

  async function handleExport() {
    const data = {
      categories: await db.categories.toArray(),
      transactions: await db.transactions.toArray(),
      tasks: await db.tasks.toArray(),
      budgets: await db.budgets.toArray(),
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `czas-i-wydatki-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await db.transaction('rw', db.categories, db.transactions, db.tasks, db.budgets, async () => {
        if (data.categories) await db.categories.bulkPut(data.categories)
        if (data.transactions) await db.transactions.bulkPut(data.transactions)
        if (data.tasks) await db.tasks.bulkPut(data.tasks)
        if (data.budgets) await db.budgets.bulkPut(data.budgets)
      })
      setStatus('Dane zostały zaimportowane.')
    } catch {
      setStatus('Nie udało się zaimportować pliku. Sprawdź, czy to poprawny eksport z tej aplikacji.')
    } finally {
      e.target.value = ''
      setTimeout(() => setStatus(null), 4000)
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold tracking-tight">Ustawienia</h1>

      <GlassCard className="p-5">
        <h2 className="mb-4 text-base font-semibold">Wygląd</h2>
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-900/5 p-1 dark:bg-white/5">
          {themeOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => handleThemeChange(value)}
              className={clsx(
                'flex flex-col items-center gap-1 rounded-xl py-3 text-xs font-medium transition',
                theme === value ? 'bg-white shadow-sm dark:bg-slate-800' : 'text-slate-500 dark:text-slate-400',
              )}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
      </GlassCard>

      <CategoryManager />

      <GlassCard className="p-5">
        <h2 className="mb-1 text-base font-semibold">Wyciąg bankowy</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Wgraj plik CSV wyeksportowany z bankowości internetowej — transakcje zostaną rozpoznane i wstępnie
          skategoryzowane automatycznie, a Ty potwierdzisz, co zaimportować.
        </p>
        <Button variant="ghost" onClick={() => setCsvModalOpen(true)}>
          <Landmark size={16} /> Importuj wyciąg bankowy (CSV)
        </Button>

        {recentBatches && recentBatches.length > 0 && (
          <div className="mt-4 space-y-1 border-t border-slate-900/5 pt-4 dark:border-white/10">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Ostatnie importy
            </p>
            {recentBatches.map((batch) => (
              <div
                key={batch.id}
                className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-white/40 dark:hover:bg-white/5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{batch.source}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {batch.count} transakcji &middot; {relativeTime(batch.createdAt)}
                  </p>
                </div>
                {confirmingBatch === batch.id ? (
                  <div className="flex shrink-0 items-center gap-2 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Na pewno?</span>
                    <button
                      onClick={() => handleUndoImport(batch.id)}
                      className="font-semibold text-red-500 hover:underline"
                    >
                      Tak
                    </button>
                    <button
                      onClick={() => setConfirmingBatch(null)}
                      className="text-slate-400 hover:underline"
                    >
                      Nie
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmingBatch(batch.id ?? null)}
                    className="flex shrink-0 items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/10"
                  >
                    <Undo2 size={14} /> Cofnij
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-5">
        <h2 className="mb-1 text-base font-semibold">Kopia zapasowa danych</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Dane są przechowywane tylko lokalnie na tym urządzeniu. Użyj eksportu i importu, żeby przenieść je na inny
          telefon lub komputer.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" onClick={handleExport}>
            <Download size={16} /> Eksportuj dane (JSON)
          </Button>
          <Button variant="ghost" onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} /> Importuj dane
          </Button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImport} />
        </div>
        {status && (
          <p className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <AlertTriangle size={14} /> {status}
          </p>
        )}
      </GlassCard>

      <ImportCsvModal open={csvModalOpen} onClose={() => setCsvModalOpen(false)} onImported={handleCsvImported} />
    </div>
  )
}
