import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { endOfMonth, format, startOfMonth } from 'date-fns'
import { Wallet, TrendingDown, TrendingUp, CheckCircle2, Circle } from 'lucide-react'
import { db } from '../db/db'
import { StatCard } from '../components/ui/StatCard'
import { GlassCard } from '../components/ui/GlassCard'
import { IconChip } from '../components/ui/IconChip'
import { resolveIcon } from '../lib/icons'
import { currentMonthLabel, formatCurrency, todayIso } from '../lib/format'

export function Dashboard() {
  const monthStart = useMemo(() => format(startOfMonth(new Date()), 'yyyy-MM-dd'), [])
  const monthEnd = useMemo(() => format(endOfMonth(new Date()), 'yyyy-MM-dd'), [])
  const today = todayIso()

  const transactions = useLiveQuery(
    () => db.transactions.where('date').between(monthStart, monthEnd, true, true).toArray(),
    [monthStart, monthEnd],
  )
  const categories = useLiveQuery(() => db.categories.toArray(), [])
  const todaysTasks = useLiveQuery(() => db.tasks.where('date').equals(today).sortBy('startTime'), [today])

  const income = transactions?.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) ?? 0
  const expense = transactions?.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) ?? 0
  const balance = income - expense

  const categoryMap = new Map(categories?.map((c) => [c.id, c]))

  const topCategories = useMemo(() => {
    if (!transactions) return []
    const totals = new Map<number, number>()
    for (const t of transactions) {
      if (t.type !== 'expense') continue
      totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amount)
    }
    return [...totals.entries()]
      .map(([categoryId, total]) => ({ category: categoryMap.get(categoryId), total }))
      .filter((x) => x.category)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [transactions, categories])

  const maxCategoryTotal = topCategories[0]?.total ?? 1

  async function toggleTask(id: number | undefined, done: boolean) {
    if (id === undefined) return
    await db.tasks.update(id, { done: !done })
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Witaj z powrotem</p>
        <h1 className="text-2xl font-bold capitalize tracking-tight">{currentMonthLabel()}</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Saldo miesiąca"
          value={formatCurrency(balance)}
          icon={Wallet}
          gradient="linear-gradient(135deg, #6366f1, #0ea5e9)"
        />
        <StatCard
          title="Przychody"
          value={formatCurrency(income)}
          icon={TrendingUp}
          gradient="linear-gradient(135deg, #22c55e, #0ea5e9)"
        />
        <StatCard
          title="Wydatki"
          value={formatCurrency(expense)}
          icon={TrendingDown}
          gradient="linear-gradient(135deg, #f97066, #ec4899)"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GlassCard className="p-5">
          <h2 className="mb-4 text-base font-semibold">Najwięcej wydajesz na</h2>
          {topCategories.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">Brak wydatków w tym miesiącu.</p>
          )}
          <div className="space-y-3">
            {topCategories.map(({ category, total }) => {
              const Icon = resolveIcon(category!.icon)
              return (
                <div key={category!.id} className="flex items-center gap-3">
                  <IconChip icon={Icon} color={category!.color} size="sm" />
                  <div className="flex-1">
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium">{category!.name}</span>
                      <span className="text-slate-500 dark:text-slate-400">{formatCurrency(total)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-900/5 dark:bg-white/10">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(total / maxCategoryTotal) * 100}%`,
                          background: category!.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="mb-4 text-base font-semibold">Zadania na dziś</h2>
          {(!todaysTasks || todaysTasks.length === 0) && (
            <p className="text-sm text-slate-500 dark:text-slate-400">Brak zadań na dziś. Miłego dnia!</p>
          )}
          <div className="space-y-2">
            {todaysTasks?.map((task) => (
              <button
                key={task.id}
                onClick={() => toggleTask(task.id, task.done)}
                className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-white/40 dark:hover:bg-white/5"
              >
                {task.done ? (
                  <CheckCircle2 className="text-emerald-500" size={20} />
                ) : (
                  <Circle className="text-slate-400" size={20} />
                )}
                <div className="flex-1">
                  <p className={task.done ? 'text-sm text-slate-400 line-through' : 'text-sm font-medium'}>
                    {task.title}
                  </p>
                  {task.startTime && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">{task.startTime}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
