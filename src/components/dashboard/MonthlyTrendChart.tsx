import { useState } from 'react'
import { formatCurrency } from '../../lib/format'

interface MonthPoint {
  label: string
  income: number
  expense: number
}

const WIDTH = 600
const HEIGHT = 220
const PAD_LEFT = 44
const PAD_RIGHT = 8
const PAD_TOP = 10
const PAD_BOTTOM = 26
const BAR_WIDTH = 16
const BAR_GAP = 3

const INCOME_COLOR = '#22c55e'
const EXPENSE_COLOR = '#ef4444'

function niceCeil(value: number): number {
  if (value <= 0) return 100
  const exp = Math.floor(Math.log10(value))
  const base = Math.pow(10, exp)
  const normalized = value / base
  const niceNorm = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return niceNorm * base
}

function roundedTopPath(x: number, y: number, w: number, h: number, r: number): string {
  if (h <= 0) return ''
  const radius = Math.min(r, h, w / 2)
  const yBottom = y + h
  return `M${x},${yBottom} L${x},${y + radius} Q${x},${y} ${x + radius},${y} L${x + w - radius},${y} Q${x + w},${y} ${x + w},${y + radius} L${x + w},${yBottom} Z`
}

export function MonthlyTrendChart({ data }: { data: MonthPoint[] }) {
  const [hovered, setHovered] = useState<{ index: number; series: 'income' | 'expense'; x: number; y: number } | null>(
    null,
  )

  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM
  const maxValue = niceCeil(Math.max(1, ...data.map((d) => Math.max(d.income, d.expense))))
  const groupWidth = plotWidth / Math.max(1, data.length)

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * maxValue)

  function yFor(value: number): number {
    return PAD_TOP + plotHeight - (value / maxValue) * plotHeight
  }

  const hoveredPoint = hovered ? data[hovered.index] : null
  const hoveredValue = hoveredPoint ? (hovered!.series === 'income' ? hoveredPoint.income : hoveredPoint.expense) : 0

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: INCOME_COLOR }} />
          Przychody
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: EXPENSE_COLOR }} />
          Wydatki
        </span>
      </div>

      <div className="relative" style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }}>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-full w-full" preserveAspectRatio="none">
          {ticks.map((t) => {
            const y = yFor(t)
            return (
              <g key={t}>
                <line
                  x1={PAD_LEFT}
                  x2={WIDTH - PAD_RIGHT}
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth={1}
                  className="text-slate-900/10 dark:text-white/10"
                />
                <text x={PAD_LEFT - 6} y={y + 3} textAnchor="end" fontSize={9} className="fill-slate-400">
                  {t >= 1000 ? `${Math.round(t / 1000)}k` : Math.round(t)}
                </text>
              </g>
            )
          })}

          {data.map((d, i) => {
            const groupX = PAD_LEFT + i * groupWidth
            const pairWidth = BAR_WIDTH * 2 + BAR_GAP
            const pairStart = groupX + (groupWidth - pairWidth) / 2
            const incomeX = pairStart
            const expenseX = pairStart + BAR_WIDTH + BAR_GAP
            const incomeY = yFor(d.income)
            const expenseY = yFor(d.expense)
            const incomeH = PAD_TOP + plotHeight - incomeY
            const expenseH = PAD_TOP + plotHeight - expenseY
            const isIncomeHovered = hovered?.index === i && hovered.series === 'income'
            const isExpenseHovered = hovered?.index === i && hovered.series === 'expense'

            return (
              <g key={d.label}>
                <path
                  d={roundedTopPath(incomeX, incomeY, BAR_WIDTH, incomeH, 4)}
                  fill={INCOME_COLOR}
                  opacity={isIncomeHovered ? 1 : 0.85}
                  tabIndex={0}
                  onMouseEnter={() => setHovered({ index: i, series: 'income', x: incomeX + BAR_WIDTH / 2, y: incomeY })}
                  onFocus={() => setHovered({ index: i, series: 'income', x: incomeX + BAR_WIDTH / 2, y: incomeY })}
                  onMouseLeave={() => setHovered(null)}
                  onBlur={() => setHovered(null)}
                  style={{ cursor: 'pointer' }}
                />
                <path
                  d={roundedTopPath(expenseX, expenseY, BAR_WIDTH, expenseH, 4)}
                  fill={EXPENSE_COLOR}
                  opacity={isExpenseHovered ? 1 : 0.85}
                  tabIndex={0}
                  onMouseEnter={() =>
                    setHovered({ index: i, series: 'expense', x: expenseX + BAR_WIDTH / 2, y: expenseY })
                  }
                  onFocus={() => setHovered({ index: i, series: 'expense', x: expenseX + BAR_WIDTH / 2, y: expenseY })}
                  onMouseLeave={() => setHovered(null)}
                  onBlur={() => setHovered(null)}
                  style={{ cursor: 'pointer' }}
                />
                <text
                  x={groupX + groupWidth / 2}
                  y={HEIGHT - PAD_BOTTOM + 14}
                  textAnchor="middle"
                  fontSize={9}
                  className="fill-slate-400 capitalize"
                >
                  {d.label}
                </text>
              </g>
            )
          })}

          <line
            x1={PAD_LEFT}
            x2={WIDTH - PAD_RIGHT}
            y1={PAD_TOP + plotHeight}
            y2={PAD_TOP + plotHeight}
            stroke="currentColor"
            strokeWidth={1}
            className="text-slate-900/20 dark:text-white/20"
          />
        </svg>

        {hovered && hoveredPoint && (
          <div
            className="glass-solid pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl px-2.5 py-1.5 text-xs whitespace-nowrap"
            style={{ left: `${(hovered.x / WIDTH) * 100}%`, top: `${(hovered.y / HEIGHT) * 100 - 2}%` }}
          >
            <p className="font-semibold">{formatCurrency(hoveredValue)}</p>
            <p className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
              <span
                className="inline-block h-0.5 w-2.5"
                style={{ backgroundColor: hovered.series === 'income' ? INCOME_COLOR : EXPENSE_COLOR }}
              />
              {hovered.series === 'income' ? 'Przychody' : 'Wydatki'} &middot; {hoveredPoint.label}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
