import { Routes, Route } from 'react-router-dom'
import { Shell } from './components/layout/Shell'
import { Dashboard } from './pages/Dashboard'
import { Expenses } from './pages/Expenses'
import { Lists } from './pages/Lists'
import { Calendar } from './pages/Calendar'
import { Ideas } from './pages/Ideas'
import { Settings } from './pages/Settings'

export function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/wydatki" element={<Expenses />} />
        <Route path="/listy" element={<Lists />} />
        <Route path="/kalendarz" element={<Calendar />} />
        <Route path="/pomysly" element={<Ideas />} />
        <Route path="/ustawienia" element={<Settings />} />
      </Route>
    </Routes>
  )
}
