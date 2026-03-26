import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function ResetPassword() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [isSuccess, setIsSuccess] = useState(false)

    async function handleReset() {
        if (!password || !confirmPassword) {
            setMessage('Please fill in both fields.')
            return
        }
        if (password !== confirmPassword) {
            setMessage('Passwords do not match.')
            return
        }
        if (password.length < 6) {
            setMessage('Password must be at least 6 characters.')
            return
        }
        setLoading(true)
        const { error } = await supabase.auth.updateUser({ password })
        if (error) {
            setMessage(error.message)
        } else {
            setIsSuccess(true)
            setMessage('Password updated successfully!')
            setTimeout(() => {
                window.location.href = '/'
            }, 2000)
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-white tracking-tight">Niyama</h1>
                    <p className="text-gray-400 mt-2 text-sm">Set your new password</p>
                </div>

                <div className="bg-gray-900 rounded-2xl p-8 shadow-xl">
                    <h2 className="text-white text-xl font-semibold mb-6">Create new password</h2>

                    <div className="mb-4">
                        <label className="text-gray-400 text-sm mb-1 block">New password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="text-gray-400 text-sm mb-1 block">Confirm new password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {message && (
                        <p className={`text-sm mb-4 ${isSuccess ? 'text-green-400' : 'text-indigo-400'}`}>
                            {message}
                        </p>
                    )}

                    <button
                        onClick={handleReset}
                        disabled={loading || isSuccess}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg transition"
                    >
                        {loading ? 'Updating...' : isSuccess ? 'Redirecting...' : 'Update password'}
                    </button>
                </div>
            </div>
        </div>
    )
}