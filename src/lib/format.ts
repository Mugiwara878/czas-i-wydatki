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
