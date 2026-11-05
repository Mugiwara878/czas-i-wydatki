import { useState } from 'react'
import { formatCurrency } from '../../lib/format'

interface Slice {
  name: string
  value: number
  color: string
}

const SIZE = 200
const CENTER = SIZE / 2
const RADIUS = 72
const STROKE = 26
const GAP = 3
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function CategoryDonutChart({ data }: { data: Slice[] }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const total = data.reduce((sum, d) => sum + d.value, 0)

  let cumulative = 0
  const segments = data.map((d, i) => {
    const length = total > 0 ? (d.value / total) * CIRCUMFERENCE : 0
    const offset = cumulative
    cumulative += length
    const midAngle = ((offset + length / 2) / CIRCUMFERENCE) * 360 - 90
    const midRad = (midAngle * Math.PI) / 180
    return {
      ...d,
      index: i,
      length,
      offset,
      tooltipX: CENTER + (RADIUS + STROKE / 2) * Math.cos(midRad),
      tooltipY: CENTER + (RADIUS + STROKE / 2) * Math.sin(midRad),
      percent: total > 0 ? (d.value / total) * 100 : 0,
    }
  })

  const hoveredSegment = hovered !== null ? segments[hovered] : null

  if (total === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Brak wydatków w tym miesiącu.</p>
  }

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE}>
          <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
            {segments.map((s) => {
              const isHovered = hovered === s.index
              const gap = segments.length > 1 ? GAP : 0
              const visibleLength = Math.max(0, s.length - gap)
              return (
                <circle
                  key={s.name}
                  cx={CENTER}
                  cy={CENTER}
                  r={RADIUS}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={isHovered ? STROKE + 4 : STROKE}
                  strokeDasharray={`${visibleLength} ${CIRCUMFERENCE - visibleLength}`}
                  strokeDashoffset={-s.offset}
                  opacity={hovered === null || isHovered ? 1 : 0.55}
                  tabIndex={0}
                  onMouseEnter={() => setHovered(s.index)}
                  onFocus={() => setHovered(s.index)}
                  onMouseLeave={() => setHovered(null)}
                  onBlur={() => setHovered(null)}
                  style={{ cursor: 'pointer', transition: 'stroke-width 120ms, opacity 120ms' }}
                />
              )
            })}
          </g>
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {hoveredSegment ? hoveredSegment.name : 'Wydatki'}
          </p>
          <p className="text-lg font-bold">
            {formatCurrency(hoveredSegment ? hoveredSegment.value : total)}
          </p>
        </div>

        {hoveredSegment && (
          <div
            className="glass-solid pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl px-2.5 py-1.5 text-xs whitespace-nowrap"
            style={{ left: `${(hoveredSegment.tooltipX / SIZE) * 100}%`, top: `${(hoveredSegment.tooltipY / SIZE) * 100}%` }}
          >
            <p className="font-semibold">{formatCurrency(hoveredSegment.value)}</p>
            <p className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: hoveredSegment.color }} />
              {hoveredSegment.name} &middot; {hoveredSegment.percent.toFixed(0)}%
            </p>
          </div>
        )}
      </div>

      <div className="flex w-full flex-col gap-2">
        {segments.map((s) => (
          <button
            key={s.name}
            onMouseEnter={() => setHovered(s.index)}
            onFocus={() => setHovered(s.index)}
            onMouseLeave={() => setHovered(null)}
            onBlur={() => setHovered(null)}
            className={`flex items-center gap-2 rounded-xl px-2 py-1 text-left transition ${
              hovered === s.index ? 'bg-white/50 dark:bg-white/10' : ''
            }`}
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{s.name}</span>
            <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">{s.percent.toFixed(0)}%</span>
            <span className="shrink-0 text-sm font-semibold">{formatCurrency(s.value)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
