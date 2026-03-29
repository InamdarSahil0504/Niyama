import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Analytics({ profile, streak }) {
    const [habitHistory, setHabitHistory] = useState([])
    const [selectedDay, setSelectedDay] = useState(null)
    const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date())
    const [loadingHistory, setLoadingHistory] = useState(true)

    const monthlyPoints = profile?.monthly_points || 0
    const successfulDays = profile?.successful_days || 0
    const overallSuccessfulDays = profile?.overall_successful_days || 0
    const totalDaysLogged = profile?.total_days_logged || 0
    const totalHabitsCompleted = profile?.total_habits_completed || 0
    const currentStreak = streak?.current_streak || 0
    const longestStreak = streak?.longest_streak || 0
    const pointsValue = (monthlyPoints / 1000).toFixed(2)
    const completionRate = totalDaysLogged > 0 ? Math.round((overallSuccessfulDays / totalDaysLogged) * 100) : 0
    const monthlyCompletionRate = Math.round((successfulDays / 30) * 100)
    const avgHabitsPerDayOverall = totalDaysLogged > 0 ? (totalHabitsCompleted / totalDaysLogged).toFixed(1) : '0.0'
    const overallHabitRate = totalDaysLogged > 0 ? Math.round((totalHabitsCompleted / (totalDaysLogged * 4)) * 100) : 0

    const joinDate = profile?.created_at ? new Date(profile.created_at) : new Date()

    useEffect(() => {
        if (profile?.id) fetchHabitHistory()
    }, [profile])

    async function fetchHabitHistory() {
        setLoadingHistory(true)
        const { data } = await supabase
            .from('habits')
            .select('*')
            .eq('user_id', profile.id)
            .order('date', { ascending: true })
        setHabitHistory(data || [])
        setLoadingHistory(false)
    }

    function getHabitForDate(dateStr) {
        return habitHistory.find(h => h.date === dateStr)
    }

    function getDayColor(dateStr) {
        const today = new Date().toISOString().split('T')[0]
        if (dateStr > today) return 'future'
        const habit = getHabitForDate(dateStr)
        if (!habit) return 'none'
        if (habit.day_successful) return 'success'
        const completedCount = [habit.wake_before_8, habit.steps_over_5000, habit.screen_under_2hrs, habit.sleep_before_1030].filter(Boolean).length
        if (completedCount > 0) return 'partial'
        return 'none'
    }

    function getDayStyle(color) {
        switch (color) {
            case 'success': return { background: 'var(--theme-primary)', color: 'white' }
            case 'partial': return { background: 'var(--theme-secondary)', color: 'white' }
            case 'none': return { background: '#E5E7EB', color: '#9CA3AF' }
            case 'future': return { background: 'transparent', color: '#D1D5DB', border: '1px solid #E5E7EB' }
            default: return { background: 'transparent' }
        }
    }

    function getCalendarDays(year, month) {
        const firstDay = new Date(year, month, 1).getDay()
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const days = []
        for (let i = 0; i < firstDay; i++) days.push(null)
        for (let d = 1; d <= daysInMonth; d++) days.push(d)
        return days
    }

    function canGoBack() {
        const prev = new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() - 1, 1)
        return prev >= new Date(joinDate.getFullYear(), joinDate.getMonth(), 1)
    }

    function canGoForward() {
        const next = new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() + 1, 1)
        const now = new Date()
        return next <= new Date(now.getFullYear(), now.getMonth(), 1)
    }

    const card = { background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '16px', padding: '24px', marginBottom: '16px' }
    const sectionTitle = { fontSize: '12px', fontWeight: '600', color: 'var(--theme-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }
    const statLabel = { fontSize: '12px', color: 'var(--theme-text-secondary)', marginBottom: '4px' }
    const statVal = { fontSize: '28px', fontWeight: '700', color: 'var(--theme-text)' }
    const statSub = { fontSize: '11px', color: 'var(--theme-text-muted)', marginTop: '2px' }

    function ProgressBar({ value, max = 100 }) {
        return (
            <div style={{ background: 'var(--theme-primary-light)', borderRadius: '4px', height: '8px', marginTop: '6px' }}>
                <div style={{ background: 'var(--theme-primary)', borderRadius: '4px', height: '8px', width: `${Math.min((value / max) * 100, 100)}%`, transition: 'width 0.3s' }} />
            </div>
        )
    }

    const calYear = currentCalendarMonth.getFullYear()
    const calMonth = currentCalendarMonth.getMonth()
    const calDays = getCalendarDays(calYear, calMonth)
    const monthName = currentCalendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    return (
        <div style={{ minHeight: '100vh', background: 'var(--theme-bg)' }} className="px-4 py-8 max-w-lg mx-auto pb-24">

            <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '24px' }}>Your analytics</h2>

            {/* Habit History Calendar */}
            <div style={card}>
                <p style={sectionTitle}>Habit history</p>

                {/* Month navigation */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <button
                        onClick={() => canGoBack() && setCurrentCalendarMonth(new Date(calYear, calMonth - 1, 1))}
                        style={{ background: canGoBack() ? 'var(--theme-primary-light)' : 'transparent', border: '1px solid var(--theme-border)', borderRadius: '8px', padding: '6px 12px', fontSize: '14px', color: canGoBack() ? 'var(--theme-primary)' : 'var(--theme-text-muted)', cursor: canGoBack() ? 'pointer' : 'default' }}>
                        ←
                    </button>
                    <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--theme-text)' }}>{monthName}</p>
                    <button
                        onClick={() => canGoForward() && setCurrentCalendarMonth(new Date(calYear, calMonth + 1, 1))}
                        style={{ background: canGoForward() ? 'var(--theme-primary-light)' : 'transparent', border: '1px solid var(--theme-border)', borderRadius: '8px', padding: '6px 12px', fontSize: '14px', color: canGoForward() ? 'var(--theme-primary)' : 'var(--theme-text-muted)', cursor: canGoForward() ? 'pointer' : 'default' }}>
                        →
                    </button>
                </div>

                {/* Day labels */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
                    {dayLabels.map(d => (
                        <div key={d} style={{ textAlign: 'center', fontSize: '10px', color: 'var(--theme-text-muted)', fontWeight: '500', padding: '2px 0' }}>{d}</div>
                    ))}
                </div>

                {/* Calendar grid */}
                {loadingHistory ? (
                    <div style={{ textAlign: 'center', padding: '24px' }}>
                        <p style={{ fontSize: '13px', color: 'var(--theme-text-muted)' }}>Loading history...</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                        {calDays.map((day, i) => {
                            if (!day) return <div key={`empty-${i}`} />
                            const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                            const color = getDayColor(dateStr)
                            const dayStyle = getDayStyle(color)
                            const today = new Date().toISOString().split('T')[0]
                            const isToday = dateStr === today
                            const isBeforeJoin = new Date(dateStr) < new Date(joinDate.toISOString().split('T')[0])

                            return (
                                <button
                                    key={day}
                                    onClick={() => {
                                        if (color !== 'future' && !isBeforeJoin && color !== 'none') {
                                            const habit = getHabitForDate(dateStr)
                                            if (habit) setSelectedDay({ date: dateStr, habit })
                                        }
                                    }}
                                    style={{
                                        ...dayStyle,
                                        borderRadius: '8px',
                                        padding: '6px 2px',
                                        fontSize: '12px',
                                        fontWeight: isToday ? '700' : '400',
                                        cursor: color !== 'future' && !isBeforeJoin && color !== 'none' ? 'pointer' : 'default',
                                        outline: isToday ? '2px solid var(--theme-primary)' : 'none',
                                        outlineOffset: '1px',
                                        opacity: isBeforeJoin ? 0.3 : 1,
                                        border: dayStyle.border || 'none',
                                        textAlign: 'center',
                                    }}
                                >
                                    {day}
                                </button>
                            )
                        })}
                    </div>
                )}

                {/* Legend */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
                    {[
                        { color: 'var(--theme-primary)', label: 'All 4 habits' },
                        { color: 'var(--theme-secondary)', label: 'Some habits' },
                        { color: '#E5E7EB', label: 'No habits' },
                    ].map(item => (
                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: item.color, flexShrink: '0' }} />
                            <span style={{ fontSize: '11px', color: 'var(--theme-text-secondary)' }}>{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Day detail popup */}
            {selectedDay && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 16px 32px' }}
                    onClick={() => setSelectedDay(null)}>
                    <div style={{ background: 'var(--theme-card)', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '448px' }}
                        onClick={e => e.stopPropagation()}>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--theme-text)' }}>
                                {new Date(selectedDay.date + 'T12:00:00').toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </p>
                            <button onClick={() => setSelectedDay(null)}
                                style={{ background: 'var(--theme-bg)', border: '1px solid var(--theme-border)', borderRadius: '8px', padding: '4px 10px', fontSize: '13px', color: 'var(--theme-text-secondary)', cursor: 'pointer' }}>
                                ✕
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                            {[
                                { key: 'wake_before_8', label: '🌅 Wake before 7:30 AM' },
                                { key: 'steps_over_5000', label: '👟 Steps 10,000 or more' },
                                { key: 'screen_under_2hrs', label: '📵 Screen time under 2 hrs' },
                                { key: 'sleep_before_1030', label: '🌙 Sleep by 10:30 PM' },
                            ].map(habit => {
                                const completed = selectedDay.habit[habit.key]
                                return (
                                    <div key={habit.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '10px', background: completed ? 'var(--theme-primary-light)' : 'var(--theme-bg)', border: '1px solid var(--theme-border)' }}>
                                        <span style={{ fontSize: '13px', color: 'var(--theme-text)' }}>{habit.label}</span>
                                        <span style={{ fontSize: '16px' }}>{completed ? '✅' : '❌'}</span>
                                    </div>
                                )
                            })}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '10px', background: selectedDay.habit.day_successful ? 'var(--theme-primary)' : 'var(--theme-bg)', border: '1px solid var(--theme-border)' }}>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: selectedDay.habit.day_successful ? 'white' : 'var(--theme-text)' }}>
                                {selectedDay.habit.day_successful ? '🏆 Successful day!' : 'Partial day'}
                            </span>
                            <span style={{ fontSize: '14px', fontWeight: '700', color: selectedDay.habit.day_successful ? 'white' : 'var(--theme-primary)' }}>
                                {selectedDay.habit.points_earned} pts
                            </span>
                        </div>

                    </div>
                </div>
            )}

            {/* This month */}
            <div style={card}>
                <p style={sectionTitle}>This month</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div><p style={statLabel}>Monthly points</p><p style={statVal}>{monthlyPoints}</p><p style={statSub}>max 22,500</p></div>
                    <div><p style={statLabel}>Points value</p><p style={{ ...statVal, color: 'var(--theme-primary)' }}>${pointsValue}</p><p style={statSub}>before cap</p></div>
                    <div><p style={statLabel}>Successful days</p><p style={statVal}>{successfulDays}</p><p style={statSub}>this month</p></div>
                    <div><p style={statLabel}>Monthly completion</p><p style={statVal}>{monthlyCompletionRate}%</p><p style={statSub}>of 30 days</p></div>
                </div>
            </div>

            {/* All time */}
            <div style={card}>
                <p style={sectionTitle}>All time</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div><p style={statLabel}>Overall successful days</p><p style={statVal}>{overallSuccessfulDays}</p><p style={statSub}>since joining</p></div>
                    <div><p style={statLabel}>Total days logged</p><p style={statVal}>{totalDaysLogged}</p><p style={statSub}>since joining</p></div>
                    <div><p style={statLabel}>Overall success rate</p><p style={statVal}>{completionRate}%</p><p style={statSub}>of days logged</p></div>
                    <div><p style={statLabel}>Total habits completed</p><p style={statVal}>{totalHabitsCompleted}</p><p style={statSub}>all time</p></div>
                </div>
            </div>

            {/* Daily averages */}
            <div style={card}>
                <p style={sectionTitle}>Daily averages</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div><p style={statLabel}>Avg habits per day</p><p style={statVal}>{avgHabitsPerDayOverall}</p><p style={statSub}>out of 4</p></div>
                    <div><p style={statLabel}>Overall habit rate</p><p style={statVal}>{overallHabitRate}%</p><p style={statSub}>of possible habits</p></div>
                </div>
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ color: 'var(--theme-text-secondary)' }}>Overall habit completion</span>
                        <span style={{ color: 'var(--theme-primary)', fontWeight: '500' }}>{overallHabitRate}%</span>
                    </div>
                    <ProgressBar value={overallHabitRate} />
                </div>
            </div>

            {/* Streak stats */}
            <div style={card}>
                <p style={sectionTitle}>Streak stats</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: profile?.tier === 'premium' ? '20px' : '0' }}>
                    <div><p style={statLabel}>Current streak</p><p style={statVal}>{currentStreak} 🔥</p><p style={statSub}>days</p></div>
                    <div><p style={statLabel}>Longest streak</p><p style={statVal}>{longestStreak}</p><p style={statSub}>days</p></div>
                </div>
                {profile?.tier === 'premium' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: 'var(--theme-text-secondary)' }}>Progress to 25-day bonus</span>
                            <span style={{ color: 'var(--theme-primary)', fontWeight: '500' }}>{currentStreak}/25</span>
                        </div>
                        <ProgressBar value={currentStreak} max={25} />
                    </div>
                )}
            </div>

            {/* Reward eligibility */}
            <div style={card}>
                <p style={sectionTitle}>Reward eligibility</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                        { label: `Minimum ${profile?.tier === 'plus' || profile?.tier === 'premium' ? 5 : 7} successful days`, met: successfulDays >= (profile?.tier === 'plus' || profile?.tier === 'premium' ? 5 : 7), text: successfulDays >= (profile?.tier === 'plus' || profile?.tier === 'premium' ? 5 : 7) ? '✓ Met' : `${(profile?.tier === 'plus' || profile?.tier === 'premium' ? 5 : 7) - successfulDays} remaining` },
                        { label: 'No 5+ consecutive inactive days', met: (profile?.consecutive_inactive_days || 0) < 5, text: (profile?.consecutive_inactive_days || 0) < 5 ? '✓ Met' : '✗ Not met' },
                    ].map(item => (
                        <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', color: 'var(--theme-text-secondary)' }}>{item.label}</span>
                            <span style={{ fontSize: '13px', fontWeight: '500', color: item.met ? 'var(--theme-primary)' : '#dc2626' }}>{item.text}</span>
                        </div>
                    ))}
                    {profile?.tier === 'premium' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', color: 'var(--theme-text-secondary)' }}>25-day streak bonus</span>
                            <span style={{ fontSize: '13px', fontWeight: '500', color: streak?.streak_bonus_unlocked ? 'var(--theme-secondary)' : 'var(--theme-text-muted)' }}>
                                {streak?.streak_bonus_unlocked ? '🏆 Unlocked' : 'Locked'}
                            </span>
                        </div>
                    )}
                </div>
            </div>

        </div>
    )
}