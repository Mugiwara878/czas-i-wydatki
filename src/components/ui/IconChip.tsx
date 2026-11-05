import type { LucideIcon } from 'lucide-react'

export function IconChip({ icon: Icon, color, size = 'md' }: { icon: LucideIcon; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-14 w-14' : 'h-10 w-10'
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 24 : 18

  return (
    <div
      className={`flex ${dims} shrink-0 items-center justify-center rounded-2xl text-white shadow-sm`}
      style={{ background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 60%, black))` }}
    >
      <Icon size={iconSize} />
    </div>
  )
}
