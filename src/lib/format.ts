const currencyFormatter = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
  maximumFractionDigits: 2,
})

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount)
}

export function formatDateLabel(isoDate: string): string {
  const date = new Date(isoDate + 'T00:00:00')
  return new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long' }).format(date)
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function currentMonthLabel(): string {
  return new Intl.DateTimeFormat('pl-PL', { month: 'long', year: 'numeric' }).format(new Date())
}

export function relativeTime(iso: string): string {
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
