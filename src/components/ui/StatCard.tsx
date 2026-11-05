import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { GlassCard } from './GlassCard'

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  gradient,
}: {
  title: string
  value: string
  change?: { value: string; positive: boolean }
  icon: LucideIcon
  gradient: string
}) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-2xl text-white"
          style={{ background: gradient }}
        >
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
      {change && (
        <div
          className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${
            change.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
          }`}
        >
          {change.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {change.value}
        </div>
      )}
    </GlassCard>
  )
}
