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
    const [messageUserId, setMessageUserId] = useState(null)
    const [messageText, setMessageText] = useState('')
    const [sendingMessage, setSendingMessage] = useState(false)
    const [showMonthlyReport, setShowMonthlyReport] = useState(false)
    const [monthlyReport, setMonthlyReport] = useState(null)

    function handleLogin() {
        if (password === ADMIN_PASSWORD) { setAuthed(true); fetchData() }
        else setMessage('Incorrect password')
    }

    async function fetchData() {
        setLoading(true)
        const { data: profileData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
        const { data: streakData } = await supabase.from('streaks').select('*')
        setUsers(profileData || [])
        setStreaks(streakData || [])
        setLoading(false)
    }

    async function fetchMetrics() {
        const { data: allProfiles } = await supabase.from('profiles').select('*')
        const { data: allHabits } = await supabase.from('habits').select('*')
        if (!allProfiles || !allHabits) return
        const totalUsers = allProfiles.length
        const freeUsers = allProfiles.filter(p => p.tier === 'free').length
        const paidUsers = allProfiles.filter(p => p.tier !== 'free').length
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
        const activeToday = allProfiles.filter(p => p.last_active_date && new Date(p.last_active_date) >= yesterday).length
        const dailyActiveRate = totalUsers > 0 ? Math.round((activeToday / totalUsers) * 100) : 0
        const totalLogged = allHabits.length
        const totalSuccessful = allHabits.filter(h => h.day_successful).length
        const habitCompletionRate = totalLogged > 0 ? Math.round((totalSuccessful / totalLogged) * 100) : 0
        const conversionRate = totalUsers > 0 ? Math.round((paidUsers / totalUsers) * 100) : 0
        const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const churned = allProfiles.filter(p => p.last_active_date && new Date(p.last_active_date) < thirtyDaysAgo).length
        const churnRate = totalUsers > 0 ? Math.round((churned / totalUsers) * 100) : 0
        const { data: npsData } = await supabase.from('admin_adjustments').select('adjustment').eq('reason', 'nps_score').order('created_at', { ascending: false }).limit(1)
        const savedNps = npsData?.[0]?.adjustment || null
        setMetrics({ totalUsers, freeUsers, paidUsers, activeToday, dailyActiveRate, habitCompletionRate, conversionRate, churnRate, totalLogged, totalSuccessful, churned, savedNps })
    }

    async function fetchMonthlyReport() {
        const { data: allProfiles } = await supabase.from('profiles').select('*')
        const { data: allHabits } = await supabase.from('habits').select('*')
        if (!allProfiles || !allHabits) return

        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' })

        const monthHabits = allHabits.filter(h => h.date >= monthStart)
        const totalUsers = allProfiles.length
        const activeUsers = allProfiles.filter(p => p.last_active_date && p.last_active_date >= monthStart).length
        const eligibleUsers = allProfiles.filter(p => (p.successful_days || 0) >= 7 && (p.consecutive_inactive_days || 0) < 5).length

        const caps = { free: 5, plus: 10, premium: 20 }
        let totalRewardLiability = 0
        allProfiles.forEach(p => {
            if ((p.successful_days || 0) >= 7 && (p.consecutive_inactive_days || 0) < 5) {
                const pointsValue = (p.monthly_points || 0) / 1000
                const cap = caps[p.tier] || 5
                totalRewardLiability += Math.min(pointsValue, cap)
            }
        })

        const totalRevenue = allProfiles.filter(p => p.tier === 'plus').length * 4.99 + allProfiles.filter(p => p.tier === 'premium').length * 14.99

        const successfulDays = monthHabits.filter(h => h.day_successful).length
        const totalLoggedDays = monthHabits.length
        const completionRate = totalLoggedDays > 0 ? Math.round((successfulDays / totalLoggedDays) * 100) : 0

        const habitBreakdown = {
            wake: monthHabits.filter(h => h.wake_before_8).length,
            steps: monthHabits.filter(h => h.steps_over_5000).length,
            screen: monthHabits.filter(h => h.screen_under_2hrs).length,
            sleep: monthHabits.filter(h => h.sleep_before_1030).length,
        }

        setMonthlyReport({ monthName, totalUsers, activeUsers, eligibleUsers, totalRewardLiability: totalRewardLiability.toFixed(2), totalRevenue: totalRevenue.toFixed(2), completionRate, successfulDays, totalLoggedDays, habitBreakdown })
        setShowMonthlyReport(true)
    }

    async function saveNps() {
        if (!npsScore) return
        setSavingNps(true)
        await supabase.from('admin_adjustments').insert({ user_id: users[0]?.id, adjustment: parseInt(npsScore), reason: 'nps_score' })
        setSavingNps(false)
        setNpsScore('')
        fetchMetrics()
    }

    async function adjustPoints() {
        if (!adjustUserId || !adjustAmount) return
        const amount = parseInt(adjustAmount)
        const user = users.find(u => u.id === adjustUserId)
        const newPoints = (user?.monthly_points || 0) + amount
        await supabase.from('profiles').update({ monthly_points: newPoints }).eq('id', adjustUserId)
        await supabase.from('admin_adjustments').insert({ user_id: adjustUserId, adjustment: amount, reason: adjustReason })
        setAdjustUserId(null); setAdjustAmount(''); setAdjustReason('')
        setMessage('Points adjusted successfully')
        fetchData()
    }

    async function resetMonthlyData(userId) {
        if (!confirm('Reset this user\'s monthly data?')) return
        await supabase.from('profiles').update({ monthly_points: 0, successful_days: 0, consecutive_inactive_days: 0 }).eq('id', userId)
        await supabase.from('streaks').update({ current_streak: 0, streak_bonus_unlocked: false }).eq('user_id', userId)
        setMessage('Monthly data reset for user')
        fetchData()
    }

    async function changeTier(userId, tier) {
        await supabase.from('profiles').update({ tier }).eq('id', userId)
        fetchData()
    }

    async function sendMessageToUser() {
        if (!messageUserId || !messageText.trim()) return
        setSendingMessage(true)
        const user = users.find(u => u.id === messageUserId)
        await supabase.from('contact_messages').insert({
            user_id: messageUserId,
            user_name: 'Niyama Admin',
            email: 'admin@niyama.app',
            message: `[Admin message to ${user?.full_name}]: ${messageText}`,
        })
        setMessageUserId(null)
        setMessageText('')
        setMessage(`Message sent to ${user?.full_name}`)
        setSendingMessage(false)
    }

    async function exportCSV() {
        const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/xlsx.mjs')

        const headers = ['Name', 'Email', 'Gender', 'Age', 'Tier', 'Monthly Points', 'Successful Days', 'Overall Successful Days', 'Total Days Logged', 'Current Streak', 'Longest Streak', 'Consecutive Inactive Days', 'Last Active', 'Joined', 'Is Minor', 'Color Theme']

        const rows = users.map(u => {
            const streak = getStreak(u.id)
            return {
                'Name': u.full_name || '',
                'Email': u.email || '',
                'Gender': u.gender || '',
                'Age': u.age || '',
                'Tier': u.tier || 'free',
                'Monthly Points': u.monthly_points || 0,
                'Successful Days': u.successful_days || 0,
                'Overall Successful Days': u.overall_successful_days || 0,
                'Total Days Logged': u.total_days_logged || 0,
                'Current Streak': streak?.current_streak || 0,
                'Longest Streak': streak?.longest_streak || 0,
                'Consecutive Inactive Days': u.consecutive_inactive_days || 0,
                'Last Active': u.last_active_date || '',
                'Joined': u.created_at ? u.created_at.split('T')[0] : '',
                'Is Minor': u.is_minor ? 'Yes' : 'No',
                'Color Theme': u.color_theme || 'sage',
                'Est. Reward': calcReward(u),
            }
        })

        const worksheet = XLSX.utils.json_to_sheet(rows)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Users')

        // Auto-width columns
        const colWidths = headers.map(h => ({ wch: Math.max(h.length, 12) }))
        worksheet['!cols'] = colWidths

        XLSX.writeFile(workbook, `niyama-users-${new Date().toISOString().split('T')[0]}.xlsx`)
    }

    function isFraudSuspect(user) {
        if ((user.total_days_logged || 0) < 7) return false
        const successRate = (user.overall_successful_days || 0) / (user.total_days_logged || 1)
        return successRate === 1 && (user.total_days_logged || 0) >= 14
    }

    function getStreak(userId) { return streaks.find(s => s.user_id === userId) }

    function calcReward(user) {
        const caps = { free: 5, plus: 10, premium: 20 }
        const streak = getStreak(user.id)
        if ((user.consecutive_inactive_days || 0) >= 5) return '$0.00'
        if ((user.successful_days || 0) < 7) return '$0.00'
        if (streak?.streak_bonus_unlocked && user.tier === 'premium') return '$25.00'
        return `$${Math.min((user.monthly_points || 0) / 1000, caps[user.tier] || 5).toFixed(2)}`
    }

    const s = { background: '#1a1a1a', color: 'white' }
    const card = { background: '#242424', borderRadius: '16px', padding: '24px', marginBottom: '16px' }
    const btn = { fontSize: '13px', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', border: 'none' }
    const input = { background: '#333', color: 'white', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', outline: 'none', border: 'none', width: '100%' }

    if (!authed) {
        return (
            <div style={{ minHeight: '100vh', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
                <div style={{ width: '100%', maxWidth: '360px', background: '#242424', borderRadius: '16px', padding: '32px' }}>
                    <h1 style={{ color: 'white', fontSize: '24px', fontWeight: '700', marginBottom: '6px' }}>Admin Panel</h1>
                    <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '24px' }}>Niyama</p>
                    <input type="password" placeholder="Admin password" value={password}
                        onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}
                        style={{ ...input, marginBottom: '16px' }} />
                    {message && <p style={{ color: '#f87171', fontSize: '13px', marginBottom: '12px' }}>{message}</p>}
                    <button onClick={handleLogin}
                        style={{ ...btn, background: '#5A8A78', color: 'white', width: '100%', padding: '12px', fontSize: '15px', fontWeight: '600' }}>
                        Enter
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div style={{ minHeight: '100vh', background: '#1a1a1a', color: 'white', padding: '32px 16px', maxWidth: '900px', margin: '0 auto' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Admin Panel</h1>
                    <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '2px' }}>{users.length} users total</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => { setShowMetrics(!showMetrics); if (!metrics) fetchMetrics() }}
                        style={{ ...btn, background: showMetrics ? '#5A8A78' : '#333', color: 'white' }}>
                        Metrics
                    </button>
                    <button onClick={() => { fetchMonthlyReport() }}
                        style={{ ...btn, background: showMonthlyReport ? '#5A8A78' : '#333', color: 'white' }}>
                        Monthly report
                    </button>
                    <button onClick={exportCSV}
                        style={{ ...btn, background: '#333', color: '#5A8A78' }}>
                        Export Excel
                    </button>
                    <button onClick={fetchData}
                        style={{ ...btn, background: 'none', color: '#818CF8' }}>
                        Refresh
                    </button>
                    <button onClick={async () => { if (window.confirm('Sign out of admin panel?')) await supabase.auth.signOut() }}
                        style={{ ...btn, background: 'none', color: '#f87171' }}>
                        Sign out
                    </button>
                </div>
            </div>

            {/* Message banner */}
            {message && (
                <div style={{ background: '#1e3a5f', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px' }}>
                    <p style={{ color: '#93c5fd', fontSize: '13px' }}>{message}</p>
                </div>
            )}

            {/* Monthly Report */}
            {showMonthlyReport && monthlyReport && (
                <div style={{ ...card, border: '1px solid #5A8A78' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Monthly report — {monthlyReport.monthName}</h2>
                        <button onClick={() => setShowMonthlyReport(false)} style={{ ...btn, background: '#333', color: '#9CA3AF' }}>✕</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                        {[
                            { label: 'Total users', value: monthlyReport.totalUsers, color: 'white' },
                            { label: 'Active this month', value: monthlyReport.activeUsers, color: '#86efac' },
                            { label: 'Reward eligible', value: monthlyReport.eligibleUsers, color: '#86efac' },
                            { label: 'Est. reward liability', value: `$${monthlyReport.totalRewardLiability}`, color: '#fca5a5' },
                            { label: 'Est. subscription revenue', value: `$${monthlyReport.totalRevenue}`, color: '#86efac' },
                            { label: 'Habit completion rate', value: `${monthlyReport.completionRate}%`, color: 'white' },
                        ].map(stat => (
                            <div key={stat.label} style={{ background: '#333', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                                <p style={{ color: '#9CA3AF', fontSize: '11px', marginBottom: '4px' }}>{stat.label}</p>
                                <p style={{ fontSize: '20px', fontWeight: '700', color: stat.color }}>{stat.value}</p>
                            </div>
                        ))}
                    </div>
                    <div>
                        <p style={{ color: '#9CA3AF', fontSize: '13px', marginBottom: '12px' }}>Habit completion breakdown this month</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {[
                                { label: '🌅 Wake before 7:30 AM', value: monthlyReport.habitBreakdown.wake },
                                { label: '👟 Steps 10,000+', value: monthlyReport.habitBreakdown.steps },
                                { label: '📵 Screen under 2hrs', value: monthlyReport.habitBreakdown.screen },
                                { label: '🌙 Sleep by 10:30 PM', value: monthlyReport.habitBreakdown.sleep },
                            ].map(habit => (
                                <div key={habit.label} style={{ background: '#333', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '12px', color: '#D1D5DB' }}>{habit.label}</span>
                                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#86efac' }}>{habit.value} days</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Metrics */}
            {showMetrics && metrics && (
                <div style={card}>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Key metrics</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                        {[
                            { label: 'Total users', value: metrics.totalUsers, color: 'white' },
                            { label: 'Free users', value: metrics.freeUsers, color: 'white' },
                            { label: 'Paid users', value: metrics.paidUsers, color: '#86efac' },
                        ].map(s => (
                            <div key={s.label} style={{ background: '#333', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                                <p style={{ color: '#9CA3AF', fontSize: '11px', marginBottom: '4px' }}>{s.label}</p>
                                <p style={{ fontSize: '22px', fontWeight: '700', color: s.color }}>{s.value}</p>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[
                            { label: 'Daily active rate', detail: `${metrics.activeToday} of ${metrics.totalUsers} active today`, value: metrics.dailyActiveRate, unit: '%', target: 60, higher: true },
                            { label: 'Habit completion rate', detail: `${metrics.totalSuccessful} successful of ${metrics.totalLogged} logged`, value: metrics.habitCompletionRate, unit: '%', target: 50, higher: true },
                            { label: 'Free to paid conversion', detail: `${metrics.paidUsers} paying of ${metrics.totalUsers} total`, value: metrics.conversionRate, unit: '%', target: 20, higher: true },
                            { label: 'Monthly churn rate', detail: `${metrics.churned || 0} inactive 30+ days`, value: metrics.churnRate, unit: '%', target: 5, higher: false },
                        ].map(m => {
                            const good = m.higher ? m.value >= m.target : m.value <= m.target
                            const mid = m.higher ? m.value >= m.target * 0.6 : m.value <= m.target * 2
                            const color = good ? '#86efac' : mid ? '#fcd34d' : '#fca5a5'
                            return (
                                <div key={m.label} style={{ background: '#333', borderRadius: '10px', padding: '14px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                        <div>
                                            <p style={{ fontSize: '14px', fontWeight: '500', color: 'white' }}>{m.label}</p>
                                            <p style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>{m.detail}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: '20px', fontWeight: '700', color }}>{m.value}{m.unit}</p>
                                            <p style={{ fontSize: '11px', color: '#4B5563' }}>target: {m.higher ? `${m.target}%+` : `under ${m.target}%`}</p>
                                        </div>
                                    </div>
                                    <div style={{ background: '#555', borderRadius: '4px', height: '6px' }}>
                                        <div style={{ background: color, borderRadius: '4px', height: '6px', width: `${Math.min(m.value, 100)}%`, transition: 'width 0.3s' }} />
                                    </div>
                                </div>
                            )
                        })}
                        {/* NPS */}
                        <div style={{ background: '#333', borderRadius: '10px', padding: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: '500', color: 'white' }}>Net Promoter Score</p>
                                    <p style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>Manually entered from feedback form</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '20px', fontWeight: '700', color: (metrics.savedNps || 0) >= 40 ? '#86efac' : (metrics.savedNps || 0) >= 20 ? '#fcd34d' : '#fca5a5' }}>
                                        {metrics.savedNps !== null ? metrics.savedNps : '—'}
                                    </p>
                                    <p style={{ fontSize: '11px', color: '#4B5563' }}>target: 40+</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input type="number" placeholder="Enter NPS (-100 to 100)" value={npsScore}
                                    onChange={e => setNpsScore(e.target.value)} min="-100" max="100"
                                    style={{ ...input, flex: 1 }} />
                                <button onClick={saveNps} disabled={savingNps || !npsScore}
                                    style={{ ...btn, background: '#5A8A78', color: 'white', opacity: (!npsScore || savingNps) ? 0.5 : 1 }}>
                                    {savingNps ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Users list */}
            {loading ? (
                <p style={{ color: '#6B7280' }}>Loading...</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {users.map(user => {
                        const streak = getStreak(user.id)
                        const fraudFlag = isFraudSuspect(user)
                        return (
                            <div key={user.id} style={{ ...card, border: fraudFlag ? '1px solid #ef4444' : '1px solid #333' }}>

                                {/* Fraud flag */}
                                {fraudFlag && (
                                    <div style={{ background: '#450a0a', border: '1px solid #ef4444', borderRadius: '8px', padding: '8px 12px', marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '14px' }}>⚠️</span>
                                        <p style={{ fontSize: '12px', color: '#fca5a5' }}>Fraud flag — 100% success rate over {user.total_days_logged} days. Review manually.</p>
                                    </div>
                                )}

                                {/* User header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div>
                                        <p style={{ fontSize: '17px', fontWeight: '600' }}>{user.full_name || 'No name'}</p>
                                        <p style={{ color: '#6B7280', fontSize: '12px', marginTop: '2px' }}>{user.id}</p>
                                        <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                                            {user.gender && <span style={{ background: '#333', color: '#9CA3AF', fontSize: '11px', padding: '2px 8px', borderRadius: '20px' }}>{user.gender}</span>}
                                            {user.age && <span style={{ background: '#333', color: '#9CA3AF', fontSize: '11px', padding: '2px 8px', borderRadius: '20px' }}>Age {user.age}</span>}
                                            {user.is_minor && <span style={{ background: '#78350f', color: '#fcd34d', fontSize: '11px', padding: '2px 8px', borderRadius: '20px' }}>Minor</span>}
                                            {user.color_theme && <span style={{ background: '#333', color: '#9CA3AF', fontSize: '11px', padding: '2px 8px', borderRadius: '20px', textTransform: 'capitalize' }}>{user.color_theme} theme</span>}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ color: '#86efac', fontWeight: '600', fontSize: '16px' }}>{calcReward(user)}</p>
                                        <p style={{ color: '#6B7280', fontSize: '11px' }}>est. reward</p>
                                    </div>
                                </div>

                                {/* Stats grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
                                    {[
                                        { label: 'Monthly pts', value: user.monthly_points || 0 },
                                        { label: 'Successful days', value: user.successful_days || 0 },
                                        { label: 'Streak', value: streak?.current_streak || 0 },
                                        { label: 'Inactive days', value: user.consecutive_inactive_days || 0, warn: (user.consecutive_inactive_days || 0) >= 5 },
                                    ].map(stat => (
                                        <div key={stat.label} style={{ background: '#333', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                                            <p style={{ color: '#9CA3AF', fontSize: '10px', marginBottom: '2px' }}>{stat.label}</p>
                                            <p style={{ fontSize: '18px', fontWeight: '700', color: stat.warn ? '#fca5a5' : 'white' }}>{stat.value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Tier + last active */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ color: '#9CA3AF', fontSize: '13px' }}>Tier:</span>
                                        <select value={user.tier || 'free'} onChange={e => changeTier(user.id, e.target.value)}
                                            style={{ background: '#333', color: 'white', borderRadius: '6px', padding: '4px 8px', fontSize: '13px', border: 'none', outline: 'none' }}>
                                            <option value="free">Free</option>
                                            <option value="plus">Plus</option>
                                            <option value="premium">Premium</option>
                                        </select>
                                    </div>
                                    <span style={{ color: '#6B7280', fontSize: '12px' }}>Last active: {user.last_active_date || 'Never'}</span>
                                </div>

                                {/* Adjust points */}
                                {adjustUserId === user.id && (
                                    <div style={{ background: '#333', borderRadius: '10px', padding: '14px', marginBottom: '10px' }}>
                                        <p style={{ fontSize: '13px', color: '#D1D5DB', marginBottom: '10px' }}>Adjust points for {user.full_name}</p>
                                        <input type="number" placeholder="Amount (e.g. 500 or -200)" value={adjustAmount}
                                            onChange={e => setAdjustAmount(e.target.value)} style={{ ...input, marginBottom: '8px' }} />
                                        <input type="text" placeholder="Reason (optional)" value={adjustReason}
                                            onChange={e => setAdjustReason(e.target.value)} style={{ ...input, marginBottom: '10px' }} />
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={adjustPoints} style={{ ...btn, flex: 1, background: '#5A8A78', color: 'white' }}>Save</button>
                                            <button onClick={() => setAdjustUserId(null)} style={{ ...btn, flex: 1, background: '#555', color: 'white' }}>Cancel</button>
                                        </div>
                                    </div>
                                )}

                                {/* Message user */}
                                {messageUserId === user.id && (
                                    <div style={{ background: '#333', borderRadius: '10px', padding: '14px', marginBottom: '10px' }}>
                                        <p style={{ fontSize: '13px', color: '#D1D5DB', marginBottom: '10px' }}>Send message to {user.full_name}</p>
                                        <textarea placeholder="Type your message..." value={messageText}
                                            onChange={e => setMessageText(e.target.value)}
                                            style={{ ...input, minHeight: '80px', resize: 'vertical', marginBottom: '10px' }} />
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={sendMessageToUser} disabled={sendingMessage || !messageText.trim()}
                                                style={{ ...btn, flex: 1, background: '#5A8A78', color: 'white', opacity: (!messageText.trim() || sendingMessage) ? 0.5 : 1 }}>
                                                {sendingMessage ? 'Sending...' : 'Send message'}
                                            </button>
                                            <button onClick={() => { setMessageUserId(null); setMessageText('') }}
                                                style={{ ...btn, flex: 1, background: '#555', color: 'white' }}>Cancel</button>
                                        </div>
                                    </div>
                                )}

                                {/* Action buttons */}
                                {adjustUserId !== user.id && messageUserId !== user.id && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                        <button onClick={() => { setAdjustUserId(user.id); setMessage('') }}
                                            style={{ ...btn, background: '#333', color: 'white', textAlign: 'center' }}>
                                            Adjust points
                                        </button>
                                        <button onClick={() => { setMessageUserId(user.id); setMessage('') }}
                                            style={{ ...btn, background: '#1e3a5f', color: '#93c5fd', textAlign: 'center' }}>
                                            Message user
                                        </button>
                                        <button onClick={() => resetMonthlyData(user.id)}
                                            style={{ ...btn, background: '#450a0a', color: '#fca5a5', textAlign: 'center' }}>
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