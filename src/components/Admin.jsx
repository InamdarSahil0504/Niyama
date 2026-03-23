import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const ADMIN_PASSWORD = 'niyama-admin-2024'

export default function Admin() {
    const [authed, setAuthed] = useState(false)
    const [password, setPassword] = useState('')
    const [users, setUsers] = useState([])
    const [streaks, setStreaks] = useState([])
    const [loading, setLoading] = useState(false)
    const [adjustUserId, setAdjustUserId] = useState(null)
    const [adjustAmount, setAdjustAmount] = useState('')
    const [adjustReason, setAdjustReason] = useState('')
    const [message, setMessage] = useState('')

    function handleLogin() {
        if (password === ADMIN_PASSWORD) {
            setAuthed(true)
            fetchData()
        } else {
            setMessage('Incorrect password')
        }
    }

    async function fetchData() {
        setLoading(true)

        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })

        const { data: streakData } = await supabase
            .from('streaks')
            .select('*')

        setUsers(profileData || [])
        setStreaks(streakData || [])
        setLoading(false)
    }

    async function adjustPoints() {
        if (!adjustUserId || !adjustAmount) return
        const amount = parseInt(adjustAmount)

        const user = users.find(u => u.id === adjustUserId)
        const newPoints = (user?.monthly_points || 0) + amount

        await supabase
            .from('profiles')
            .update({ monthly_points: newPoints })
            .eq('id', adjustUserId)

        await supabase
            .from('admin_adjustments')
            .insert({
                user_id: adjustUserId,
                adjustment: amount,
                reason: adjustReason,
            })

        setAdjustUserId(null)
        setAdjustAmount('')
        setAdjustReason('')
        setMessage('Points adjusted successfully')
        fetchData()
    }

    async function resetMonthlyData(userId) {
        if (!confirm('Reset this user\'s monthly data?')) return

        await supabase
            .from('profiles')
            .update({
                monthly_points: 0,
                successful_days: 0,
                consecutive_inactive_days: 0,
            })
            .eq('id', userId)

        await supabase
            .from('streaks')
            .update({
                current_streak: 0,
                streak_bonus_unlocked: false,
            })
            .eq('user_id', userId)

        await supabase
            .from('habits')
            .delete()
            .eq('user_id', userId)

        setMessage('Monthly data reset for user')
        fetchData()
    }

    async function changeTier(userId, tier) {
        await supabase
            .from('profiles')
            .update({ tier })
            .eq('id', userId)
        fetchData()
    }

    function getStreak(userId) {
        return streaks.find(s => s.user_id === userId)
    }

    function calcReward(user) {
        const caps = { free: 5, plus: 10, premium: 20 }
        const streak = getStreak(user.id)
        if ((user.consecutive_inactive_days || 0) >= 5) return '$0.00'
        if ((user.successful_days || 0) < 7) return '$0.00'
        if (streak?.streak_bonus_unlocked && user.tier === 'premium') return '$25.00'
        const pointsValue = (user.monthly_points || 0) / 1000
        const cap = caps[user.tier] || 5
        return `$${Math.min(pointsValue, cap).toFixed(2)}`
    }

    if (!authed) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
                <div className="w-full max-w-sm bg-gray-900 rounded-2xl p-8">
                    <h1 className="text-white text-2xl font-bold mb-2">Admin Panel</h1>
                    <p className="text-gray-400 text-sm mb-6">Niyama</p>
                    <input
                        type="password"
                        placeholder="Admin password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                        className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                    />
                    {message && <p className="text-red-400 text-sm mb-4">{message}</p>}
                    <button
                        onClick={handleLogin}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg transition"
                    >
                        Enter
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white px-4 py-8 max-w-4xl mx-auto">

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Admin Panel</h1>
                    <p className="text-gray-400 text-sm">{users.length} users total</p>
                </div>
                <button
                    onClick={fetchData}
                    className="text-indigo-400 text-sm hover:text-indigo-300"
                >
                    Refresh
                </button>
            </div>

            {message && (
                <div className="bg-indigo-900 rounded-lg p-3 mb-6">
                    <p className="text-indigo-300 text-sm">{message}</p>
                </div>
            )}

            {loading ? (
                <p className="text-gray-400">Loading...</p>
            ) : (
                <div className="space-y-4">
                    {users.map(user => {
                        const streak = getStreak(user.id)
                        return (
                            <div key={user.id} className="bg-gray-900 rounded-2xl p-6">

                                {/* User Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="font-semibold text-lg">{user.full_name || 'No name'}</p>
                                        <p className="text-gray-400 text-sm">{user.id}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-green-400 font-semibold">{calcReward(user)}</p>
                                        <p className="text-gray-500 text-xs">est. reward</p>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-3 mb-4 sm:grid-cols-4">
                                    <div className="bg-gray-800 rounded-lg p-3">
                                        <p className="text-gray-400 text-xs">Monthly points</p>
                                        <p className="font-bold text-lg">{user.monthly_points || 0}</p>
                                    </div>
                                    <div className="bg-gray-800 rounded-lg p-3">
                                        <p className="text-gray-400 text-xs">Successful days</p>
                                        <p className="font-bold text-lg">{user.successful_days || 0}</p>
                                    </div>
                                    <div className="bg-gray-800 rounded-lg p-3">
                                        <p className="text-gray-400 text-xs">Current streak</p>
                                        <p className="font-bold text-lg">{streak?.current_streak || 0}</p>
                                    </div>
                                    <div className="bg-gray-800 rounded-lg p-3">
                                        <p className="text-gray-400 text-xs">Inactive days</p>
                                        <p className={`font-bold text-lg ${(user.consecutive_inactive_days || 0) >= 5 ? 'text-red-400' : ''}`}>
                                            {user.consecutive_inactive_days || 0}
                                        </p>
                                    </div>
                                </div>

                                {/* Tier + Last Active */}
                                <div className="flex justify-between items-center mb-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400">Tier:</span>
                                        <select
                                            value={user.tier || 'free'}
                                            onChange={e => changeTier(user.id, e.target.value)}
                                            className="bg-gray-800 text-white rounded-lg px-2 py-1 text-sm outline-none"
                                        >
                                            <option value="free">Free</option>
                                            <option value="plus">Plus</option>
                                            <option value="premium">Premium</option>
                                        </select>
                                    </div>
                                    <span className="text-gray-500">
                                        Last active: {user.last_active_date || 'Never'}
                                    </span>
                                </div>

                                {/* Adjust Points */}
                                {adjustUserId === user.id ? (
                                    <div className="bg-gray-800 rounded-lg p-4 mb-3">
                                        <p className="text-sm text-gray-300 mb-3">Adjust points for {user.full_name}</p>
                                        <input
                                            type="number"
                                            placeholder="Amount (e.g. 500 or -200)"
                                            value={adjustAmount}
                                            onChange={e => setAdjustAmount(e.target.value)}
                                            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none mb-2"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Reason (optional)"
                                            value={adjustReason}
                                            onChange={e => setAdjustReason(e.target.value)}
                                            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none mb-3"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={adjustPoints}
                                                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm py-2 rounded-lg transition"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => setAdjustUserId(null)}
                                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 rounded-lg transition"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setAdjustUserId(user.id); setMessage('') }}
                                            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm py-2 rounded-lg transition"
                                        >
                                            Adjust points
                                        </button>
                                        <button
                                            onClick={() => resetMonthlyData(user.id)}
                                            className="flex-1 bg-red-900 hover:bg-red-800 text-white text-sm py-2 rounded-lg transition"
                                        >
                                            Reset month
                                        </button>
                                    </div>
                                )}

                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}