import type { ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger'
}

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition active:scale-[0.98] disabled:opacity-50',
        variant === 'primary' &&
          'bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-lg shadow-brand-500/25 hover:brightness-105',
        variant === 'ghost' &&
          'border border-white/60 bg-white/50 text-slate-700 backdrop-blur hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10',
        variant === 'danger' && 'bg-red-500/90 text-white hover:bg-red-500',
        className,
      )}
      {...props}
    />
  )
}
