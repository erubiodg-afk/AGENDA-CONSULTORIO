import { AuthProvider, useAuth } from './context/AuthContext'
import { AppLayout } from './components/layout/AppLayout'
import { Agenda } from './pages/Agenda'
import { Login } from './pages/Login'

function AppContent() {
  const { user, loading, loginGoogle, logout, error } = useAuth(); // Obtener error del contexto

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-slate-50 text-slate-400">Cargando...</div>;
  }

  if (!user) {
    // Pasar error como prop si es necesario, o Login ya lo usa del contexto? mejor pasar loginGoogle
    return <Login onLogin={loginGoogle} error={error} />;
  }

  return (
    <AppLayout onLogout={logout}>
      <Agenda />
    </AppLayout>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
