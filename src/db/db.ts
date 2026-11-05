import Dexie, { type EntityTable } from 'dexie'
import type { Budget, Category, Idea, ImportBatch, Task, Transaction } from '../types'

const db = new Dexie('czas-i-wydatki') as Dexie & {
  categories: EntityTable<Category, 'id'>
  transactions: EntityTable<Transaction, 'id'>
  budgets: EntityTable<Budget, 'id'>
  tasks: EntityTable<Task, 'id'>
  ideas: EntityTable<Idea, 'id'>
  importBatches: EntityTable<ImportBatch, 'id'>
}

db.version(1).stores({
  categories: '++id, type',
  transactions: '++id, categoryId, date, type',
  budgets: '++id, categoryId',
  tasks: '++id, date, done',
})

db.version(2).stores({
  categories: '++id, type',
  transactions: '++id, categoryId, date, type',
  budgets: '++id, categoryId',
  tasks: '++id, date, done',
  ideas: '++id, updatedAt',
})

db.version(3).stores({
  categories: '++id, type',
  transactions: '++id, categoryId, date, type, importBatchId',
  budgets: '++id, categoryId',
  tasks: '++id, date, done',
  ideas: '++id, updatedAt',
  importBatches: '++id, createdAt',
})

const defaultExpenseCategories: Omit<Category, 'id'>[] = [
  { name: 'Jedzenie', type: 'expense', color: '#f97066', icon: 'utensils' },
  { name: 'Transport', type: 'expense', color: '#3b82f6', icon: 'car' },
  { name: 'Mieszkanie', type: 'expense', color: '#8b5cf6', icon: 'home' },
  { name: 'Rozrywka', type: 'expense', color: '#ec4899', icon: 'popcorn' },
  { name: 'Zakupy', type: 'expense', color: '#f59e0b', icon: 'shopping-bag' },
  { name: 'Zdrowie', type: 'expense', color: '#10b981', icon: 'heart-pulse' },
  { name: 'Rachunki', type: 'expense', color: '#06b6d4', icon: 'receipt' },
  { name: 'Inne', type: 'expense', color: '#64748b', icon: 'more-horizontal' },
]

const defaultIncomeCategories: Omit<Category, 'id'>[] = [
  { name: 'Wynagrodzenie', type: 'income', color: '#22c55e', icon: 'wallet' },
  { name: 'Inne przychody', type: 'income', color: '#0ea5e9', icon: 'trending-up' },
]

db.on('populate', async () => {
  await db.categories.bulkAdd([...defaultExpenseCategories, ...defaultIncomeCategories])
})

export { db }
