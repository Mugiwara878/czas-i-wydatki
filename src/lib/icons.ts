import {
  Utensils,
  Car,
  Home,
  Popcorn,
  ShoppingBag,
  HeartPulse,
  Receipt,
  MoreHorizontal,
  Wallet,
  TrendingUp,
  TrendingDown,
  type LucideIcon,
} from 'lucide-react'

export const categoryIcons: Record<string, LucideIcon> = {
  utensils: Utensils,
  car: Car,
  home: Home,
  popcorn: Popcorn,
  'shopping-bag': ShoppingBag,
  'heart-pulse': HeartPulse,
  receipt: Receipt,
  'more-horizontal': MoreHorizontal,
  wallet: Wallet,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
}

export function resolveIcon(key: string): LucideIcon {
  return categoryIcons[key] ?? MoreHorizontal
}
