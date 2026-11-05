import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import clsx from 'clsx'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { db } from '../../db/db'
import type { TransactionType } from '../../types'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { decodeFile, detectDelimiter, guessCategoryName, parseAmount, parseCsv, parseDate } from '../../lib/csv'
import { formatCurrency } from '../../lib/format'

interface DraftRow {
  include: boolean
  date: string
  type: TransactionType
  amount: number
  description: string
  categoryId: number
  duplicate: boolean
}

function guessColumn(headers: string[], keywords: string[]): string {
  const lower = headers.map((h) => h.toLowerCase())
  for (const k of keywords) {
    const idx = lower.findIndex((h) => h.includes(k))
    if (idx !== -1) return headers[idx]
  }
  return headers[0] ?? ''
}

export function ImportCsvModal({
  open,
  onClose,
  onImported,
}: {
  open: boolean
  onClose: () => void
  onImported: (count: number) => void
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [file, setFile] = useState<File | null>(null)
  const [encoding, setEncoding] = useState<'utf-8' | 'windows-1250'>('utf-8')
  const [headers, setHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<string[][]>([])
  const [dateCol, setDateCol] = useState('')
  const [amountCol, setAmountCol] = useState('')
  const [descCol, setDescCol] = useState('')
  const [draftRows, setDraftRows] = useState<DraftRow[]>([])
  const [error, setError] = useState<string | null>(null)

  const categories = useLiveQuery(() => db.categories.toArray(), [])
  const existingTransactions = useLiveQuery(() => db.transactions.toArray(), [])

  function reset() {
    setStep(1)
    setFile(null)
    setEncoding('utf-8')
    setHeaders([])
    setRawRows([])
    setDraftRows([])
    setError(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleParseFile() {
    if (!file) return
    setError(null)
    try {
      const text = await decodeFile(file, encoding)
      const delimiter = detectDelimiter(text.split(/\r\n|\r|\n/)[0] ?? '')
      const { headers: h, rows } = parseCsv(text, delimiter)
      if (h.length === 0 || rows.length === 0) {
        setError('Nie udało się odczytać żadnych wierszy z pliku.')
        return
      }
      setHeaders(h)
      setRawRows(rows)
      setDateCol(guessColumn(h, ['data księgowania', 'data operacji', 'data transakcji', 'data']))
      setAmountCol(guessColumn(h, ['kwota transakcji', 'kwota operacji', 'kwota', 'amount']))
      setDescCol(guessColumn(h, ['opis operacji', 'tytuł', 'nazwa kontrahenta', 'opis', 'szczegóły', 'description']))
      setStep(2)
    } catch {
      setError('Nie udało się odczytać pliku. Spróbuj zmienić kodowanie.')
    }
  }

  function buildDraftRows() {
    if (!categories) return
    const dateIdx = headers.indexOf(dateCol)
    const amountIdx = headers.indexOf(amountCol)
    const descIdx = headers.indexOf(descCol)

    const expenseCats = categories.filter((c) => c.type === 'expense')
    const incomeCats = categories.filter((c) => c.type === 'income')

    const existingKeys = new Set((existingTransactions ?? []).map((t) => `${t.date}|${t.amount}|${t.note}`))

    const drafts: DraftRow[] = []
    for (const row of rawRows) {
      const rawDate = row[dateIdx] ?? ''
      const rawAmount = row[amountIdx] ?? ''
      const description = (row[descIdx] ?? '').slice(0, 200)

      const date = parseDate(rawDate)
      const amount = parseAmount(rawAmount)
      if (!date || amount === null || amount === 0) continue

      const type: TransactionType = amount < 0 ? 'expense' : 'income'
      const pool = type === 'expense' ? expenseCats : incomeCats
      const guessedName = guessCategoryName(description, type === 'income')
      const category = pool.find((c) => c.name === guessedName) ?? pool[0]
      if (!category?.id) continue

      const duplicate = existingKeys.has(`${date}|${Math.abs(amount)}|${description}`)

      drafts.push({
        include: !duplicate,
        date,
        type,
        amount: Math.abs(amount),
        description,
        categoryId: category.id,
        duplicate,
      })
    }

    if (drafts.length === 0) {
      setError('Nie udało się rozpoznać żadnej transakcji. Sprawdź mapowanie kolumn.')
      return
    }
    setError(null)
    setDraftRows(drafts)
    setStep(3)
  }

  async function handleImport() {
    const toImport = draftRows.filter((r) => r.include)
    if (toImport.length === 0) return
    await db.transactions.bulkAdd(
      toImport.map((r) => ({
        type: r.type,
        amount: r.amount,
        categoryId: r.categoryId,
        date: r.date,
        note: r.description,
      })),
    )
    onImported(toImport.length)
    handleClose()
  }

  const includedCount = draftRows.filter((r) => r.include).length

  const expenseCategories = useMemo(() => categories?.filter((c) => c.type === 'expense') ?? [], [categories])
  const incomeCategories = useMemo(() => categories?.filter((c) => c.type === 'income') ?? [], [categories])

  function updateRow(index: number, patch: Partial<DraftRow>) {
    setDraftRows((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  return (
    <Modal open={open} onClose={handleClose} title="Importuj wyciąg bankowy">
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Wyeksportuj historię transakcji z bankowości internetowej jako plik CSV i wgraj go tutaj.
          </p>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Plik CSV</label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-2.5 text-sm outline-none file:mr-3 file:rounded-xl file:border-0 file:bg-brand-500 file:px-3 file:py-1.5 file:text-white dark:border-white/10 dark:bg-white/5"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Kodowanie pliku</label>
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-900/5 p-1 dark:bg-white/5">
              {(['utf-8', 'windows-1250'] as const).map((enc) => (
                <button
                  key={enc}
                  type="button"
                  onClick={() => setEncoding(enc)}
                  className={clsx(
                    'rounded-xl py-2 text-sm font-medium transition',
                    encoding === enc ? 'bg-white shadow-sm dark:bg-slate-800' : 'text-slate-500 dark:text-slate-400',
                  )}
                >
                  {enc === 'utf-8' ? 'UTF-8' : 'Windows-1250 (ANSI)'}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Jeśli polskie znaki wyjdą krzaczkami w podglądzie, zmień kodowanie na Windows-1250.
            </p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button className="w-full" disabled={!file} onClick={handleParseFile}>
            <ArrowRight size={16} /> Dalej
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Wskaż, które kolumny z pliku odpowiadają dacie, kwocie i opisowi transakcji.
          </p>

          {[
            { label: 'Kolumna z datą', value: dateCol, set: setDateCol },
            { label: 'Kolumna z kwotą', value: amountCol, set: setAmountCol },
            { label: 'Kolumna z opisem', value: descCol, set: setDescCol },
          ].map(({ label, value, set }) => (
            <div key={label}>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">{label}</label>
              <select
                value={value}
                onChange={(e) => set(e.target.value)}
                className="w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-white/10 dark:bg-white/5"
              >
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {rawRows[0] && (
            <div className="rounded-2xl bg-slate-900/5 p-3 text-xs dark:bg-white/5">
              <p className="mb-1 font-semibold text-slate-500 dark:text-slate-400">Podgląd pierwszego wiersza:</p>
              <p>Data: {rawRows[0][headers.indexOf(dateCol)]}</p>
              <p>Kwota: {rawRows[0][headers.indexOf(amountCol)]}</p>
              <p>Opis: {rawRows[0][headers.indexOf(descCol)]}</p>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setStep(1)}>
              <ArrowLeft size={16} /> Wstecz
            </Button>
            <Button className="flex-1" onClick={buildDraftRows}>
              <ArrowRight size={16} /> Dalej
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Znaleziono {draftRows.length} transakcji. Odznacz te, których nie chcesz importować.
            </p>
          </div>

          <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
            {draftRows.map((row, i) => {
              const pool = row.type === 'expense' ? expenseCategories : incomeCategories
              return (
                <div
                  key={i}
                  className={clsx(
                    'rounded-2xl border px-3 py-2',
                    row.duplicate
                      ? 'border-amber-400/40 bg-amber-400/10'
                      : 'border-white/60 bg-white/50 dark:border-white/10 dark:bg-white/5',
                  )}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={row.include}
                      onChange={(e) => updateRow(i, { include: e.target.checked })}
                      className="mt-1 h-4 w-4 shrink-0 accent-brand-500"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{row.description || '(brak opisu)'}</p>
                        <span
                          className={clsx(
                            'shrink-0 text-sm font-semibold',
                            row.type === 'income' && 'text-emerald-600 dark:text-emerald-400',
                          )}
                        >
                          {row.type === 'income' ? '+' : '-'}
                          {formatCurrency(row.amount)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400">{row.date}</span>
                        {row.duplicate && (
                          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                            możliwy duplikat
                          </span>
                        )}
                        <select
                          value={row.categoryId}
                          onChange={(e) => updateRow(i, { categoryId: Number(e.target.value) })}
                          className="ml-auto rounded-lg border border-white/60 bg-white/70 px-2 py-1 text-xs outline-none dark:border-white/10 dark:bg-white/5"
                        >
                          {pool.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="ghost" onClick={() => setStep(2)}>
              <ArrowLeft size={16} /> Wstecz
            </Button>
            <Button className="flex-1" disabled={includedCount === 0} onClick={handleImport}>
              <Check size={16} /> Importuj ({includedCount})
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
