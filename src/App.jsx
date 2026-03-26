import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import Admin from './components/Admin'
import ResetPassword from './components/ResetPassword'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <p className="text-white text-lg">Loading...</p>
    </div>
  )

  const isAdmin = window.location.pathname === '/admin'
  const isResetPassword = window.location.pathname === '/reset-password'

  return (
    <div>
      {isResetPassword ? <ResetPassword /> : isAdmin ? <Admin /> : (!session ? <Auth /> : <Dashboard session={session} />)}
    </div>
  )
}

export default App