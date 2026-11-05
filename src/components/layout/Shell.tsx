import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Wallet, ListTodo, CalendarDays, Lightbulb, Settings } from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { to: '/', label: 'Pulpit', icon: LayoutDashboard, end: true },
  { to: '/wydatki', label: 'Wydatki', icon: Wallet, end: false },
  { to: '/listy', label: 'Listy', icon: ListTodo, end: false },
  { to: '/kalendarz', label: 'Kalendarz', icon: CalendarDays, end: false },
  { to: '/pomysly', label: 'Pomysły', icon: Lightbulb, end: false },
  { to: '/ustawienia', label: 'Ustawienia', icon: Settings, end: false },
]

export function Shell() {
  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <nav className="glass fixed inset-x-0 bottom-0 z-40 flex justify-around rounded-none border-x-0 border-b-0 px-1 py-2 sm:sticky sm:top-0 sm:h-screen sm:w-20 sm:flex-col sm:justify-start sm:gap-2 sm:rounded-none sm:border-y-0 sm:border-l-0 sm:py-6 lg:w-56">
        <div className="hidden px-4 pb-6 text-lg font-bold text-brand-600 sm:block lg:px-2">
          <span className="lg:hidden">CW</span>
          <span className="hidden lg:inline">Czas i Wydatki</span>
        </div>
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                'flex flex-1 flex-col items-center gap-0.5 rounded-2xl px-1 py-1.5 text-[10px] font-medium transition sm:flex-none sm:flex-row sm:gap-3 sm:px-3 sm:py-3 sm:text-sm lg:mx-2',
                isActive
                  ? 'bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-md shadow-brand-500/25'
                  : 'text-slate-600 hover:bg-white/50 dark:text-slate-300 dark:hover:bg-white/10',
              )
            }
          >
            <Icon size={18} />
            <span className="truncate sm:hidden lg:inline">{label}</span>
          </NavLink>
        ))}
      </nav>
      <main className="flex-1 px-4 pb-24 pt-6 sm:px-8 sm:pb-10 sm:pt-8 2xl:px-12">
        <Outlet />
      </main>
    </div>
  )
}
