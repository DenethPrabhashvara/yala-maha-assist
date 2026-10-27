import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { Dashboard } from './pages/Dashboard'
import { Tanks } from './pages/Tanks'
import { Rivers } from './pages/Rivers'
import { SmsGateway } from './pages/SmsGateway'
import { FarmerPortal } from './pages/FarmerPortal'
import { Database } from './pages/Database'
import { Settings } from './pages/Settings'
import { Login } from './pages/Login'
import { useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { LoadingScreen } from './components/ui/LoadingScreen'

// Everything except the sign-in page needs a signed-in admin
function SignedIn() {
  const { status } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <LoadingScreen label="Checking your session…" />
  if (status === 'out') return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return (
    <DataProvider>
      <AppLayout />
    </DataProvider>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route element={<SignedIn />}>
        <Route index element={<Dashboard />} />
        <Route path="tanks" element={<Tanks />} />
        <Route path="rivers" element={<Rivers />} />
        <Route path="sms" element={<SmsGateway />} />
        <Route path="farmers" element={<FarmerPortal />} />
        <Route path="database" element={<Database />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
