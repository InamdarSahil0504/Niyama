export default function Analytics({ profile, streak }) {
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

    return (
        <div style={{ minHeight: '100vh', background: 'var(--theme-bg)' }} className="px-4 py-8 max-w-lg mx-auto pb-24">

            <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '24px' }}>Your analytics</h2>

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
                        { label: 'Minimum 7 successful days', met: successfulDays >= 7, text: successfulDays >= 7 ? '✓ Met' : `${7 - successfulDays} remaining` },
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