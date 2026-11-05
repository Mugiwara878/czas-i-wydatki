export type TransactionType = 'income' | 'expense'

export interface Category {
  id?: number
  name: string
  type: TransactionType
  color: string
  icon: string
}

export interface Transaction {
  id?: number
  type: TransactionType
  amount: number
  categoryId: number
  note: string
  date: string // ISO date, yyyy-MM-dd
}

export interface Budget {
  id?: number
  categoryId: number
  monthlyLimit: number
}

export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id?: number
  title: string
  date: string // ISO date, yyyy-MM-dd
  startTime?: string // HH:mm
  endTime?: string // HH:mm
  done: boolean
  priority: TaskPriority
  note?: string
  color?: string
}

export interface Idea {
  id?: number
  title: string
  text?: string
  drawing?: string // PNG data URL
  color: string
  createdAt: string // ISO timestamp
  updatedAt: string // ISO timestamp
}
