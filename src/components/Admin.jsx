import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const ADMIN_PASSWORD = 'NiyamaHealth'

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
    const [showMetrics, setShowMetrics] = useState(false)
    const [metrics, setMetrics] = useState(null)
    const [npsScore, setNpsScore] = useState('')
    const [savingNps, setSavingNps] = useState(false)

    function handleLogin() {
        if (password === ADMIN_PASSWORD) {
            setAuthed(true)
            fetchData()
        } else {
            setMessage('Incorrect password')
        }
    }
    async function fetchMetrics() {
        const { data: allProfiles } = await supabase
            .from('profiles')
            .select('*')

        const { data: allHabits } = await supabase
            .from('habits')
            .select('*')

        const { data: allStreaks } = await supabase
            .from('streaks')
            .select('*')

        if (!allProfiles || !allHabits) return

        const totalUsers = allProfiles.length
        const freeUsers = allProfiles.filter(p => p.tier === 'free').length
        const paidUsers = allProfiles.filter(p => p.tier !== 'free').length

        // Daily active rate — users active in last 24 hours
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const activeToday = allProfiles.filter(p =>
            p.last_active_date && new Date(p.last_active_date) >= yesterday
        ).length
        const dailyActiveRate = totalUsers > 0
            ? Math.round((activeToday / totalUsers) * 100)
            : 0

        // Habit completion rate — successful days / total logged days
        const totalLogged = allHabits.length
        const totalSuccessful = allHabits.filter(h => h.day_successful).length
        const habitCompletionRate = totalLogged > 0
            ? Math.round((totalSuccessful / totalLogged) * 100)
            : 0

        // Free to paid conversion
        const conversionRate = totalUsers > 0
            ? Math.round((paidUsers / totalUsers) * 100)
            : 0

        // Monthly churn — users inactive for 30+ days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const churned = allProfiles.filter(p =>
            p.last_active_date && new Date(p.last_active_date) < thirtyDaysAgo
        ).length
        const churnRate = totalUsers > 0
            ? Math.round((churned / totalUsers) * 100)
            : 0

        // Fetch saved NPS from database
        const { data: npsData } = await supabase
            .from('admin_adjustments')
            .select('reason')
            .eq('adjustment', 0)
            .eq('reason', 'nps_score')
            .order('created_at', { ascending: false })
            .limit(1)

        const savedNps = npsData?.[0]?.adjustment || null

        setMetrics({
            totalUsers,
            freeUsers,
            paidUsers,
            activeToday,
            dailyActiveRate,
            habitCompletionRate,
            conversionRate,
            churnRate,
            totalLogged,
            totalSuccessful,
            savedNps,
        })
    }
    async function saveNps() {
        if (!npsScore) return
        setSavingNps(true)
        await supabase
            .from('admin_adjustments')
            .insert({
                user_id: users[0]?.id,
                adjustment: parseInt(npsScore),
                reason: 'nps_score',
            })
        setSavingNps(false)
        setNpsScore('')
        fetchMetrics()
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

        // Habits are never deleted — only monthly counters are reset

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
                <div className="flex gap-3 items-center">
                    <button
                        onClick={() => { setShowMetrics(!showMetrics); if (!metrics) fetchMetrics() }}
                        className={`text-sm px-4 py-2 rounded-lg transition ${showMetrics ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                    >
                        Metrics
                    </button>
                    <button
                        onClick={fetchData}
                        className="text-indigo-400 text-sm hover:text-indigo-300"
                    >
                        Refresh
                    </button>
                    <button
                        onClick={async () => {
                            const confirmed = window.confirm('Sign out of admin panel?')
                            if (confirmed) await supabase.auth.signOut()
                        }}
                        className="text-red-400 text-sm hover:text-red-300"
                    >
                        Sign out
                    </button>
                </div>
            </div>
            {showMetrics && metrics && (
                <div className="bg-gray-900 rounded-2xl p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-6">Key metrics</h2>

                    {/* Overview stats */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-gray-800 rounded-xl p-4 text-center">
                            <p className="text-gray-400 text-xs mb-1">Total users</p>
                            <p className="text-2xl font-bold">{metrics.totalUsers}</p>
                        </div>
                        <div className="bg-gray-800 rounded-xl p-4 text-center">
                            <p className="text-gray-400 text-xs mb-1">Free users</p>
                            <p className="text-2xl font-bold">{metrics.freeUsers}</p>
                        </div>
                        <div className="bg-gray-800 rounded-xl p-4 text-center">
                            <p className="text-gray-400 text-xs mb-1">Paid users</p>
                            <p className="text-2xl font-bold text-green-400">{metrics.paidUsers}</p>
                        </div>
                    </div>

                    {/* 5 key metrics table */}
                    <div className="space-y-3">

                        {/* 1. Daily active rate */}
                        <div className="bg-gray-800 rounded-xl p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="text-white text-sm font-medium">Daily active rate</p>
                                    <p className="text-gray-500 text-xs mt-0.5">{metrics.activeToday} of {metrics.totalUsers} users active today</p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-xl font-bold ${metrics.dailyActiveRate >= 60 ? 'text-green-400' : metrics.dailyActiveRate >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                                        {metrics.dailyActiveRate}%
                                    </p>
                                    <p className="text-gray-600 text-xs">target: 60%+</p>
                                </div>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-1.5">
                                <div
                                    className={`h-1.5 rounded-full ${metrics.dailyActiveRate >= 60 ? 'bg-green-400' : metrics.dailyActiveRate >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                                    style={{ width: `${Math.min(metrics.dailyActiveRate, 100)}%` }}
                                />
                            </div>
                        </div>

                        {/* 2. Habit completion rate */}
                        <div className="bg-gray-800 rounded-xl p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="text-white text-sm font-medium">Habit completion rate</p>
                                    <p className="text-gray-500 text-xs mt-0.5">{metrics.totalSuccessful} successful of {metrics.totalLogged} logged days</p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-xl font-bold ${metrics.habitCompletionRate >= 50 ? 'text-green-400' : metrics.habitCompletionRate >= 30 ? 'text-amber-400' : 'text-red-400'}`}>
                                        {metrics.habitCompletionRate}%
                                    </p>
                                    <p className="text-gray-600 text-xs">target: 50%+</p>
                                </div>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-1.5">
                                <div
                                    className={`h-1.5 rounded-full ${metrics.habitCompletionRate >= 50 ? 'bg-green-400' : metrics.habitCompletionRate >= 30 ? 'bg-amber-400' : 'bg-red-400'}`}
                                    style={{ width: `${Math.min(metrics.habitCompletionRate, 100)}%` }}
                                />
                            </div>
                        </div>

                        {/* 3. Free to paid conversion */}
                        <div className="bg-gray-800 rounded-xl p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="text-white text-sm font-medium">Free to paid conversion</p>
                                    <p className="text-gray-500 text-xs mt-0.5">{metrics.paidUsers} paying of {metrics.totalUsers} total users</p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-xl font-bold ${metrics.conversionRate >= 20 ? 'text-green-400' : metrics.conversionRate >= 10 ? 'text-amber-400' : 'text-red-400'}`}>
                                        {metrics.conversionRate}%
                                    </p>
                                    <p className="text-gray-600 text-xs">target: 20%+</p>
                                </div>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-1.5">
                                <div
                                    className={`h-1.5 rounded-full ${metrics.conversionRate >= 20 ? 'bg-green-400' : metrics.conversionRate >= 10 ? 'bg-amber-400' : 'bg-red-400'}`}
                                    style={{ width: `${Math.min(metrics.conversionRate, 100)}%` }}
                                />
                            </div>
                        </div>

                        {/* 4. Monthly churn rate */}
                        <div className="bg-gray-800 rounded-xl p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="text-white text-sm font-medium">Monthly churn rate</p>
                                    <p className="text-gray-500 text-xs mt-0.5">{metrics.churned || 0} users inactive for 30+ days</p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-xl font-bold ${metrics.churnRate <= 5 ? 'text-green-400' : metrics.churnRate <= 10 ? 'text-amber-400' : 'text-red-400'}`}>
                                        {metrics.churnRate}%
                                    </p>
                                    <p className="text-gray-600 text-xs">target: under 5%</p>
                                </div>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-1.5">
                                <div
                                    className={`h-1.5 rounded-full ${metrics.churnRate <= 5 ? 'bg-green-400' : metrics.churnRate <= 10 ? 'bg-amber-400' : 'bg-red-400'}`}
                                    style={{ width: `${Math.min(metrics.churnRate, 100)}%` }}
                                />
                            </div>
                        </div>

                        {/* 5. NPS Score */}
                        <div className="bg-gray-800 rounded-xl p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="text-white text-sm font-medium">Net Promoter Score</p>
                                    <p className="text-gray-500 text-xs mt-0.5">Manually entered from feedback form</p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-xl font-bold ${metrics.savedNps >= 40 ? 'text-green-400' : metrics.savedNps >= 20 ? 'text-amber-400' : 'text-red-400'}`}>
                                        {metrics.savedNps !== null ? metrics.savedNps : '—'}
                                    </p>
                                    <p className="text-gray-600 text-xs">target: 40+</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Enter NPS score (-100 to 100)"
                                    value={npsScore}
                                    onChange={e => setNpsScore(e.target.value)}
                                    min="-100"
                                    max="100"
                                    className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <button
                                    onClick={saveNps}
                                    disabled={savingNps || !npsScore}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition disabled:opacity-50"
                                >
                                    {savingNps ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}
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
                                        <div className="flex gap-2 mt-1 flex-wrap">
                                            {user.gender && <span className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded-full">{user.gender}</span>}
                                            {user.age && <span className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded-full">Age {user.age}</span>}
                                            {user.is_minor && <span className="bg-amber-900 text-amber-300 text-xs px-2 py-0.5 rounded-full">Minor</span>}
                                            {user.color_theme && <span className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded-full capitalize">{user.color_theme} theme</span>}
                                        </div>
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