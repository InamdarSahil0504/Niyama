import { useState } from 'react'
import { supabase } from '../supabase'

export default function Auth() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [isSignUp, setIsSignUp] = useState(false)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    async function handleAuth() {
        setLoading(true)
        setMessage('')

        if (isSignUp) {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName
                    }
                }
            })
            if (error) {
                setMessage(error.message)
            } else if (data.user) {
                await supabase.from('profiles').insert({
                    id: data.user.id,
                    full_name: fullName,
                    tier: 'free',
                    monthly_points: 0,
                })
                await supabase.from('streaks').insert({
                    user_id: data.user.id,
                    current_streak: 0,
                    longest_streak: 0,
                    successful_days_this_month: 0,
                })
                setMessage('Account created! You can now log in.')
                setIsSignUp(false)
            }
        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) setMessage(error.message)
        }

        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
            <div className="w-full max-w-md">

                {/* Logo */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-white tracking-tight">Niyama</h1>
                    <p className="text-gray-400 mt-2 text-sm">Successful habits. Real rewards.</p>
                    <div className="mt-6 px-4">
                        <p className="text-gray-300 text-sm font-medium"><span className="italic">Nee-yah-ma</span></p>
                        <p className="text-white text-xs mt-2 leading-relaxed">
                            A Sanskrit word meaning <span className="text-white italic">discipline</span> and <span className="text-white italic">self-observance</span>. Rooted in ancient yoga philosophy, it represents the practice of showing up consistently — not for others, but for yourself.
                        </p>
                    </div>
                    <div className="mt-4">
                        <span className="bg-amber-900 text-amber-300 text-xs font-medium px-3 py-1 rounded-full">
                            Beta testing version
                        </span>
                    </div>
                </div>

                {/* Card */}
                <div className="bg-gray-900 rounded-2xl p-8 shadow-xl">
                    <h2 className="text-white text-xl font-semibold mb-6">
                        {isSignUp ? 'Create your account' : 'Welcome back'}
                    </h2>

                    {isSignUp && (
                        <div className="mb-4">
                            <label className="text-gray-400 text-sm mb-1 block">Full name</label>
                            <input
                                type="text"
                                placeholder="Your name"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="text-gray-400 text-sm mb-1 block">Email</label>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="text-gray-400 text-sm mb-1 block">Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {message && (
                        <p className="text-sm text-indigo-400 mb-4">{message}</p>
                    )}

                    <button
                        onClick={handleAuth}
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg transition"
                    >
                        {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Log in'}
                    </button>
                    {/* Sign up / Log in toggle — above disclaimer */}
                    <p className="text-center text-gray-200 text-base mt-6">
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                        <button
                            onClick={() => { setIsSignUp(!isSignUp); setMessage('') }}
                            className="text-white font-semibold hover:text-indigo-300 underline"
                        >
                            {isSignUp ? 'Log in' : 'Sign up'}
                        </button>
                    </p>

                    {/* Legal disclaimer */}
                    <div className="border-t border-gray-800 mt-6 pt-4">
                        <p className="text-gray-500 text-xs leading-relaxed text-center">
                            Niyama is currently in beta testing. By signing up you agree that the service is provided "as is" without any warranties. No subscription fees will be charged and no monetary rewards will be paid out during the beta period. Point values, reward caps and features are subject to change without notice. Niyama reserves the right to withhold rewards in cases of suspected misuse.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    )
}