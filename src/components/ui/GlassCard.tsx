import type { HTMLAttributes } from 'react'
import clsx from 'clsx'

type GlassCardProps = HTMLAttributes<HTMLDivElement> & {
  solid?: boolean
}

export function GlassCard({ className, solid, ...props }: GlassCardProps) {
  return (
    <div
      className={clsx(solid ? 'glass-solid' : 'glass', 'rounded-3xl', className)}
      {...props}
    />
  )
}
