import { useState } from 'react'
import { AppLayout } from './components/layout/AppLayout'
import { Agenda } from './pages/Agenda'
import { Login } from './pages/Login'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <AppLayout onLogout={() => setIsAuthenticated(false)}>
      <Agenda />
    </AppLayout>
  )
}

export default App
