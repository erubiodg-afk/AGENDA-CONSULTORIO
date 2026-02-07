import { AuthProvider, useAuth } from './context/AuthContext'
import { AppLayout } from './components/layout/AppLayout'
import { Agenda } from './pages/Agenda'
import { Login } from './pages/Login'

function AppContent() {
  const { user, loading, loginGoogle, logout, error } = useAuth(); // Obtener error del contexto

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-brand-purple border-t-transparent rounded-full animate-spin"></div>
          <span>Cargando...</span>
        </div>
        {/* Fail-safe para bucles de carga */}
        <button
          onClick={() => logout()}
          className="text-xs text-red-400 hover:text-red-500 underline mt-4"
        >
          ¿Tarda mucho? Cancelar e intentar de nuevo
        </button>
      </div>
    );
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
