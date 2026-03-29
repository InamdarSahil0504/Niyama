import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import TierSelect from './TierSelect'
import Analytics from './Analytics'
import Rewards from './Rewards'
import Settings from './Settings'
import FounderStory from './FounderStory'
import RulesPage from './RulesPage'
import PersonalDetails from './PersonalDetails'
import Tutorial from './Tutorial'

const HABITS = [
    { key: 'wake_before_8', label: 'Wake before 7:30 AM', points: 100, penalty: 50 },
    { key: 'steps_over_5000', label: 'Steps 10,000 or more', points: 100, penalty: 75 },
    { key: 'sleep_before_1030', label: 'Sleep by 10:30 PM', points: 100, penalty: 50 },
    { key: 'active_heart_rate', label: '30 min active heart rate', points: 100, penalty: 75 },
    { key: 'screen_under_2hrs', label: 'Screen time under 3 hrs', points: 100, penalty: 0, flex: true },
]

const TIER_CAPS = { free: 5, plus: 10, premium: 20 }

function calcLivePoints(habits) {
    let points = 250
    HABITS.forEach(h => { if (habits[h.key]) points += h.points })
    const completedCount = HABITS.filter(h => habits[h.key]).length
    if (completedCount >= 4) points += 100
    return Math.min(points, 750)
}

function calcPoints(habits) {
    let points = 250
    HABITS.forEach(h => {
        if (habits[h.key]) {
            points += h.points
        } else if (!h.flex) {
            points -= h.penalty
        }
    })
    const completedCount = HABITS.filter(h => habits[h.key]).length
    if (completedCount >= 4) points += 100
    return Math.max(Math.min(points, 750), 0)
}

function getMinDays(tier) {
    return tier === 'plus' || tier === 'premium' ? 5 : 7
}

function calcReward(monthlyPoints, tier, streakBonusUnlocked, successfulDays, consecutiveInactiveDays) {
    if (consecutiveInactiveDays >= 5) return '0.00'
    if (successfulDays < getMinDays(tier)) return '0.00'
    if (streakBonusUnlocked && tier === 'premium') return '25.00'
    return Math.min(monthlyPoints / 1000, TIER_CAPS[tier] || 5).toFixed(2)
}

function applyTheme(theme) {
    const root = document.documentElement
    if (theme === 'salmon') {
        root.style.setProperty('--theme-bg', '#F7F4F4')
        root.style.setProperty('--theme-primary', '#D4735F')
        root.style.setProperty('--theme-secondary', '#5A8A78')
        root.style.setProperty('--theme-border', '#E5D9D5')
        root.style.setProperty('--theme-card', '#FFFFFF')
        root.style.setProperty('--theme-primary-light', '#FCEEE9')
        root.style.setProperty('--theme-secondary-light', '#EAF2EE')
    } else {
        root.style.setProperty('--theme-bg', '#F4F7F5')
        root.style.setProperty('--theme-primary', '#5A8A78')
        root.style.setProperty('--theme-secondary', '#D4735F')
        root.style.setProperty('--theme-border', '#D9E5DF')
        root.style.setProperty('--theme-card', '#FFFFFF')
        root.style.setProperty('--theme-primary-light', '#EAF2EE')
        root.style.setProperty('--theme-secondary-light', '#FCEEE9')
    }
}
function Confetti() {
    const pieces = Array.from({ length: 40 }, (_, i) => i)
    const colors = ['#5A8A78', '#D4735F', '#7CB9A8', '#E8907A', '#4A7C65', '#C0614A', '#F4D03F', '#85C1E9']

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
            {pieces.map(i => (
                <div key={i} style={{
                    position: 'absolute',
                    left: `${Math.random() * 100}%`,
                    top: `-${Math.random() * 20}px`,
                    width: `${Math.random() * 8 + 6}px`,
                    height: `${Math.random() * 8 + 6}px`,
                    background: colors[Math.floor(Math.random() * colors.length)],
                    borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                    animation: `confetti-fall ${Math.random() * 2 + 2}s linear ${Math.random() * 1}s forwards`,
                    opacity: 0,
                }} />
            ))}
        </div>
    )
}
export default function Dashboard({ session }) {
    const [profile, setProfile] = useState(null)
    const [streak, setStreak] = useState(null)
    const [todayHabits, setTodayHabits] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(null)
    const [onboardingStep, setOnboardingStep] = useState(null)
    const [isMinor, setIsMinor] = useState(false)
    const [activeTab, setActiveTab] = useState('home')
    const [habits, setHabits] = useState({ wake_before_8: false, screen_under_2hrs: false, steps_over_5000: false, sleep_before_1030: false, active_heart_rate: false })

    const today = new Date().toISOString().split('T')[0]
    const now = new Date()
    const ENFORCE_DEADLINES = false
    const isPastWakeDeadline = ENFORCE_DEADLINES && (now.getHours() > 7 || (now.getHours() === 7 && now.getMinutes() >= 35))
    const isPastSleepDeadline = ENFORCE_DEADLINES && (now.getHours() > 22 || (now.getHours() === 22 && now.getMinutes() >= 35))
    const [showCelebration, setShowCelebration] = useState(false)
    const [lastHabitCount, setLastHabitCount] = useState(0)
    const [showTutorial, setShowTutorial] = useState(false)
    useEffect(() => { fetchData() }, [])

    const completedHabitCount = HABITS.filter(h => habits[h.key] === true).length
    const allFourChecked = completedHabitCount >= 4

    useEffect(() => {
        const count = HABITS.filter(h => habits[h.key]).length
        if (count === 4 && lastHabitCount < 4 && !todayHabits?.submitted) {
            setShowCelebration(true)
            setTimeout(() => setShowCelebration(false), 3500)
        }
        setLastHabitCount(count)
    }, [habits])

    async function fetchData() {
        setLoading(true)
        const userId = session.user.id
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single()
        // Auto-detect and store timezone silently
        const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        const updates = {}
        if (detectedTimezone && profileData?.timezone !== detectedTimezone) updates.timezone = detectedTimezone
        if (session.user.email && profileData?.email !== session.user.email) updates.email = session.user.email
        if (Object.keys(updates).length > 0) {
            await supabase.from('profiles').update(updates).eq('id', userId)
        }
        if (profileData) {
            if (profileData.color_theme) applyTheme(profileData.color_theme)
            if (profileData.is_minor) setIsMinor(true)

            const todayDate = new Date()
            if (profileData.last_active_date) {
                const lastActive = new Date(profileData.last_active_date)
                if (todayDate.getMonth() !== lastActive.getMonth() || todayDate.getFullYear() !== lastActive.getFullYear()) {
                    await supabase.from('profiles').update({ monthly_points: 0, successful_days: 0, consecutive_inactive_days: 0 }).eq('id', userId)
                    await supabase.from('streaks').update({ current_streak: 0, streak_bonus_unlocked: false }).eq('user_id', userId)
                } else {
                    const diffDays = Math.floor((todayDate - lastActive) / (1000 * 60 * 60 * 24))
                    if (diffDays > 0) await supabase.from('profiles').update({ consecutive_inactive_days: Math.min((profileData.consecutive_inactive_days || 0) + diffDays, 99) }).eq('id', userId)
                }
            }

            // Auto-submit yesterday
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)
            const yesterdayStr = yesterday.toISOString().split('T')[0]
            const { data: yHabits } = await supabase.from('habits').select('*').eq('user_id', userId).eq('date', yesterdayStr).single()

            if (yHabits && !yHabits.submitted) {
                const completedYesterday = [yHabits.wake_before_8, yHabits.steps_over_5000, yHabits.screen_under_2hrs, yHabits.sleep_before_1030, yHabits.active_heart_rate || false].filter(Boolean).length
                const daySuccessful = completedYesterday >= 4
                let pts = 250
                if (yHabits.wake_before_8) pts += 100; else pts -= 50
                if (yHabits.steps_over_5000) pts += 100; else pts -= 75
                if (yHabits.screen_under_2hrs) pts += 100
                if (yHabits.sleep_before_1030) pts += 100; else pts -= 50
                if (yHabits.active_heart_rate) pts += 100
                if (completedYesterday >= 4) pts += 100
                pts = Math.min(pts, 750)
                await supabase.from('habits').update({ submitted: true, day_successful: daySuccessful, points_earned: Math.max(pts, 0) }).eq('id', yHabits.id)
            } else if (!yHabits) {
                await supabase.from('habits').insert({ user_id: userId, date: yesterdayStr, wake_before_8: false, steps_over_5000: false, screen_under_2hrs: false, sleep_before_1030: false, day_successful: false, points_earned: 0, submitted: true })
            }
        }

        const { data: updatedProfile } = await supabase.from('profiles').select('*').eq('id', userId).single()
        setProfile(updatedProfile)
        if (updatedProfile && updatedProfile.onboarding_complete && !updatedProfile.tutorial_seen && updatedProfile.total_days_logged === 0) {
            setShowTutorial(true)
        }
        if (updatedProfile && !updatedProfile.onboarding_complete) setOnboardingStep('founder-story')

        const { data: streakData } = await supabase.from('streaks').select('*').eq('user_id', userId).single()
        setStreak(streakData)

        const { data: habitData } = await supabase.from('habits').select('*').eq('user_id', userId).eq('date', today).single()
        if (habitData) {
            setTodayHabits(habitData)
            setHabits({ wake_before_8: habitData.wake_before_8, screen_under_2hrs: habitData.screen_under_2hrs, steps_over_5000: habitData.steps_over_5000, sleep_before_1030: habitData.sleep_before_1030, active_heart_rate: habitData.active_heart_rate || false })
        }

        setLoading(false)
    }

    async function saveDraft() {
        setSaving('draft')
        const userId = session.user.id
        if (todayHabits) {
            await supabase.from('habits').update({ ...habits, submitted: false }).eq('id', todayHabits.id)
        } else {
            await supabase.from('habits').insert({ user_id: userId, date: today, ...habits, day_successful: false, points_earned: 0, submitted: false })
        }
        await fetchData()
        setSaving(null)
    }

    async function saveHabits() {
        setSaving('submit')
        const userId = session.user.id
        const points = calcPoints(habits)
        const daySuccessful = HABITS.filter(h => habits[h.key] === true).length >= 4

        if (todayHabits) {
            await supabase.from('habits').update({ ...habits, day_successful: daySuccessful, points_earned: points, submitted: true }).eq('id', todayHabits.id)
        } else {
            await supabase.from('habits').insert({ user_id: userId, date: today, ...habits, day_successful: daySuccessful, points_earned: points, submitted: true })
        }

        const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
        const { data: monthHabits } = await supabase.from('habits').select('points_earned').eq('user_id', userId).gte('date', currentMonthStart)
        const monthlyPoints = monthHabits.reduce((sum, h) => sum + h.points_earned, 0)
        const { data: successHabits } = await supabase.from('habits').select('day_successful').eq('user_id', userId).eq('day_successful', true).gte('date', currentMonthStart)
        const successfulDays = successHabits.length
        const { data: allHabits } = await supabase.from('habits').select('day_successful, wake_before_8, steps_over_5000, screen_under_2hrs, sleep_before_1030').eq('user_id', userId)
        const overallSuccessfulDays = allHabits.filter(h => h.day_successful).length
        const totalDaysLogged = allHabits.length
        const totalHabitsCompleted = allHabits.reduce((sum, h) => sum + (h.wake_before_8 ? 1 : 0) + (h.steps_over_5000 ? 1 : 0) + (h.screen_under_2hrs ? 1 : 0) + (h.sleep_before_1030 ? 1 : 0) + (h.active_heart_rate ? 1 : 0), 0)

        let newStreak = streak?.current_streak || 0
        let newLongest = streak?.longest_streak || 0
        let newBonus = streak?.streak_bonus_unlocked || false
        if (daySuccessful) { newStreak += 1; if (newStreak > newLongest) newLongest = newStreak; if (newStreak >= 25) newBonus = true } else { newStreak = 0 }

        await supabase.from('streaks').update({ current_streak: newStreak, longest_streak: newLongest, streak_bonus_unlocked: newBonus, updated_at: new Date().toISOString() }).eq('user_id', userId)
        // Track first submission
        const isFirstEver = totalDaysLogged === 1
        const daysToFirst = isFirstEver ? Math.floor((new Date() - new Date(profile.created_at)) / (1000 * 60 * 60 * 24)) : profile.days_to_first_submission

        await supabase.from('profiles').update({
            monthly_points: monthlyPoints,
            successful_days: successfulDays,
            consecutive_inactive_days: 0,
            last_active_date: today,
            overall_successful_days: overallSuccessfulDays,
            total_habits_completed: totalHabitsCompleted,
            total_days_logged: totalDaysLogged,
            ...(isFirstEver && { first_submission_date: today, days_to_first_submission: daysToFirst })
        }).eq('id', userId)

        if (isFirstEver) {
            trackEvent('first_submission', { days_to_first: daysToFirst, points: points, day_successful: daySuccessful })
        }
        trackEvent('habit_submitted', { points, day_successful: daySuccessful, hour: new Date().getHours(), habits_completed: HABITS.filter(h => habits[h.key]).length })

        // Auto-calculate and upsert rewards record
        const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
        const caps = { free: 5, plus: 10, premium: 20 }
        const tierCap = caps[profile?.tier || 'free']
        const potentialReward = monthlyPoints / 1000
        const actualReward = Math.min(potentialReward, tierCap)
        const pointsLeftOnTable = Math.max(potentialReward - tierCap, 0)
        const capUtilisation = tierCap > 0 ? Math.min(Math.round((potentialReward / tierCap) * 100), 100) : 0

        const { data: existingReward } = await supabase.from('rewards').select('id, manual_override').eq('user_id', userId).eq('month', currentMonth).single()

        if (existingReward) {
            if (!existingReward.manual_override) {
                await supabase.from('rewards').update({
                    points_earned: monthlyPoints,
                    reward_value: actualReward,
                    reward_cap: tierCap,
                    reward_potential: potentialReward,
                    points_left_on_table: pointsLeftOnTable,
                    cap_utilisation: capUtilisation,
                }).eq('id', existingReward.id)
            }
        } else {
            await supabase.from('rewards').insert({
                user_id: userId,
                month: currentMonth,
                points_earned: monthlyPoints,
                reward_value: actualReward,
                reward_cap: tierCap,
                reward_potential: potentialReward,
                points_left_on_table: pointsLeftOnTable,
                cap_utilisation: capUtilisation,
            })
        }

        await fetchData()
        setSaving(null)
    }

    async function signOut() { await supabase.auth.signOut() }
    async function trackEvent(eventType, eventData = {}) {
        try {
            await supabase.from('app_events').insert({
                user_id: session.user.id,
                event_type: eventType,
                event_data: { ...eventData, timestamp: new Date().toISOString(), hour: new Date().getHours() }
            })
        } catch (e) { }
    }
    if (loading) return (
        <div style={{ minHeight: '100vh', background: 'var(--theme-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: '32px', height: '32px', border: '3px solid var(--theme-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }}></div>
                <p style={{ fontSize: '14px', color: 'var(--theme-text-secondary)' }}>Loading your data...</p>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
    )

    // Onboarding
    if (onboardingStep === 'founder-story') return <FounderStory onContinue={() => setOnboardingStep('rules')} />
    if (onboardingStep === 'rules') return <RulesPage onContinue={async () => { await supabase.from('profiles').update({ rules_acknowledged: true }).eq('id', session.user.id); setOnboardingStep('personal-details') }} />
    if (onboardingStep === 'personal-details') return <PersonalDetails userId={session.user.id} onContinue={async (minor, theme) => { setIsMinor(minor); applyTheme(theme); setOnboardingStep('tier-select') }} />
    if (onboardingStep === 'tier-select') return <TierSelect userId={session.user.id} onComplete={async (tier) => { setProfile(prev => ({ ...prev, tier, tier_chosen: true })); await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', session.user.id); setOnboardingStep(null) }} />
    if (!profile?.tier_chosen) return <TierSelect userId={session.user.id} onComplete={(tier) => setProfile({ ...profile, tier, tier_chosen: true })} />

    const successfulDays = profile?.successful_days || 0
    const todayPoints = calcLivePoints(habits)
    const reward = isMinor ? '0.00' : calcReward(profile?.monthly_points || 0, profile?.tier || 'free', streak?.streak_bonus_unlocked || false, successfulDays, profile?.consecutive_inactive_days || 0)
    const tierCap = streak?.streak_bonus_unlocked && profile?.tier === 'premium' ? 25 : TIER_CAPS[profile?.tier || 'free']
    const remaining = Math.max(tierCap - parseFloat(reward), 0).toFixed(2)
    const isInactive = (profile?.consecutive_inactive_days || 0) >= 5
    const minDays = getMinDays(profile?.tier)
    const isEligible = successfulDays >= minDays && !isInactive
    const noneSelected = !Object.values(habits).some(v => v === true)
    const isFirstTimeUser = profile?.total_days_logged === 0 && !todayHabits?.submitted
    const tierLabel = profile?.tier === 'free' ? 'Basic' : profile?.tier ? profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1) : 'Basic'

    const NavIcon = ({ tab }) => {
        const icons = {
            home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
            analytics: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
            rewards: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7',
        }
        return <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[tab]} /></svg>
    }

    async function completeTutorial() {
        setShowTutorial(false)
        await supabase.from('profiles').update({ tutorial_seen: true }).eq('id', session.user.id)
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--theme-bg)' }}>
            {showCelebration && <Confetti />}
            {showTutorial && <Tutorial profile={profile} onComplete={completeTutorial} />}
            <div style={{ maxWidth: '448px', margin: '0 auto', padding: '32px 16px 96px' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--theme-text)' }}>Niyama</h1>
                        <p style={{ fontSize: '14px', color: 'var(--theme-text-secondary)', marginTop: '2px' }}>Hey, {profile?.full_name?.split(' ')[0] || 'there'} 👋</p>
                    </div>
                    <span style={{ background: 'var(--theme-primary)', color: 'white', fontSize: '12px', fontWeight: '500', padding: '4px 12px', borderRadius: '20px', textTransform: 'capitalize' }}>{tierLabel}</span>
                </div>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '12px', fontWeight: '500', padding: '4px 12px', borderRadius: '20px' }}>Beta testing version</span>
                </div>

                {activeTab === 'home' && (
                    <>
                        {/* Empty state for new users */}
                        {isFirstTimeUser && (
                            <div data-tutorial="streak" style={{ background: 'var(--theme-primary)', borderRadius: '16px', padding: '20px', marginBottom: '16px', color: 'white' }}>                                <p style={{ fontSize: '22px', marginBottom: '8px' }}>👋</p>
                                <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
                                    Welcome, {profile?.full_name?.split(' ')[0] || 'there'}!
                                </h2>
                                <p style={{ fontSize: '14px', opacity: '0.9', lineHeight: '1.6', marginBottom: '16px' }}>
                                    You're all set up. Today is day one of your Niyama journey. Start by checking off the habits you've completed below and submit your results before midnight.
                                </p>
                                <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '12px' }}>
                                    <p style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Your first day checklist:</p>
                                    {[
                                        'Check off each habit you completed today',
                                        'Tap "Submit today" before midnight',
                                        'Come back tomorrow and do it again',
                                    ].map((step, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: i < 2 ? '6px' : '0' }}>
                                            <span style={{ opacity: '0.8', fontSize: '13px' }}>{i + 1}.</span>
                                            <p style={{ fontSize: '13px', opacity: '0.9' }}>{step}</p>
                                        </div>
                                    ))}
                                </div>
                                <p style={{ fontSize: '12px', opacity: '0.7', marginTop: '12px', textAlign: 'center' }}>
                                    Need help? Go to Settings → Getting started
                                </p>
                            </div>
                        )}

                        {/* Streak Banner — hidden for first time users */}
                        {!isFirstTimeUser && (
                            <div style={{ background: 'var(--theme-primary)', borderRadius: '16px', padding: '20px', marginBottom: '16px', color: 'white' }}>

                                {/* Flame and streak count */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{
                                            fontSize: streak?.current_streak >= 25 ? '48px' : streak?.current_streak >= 10 ? '40px' : streak?.current_streak >= 5 ? '34px' : '28px',
                                            animation: streak?.current_streak > 0 ? 'flame-pulse 1.5s ease-in-out infinite' : 'none',
                                            display: 'block',
                                            lineHeight: 1,
                                        }}>
                                            🔥
                                        </span>
                                        <div>
                                            <p style={{ fontSize: '13px', opacity: '0.8', marginBottom: '2px' }}>Current streak</p>
                                            <p style={{ fontSize: '32px', fontWeight: '700', lineHeight: 1 }}>{streak?.current_streak || 0} <span style={{ fontSize: '16px', opacity: '0.8' }}>days</span></p>
                                        </div>
                                    </div>
                                    {profile?.tier === 'premium' && (
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: '12px', opacity: '0.8' }}>25 day goal</p>
                                            <p style={{ fontSize: '14px', marginTop: '4px', fontWeight: '600' }}>{streak?.current_streak || 0}/25</p>
                                        </div>
                                    )}
                                </div>

                                {/* Last 7 days dots */}
                                <div style={{ marginBottom: profile?.tier === 'premium' ? '12px' : '0' }}>
                                    <p style={{ fontSize: '11px', opacity: '0.7', marginBottom: '8px' }}>Last 7 days</p>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        {Array.from({ length: 7 }, (_, i) => {
                                            const dayOffset = 6 - i
                                            const isToday = dayOffset === 0
                                            const streakCount = streak?.current_streak || 0
                                            const wasSuccess = dayOffset < streakCount
                                            const isPast = !isToday

                                            return (
                                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                    <div style={{
                                                        width: '100%',
                                                        aspectRatio: '1',
                                                        borderRadius: '50%',
                                                        background: isToday
                                                            ? allFourChecked ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)'
                                                            : wasSuccess ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.2)',
                                                        border: isToday ? '2px solid rgba(255,255,255,0.8)' : 'none',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        animation: wasSuccess || (isToday && allFourChecked) ? `dot-pop 0.3s ease-out ${i * 0.05}s both` : 'none',
                                                    }}>
                                                        {(wasSuccess || (isToday && allFourChecked)) && (
                                                            <span style={{ fontSize: '10px' }}>✓</span>
                                                        )}
                                                    </div>
                                                    <p style={{ fontSize: '9px', opacity: '0.7', textAlign: 'center' }}>
                                                        {isToday ? 'Today' : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][(new Date().getDay() + 6 - dayOffset) % 7]}
                                                    </p>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Premium 25 day progress bar */}
                                {profile?.tier === 'premium' && (
                                    <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: '4px', height: '6px' }}>
                                        <div style={{ background: 'white', borderRadius: '4px', height: '6px', width: `${Math.min((streak?.current_streak || 0) / 25 * 100, 100)}%`, transition: 'width 0.5s ease' }} />
                                    </div>
                                )}

                                {/* Streak milestone messages */}
                                {streak?.current_streak >= 25 && profile?.tier === 'premium' && (
                                    <div style={{ marginTop: '10px', background: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                                        <p style={{ fontSize: '13px', fontWeight: '600' }}>🏆 25-day streak achieved! $25 bonus unlocked!</p>
                                    </div>
                                )}
                                {streak?.current_streak >= 10 && streak?.current_streak < 25 && (
                                    <div style={{ marginTop: '10px', background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                                        <p style={{ fontSize: '12px', opacity: '0.9' }}>🌟 {streak?.current_streak} day streak! You're on fire!</p>
                                    </div>
                                )}
                                {streak?.current_streak >= 3 && streak?.current_streak < 10 && (
                                    <div style={{ marginTop: '10px', background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                                        <p style={{ fontSize: '12px', opacity: '0.9' }}>💪 {streak?.current_streak} days strong! Keep going!</p>
                                    </div>
                                )}

                            </div>
                        )}

                        {/* Reward eligibility */}
                        <div data-tutorial="eligibility" style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <p style={{ fontSize: '13px', color: 'var(--theme-text-secondary)' }}>Progress to reward eligibility</p>
                                <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--theme-primary)' }}>{successfulDays}/{getMinDays(profile?.tier)}</p>
                            </div>
                            <div style={{ background: 'var(--theme-primary-light)', borderRadius: '4px', height: '8px' }}>
                                <div style={{ background: 'var(--theme-primary)', borderRadius: '4px', height: '8px', width: `${Math.min(successfulDays / getMinDays(profile?.tier) * 100, 100)}%`, transition: 'width 0.3s' }} />
                            </div>
                            {isEligible ? (
                                <div style={{ marginTop: '8px' }}>
                                    <p style={{ fontSize: '12px', color: 'var(--theme-primary)' }}>✓ Eligible for rewards this month</p>
                                    <p style={{ fontSize: '12px', color: 'var(--theme-primary)', marginTop: '2px' }}>🎉 Congratulations! Keep going!</p>
                                </div>
                            ) : (
                                <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)', marginTop: '6px' }}>{minDays - successfulDays} more successful {minDays - successfulDays === 1 ? 'day' : 'days'} needed</p>
                            )}
                        </div>

                        {/* Habits */}
                        <div data-tutorial="habits" style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '17px', fontWeight: '600', color: 'var(--theme-text)', marginBottom: '4px' }}>Today's habits</h2>
                            <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)', marginBottom: '4px' }}>Base: 250 pts · Perfect day: 750 pts</p>
                            <p style={{ fontSize: '11px', color: 'var(--theme-text-muted)', marginBottom: '16px' }}>Complete any 4 of 5 habits for a successful day</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {HABITS.map(habit => (
                                    <label key={habit.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <input type="checkbox" checked={habits[habit.key]}
                                                onChange={e => {
                                                    if (todayHabits?.submitted) return
                                                    if (habit.key === 'wake_before_8' && isPastWakeDeadline) return
                                                    if (habit.key === 'sleep_before_1030' && isPastSleepDeadline) return
                                                    setHabits({ ...habits, [habit.key]: e.target.checked })
                                                }}
                                                disabled={!!todayHabits?.submitted || (habit.key === 'wake_before_8' && isPastWakeDeadline) || (habit.key === 'sleep_before_1030' && isPastSleepDeadline)}
                                                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--theme-primary)' }}
                                            />
                                            <div>
                                                <span style={{ fontSize: '14px', color: habits[habit.key] ? 'var(--theme-text)' : 'var(--theme-text-muted)' }}>{habit.label}</span>
                                                {habit.flex && (
                                                    <span style={{ fontSize: '10px', background: 'var(--theme-secondary-light)', color: 'var(--theme-secondary)', padding: '1px 6px', borderRadius: '8px', marginLeft: '6px', fontWeight: '500' }}>flex</span>
                                                )}
                                            </div>
                                        </div>
                                        <span style={{ fontSize: '12px', flexShrink: '0' }}>
                                            <span style={{ color: 'var(--theme-primary)', fontWeight: '500' }}>+{habit.points}</span>
                                            {!habit.flex && (
                                                <>
                                                    <span style={{ color: 'var(--theme-text-muted)' }}> / </span>
                                                    <span style={{ color: 'var(--theme-secondary)', fontWeight: '500' }}>-{habit.penalty}</span>
                                                </>
                                            )}
                                        </span>
                                    </label>
                                ))}
                            </div>

                            {/* Points bar */}
                            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--theme-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '13px', color: 'var(--theme-text-secondary)' }}>Today's points</span>
                                    <span style={{ fontSize: '22px', fontWeight: '700', color: 'var(--theme-text)' }}>{todayPoints}</span>
                                </div>
                                <div style={{ background: 'var(--theme-primary-light)', borderRadius: '4px', height: '8px' }}>
                                    <div style={{ background: 'var(--theme-primary)', borderRadius: '4px', height: '8px', width: `${(todayPoints / 750) * 100}%`, transition: 'width 0.3s' }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                    <span style={{ fontSize: '11px', color: 'var(--theme-text-muted)' }}>0</span>
                                    <span style={{ fontSize: '11px', color: 'var(--theme-text-muted)' }}>750 max</span>
                                </div>
                            </div>
                            {allFourChecked && !todayHabits?.submitted && (
                                <div style={{
                                    marginTop: '16px',
                                    background: 'var(--theme-primary-light)',
                                    border: '2px solid var(--theme-primary)',
                                    borderRadius: '12px',
                                    padding: '14px',
                                    textAlign: 'center',
                                    animation: 'bounce-in 0.4s ease-out, card-glow 1.5s ease-in-out 0.4s',
                                }}>
                                    <p style={{ fontSize: '22px', animation: 'checkmark-pulse 0.6s ease-in-out', marginBottom: '4px' }}>✅</p>
                                    <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--theme-primary)' }}>
                                        {completedHabitCount === 5 ? 'All 5 habits completed!' : '4 habits completed!'}
                                    </p>
                                    <p style={{ fontSize: '12px', color: 'var(--theme-text-secondary)', marginTop: '4px' }}>Amazing work today. Don't forget to submit!</p>
                                </div>
                            )}
                            {todayHabits?.submitted ? (
                                <div style={{ marginTop: '16px', background: 'var(--theme-primary-light)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                                    <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--theme-primary)' }}>✓ Submitted for today</p>
                                </div>
                            ) : (
                                <>
                                    {noneSelected && (
                                        <div style={{ marginTop: '12px', background: 'var(--theme-primary-light)', borderRadius: '8px', padding: '12px' }}>
                                            <p style={{ fontSize: '12px', color: 'var(--theme-primary)', textAlign: 'center', lineHeight: '1.5' }}>
                                                Even if you haven't completed any habits today, please submit your results so we can track your progress.
                                            </p>
                                        </div>
                                    )}
                                    <div style={{ borderLeft: '4px solid var(--theme-primary)', background: 'var(--theme-primary-light)', borderRadius: '0 8px 8px 0', padding: '10px 12px', marginTop: '12px' }}>
                                        <p style={{ fontSize: '12px', color: 'var(--theme-text)', lineHeight: '1.5' }}>
                                            ✏️ <strong>Heads up!</strong> Once submitted, today's log is final. Review before submitting.
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                        <button onClick={saveDraft} disabled={!!saving}
                                            style={{ flex: '1', background: 'var(--theme-primary-light)', border: '1px solid var(--theme-border)', color: 'var(--theme-primary)', fontWeight: '600', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
                                            {saving === 'draft' ? 'Saving...' : 'Save habits'}
                                        </button>
                                        <button onClick={saveHabits} disabled={!!saving}
                                            style={{ flex: '1', background: 'var(--theme-secondary)', color: 'white', fontWeight: '600', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
                                            {saving === 'submit' ? 'Submitting...' : 'Submit today'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Stats grid */}
                        <div data-tutorial="stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                            {isFirstTimeUser ? (
                                <>
                                    {[
                                        { label: 'Monthly points', empty: 'Submit your first day to start earning points' },
                                        { label: 'Successful days', empty: 'Complete all 4 habits for a successful day' },
                                        { label: 'Overall successful', empty: 'Your all-time record will appear here' },
                                        { label: 'Days logged', empty: 'Each day you submit will be counted here' },
                                    ].map(stat => (
                                        <div key={stat.label} style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '16px', padding: '16px' }}>
                                            <p style={{ fontSize: '12px', color: 'var(--theme-text-secondary)', marginBottom: '8px' }}>{stat.label}</p>
                                            <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)', lineHeight: '1.5', fontStyle: 'italic' }}>{stat.empty}</p>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <>
                                    {[
                                        { label: 'Monthly points', value: profile?.monthly_points || 0, sub: 'max 22,500' },
                                        { label: 'Successful days', value: successfulDays, sub: 'this month' },
                                        { label: 'Overall successful', value: profile?.overall_successful_days || 0, sub: 'all time' },
                                        { label: 'Days logged', value: profile?.total_days_logged || 0, sub: 'all time' },
                                    ].map(stat => (
                                        <div key={stat.label} style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '16px', padding: '16px' }}>
                                            <p style={{ fontSize: '12px', color: 'var(--theme-text-secondary)', marginBottom: '4px' }}>{stat.label}</p>
                                            <p style={{ fontSize: '26px', fontWeight: '700', color: 'var(--theme-text)' }}>{stat.value}</p>
                                            <p style={{ fontSize: '11px', color: 'var(--theme-text-muted)', marginTop: '2px' }}>{stat.sub}</p>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>

                        {/* Rewards summary */}
                        <div data-tutorial="rewards-summary" style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '16px', padding: '20px' }}>
                            <h2 style={{ fontSize: '17px', fontWeight: '600', color: 'var(--theme-text)', marginBottom: '16px' }}>Rewards</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {[
                                    { label: 'Estimated reward', value: `$${reward}`, valueColor: 'var(--theme-primary)' },
                                    { label: 'Reward cap', value: `$${tierCap}.00`, valueColor: 'var(--theme-text)' },
                                    { label: 'Remaining cap', value: `$${remaining}`, valueColor: 'var(--theme-text)' },
                                ].map(item => (
                                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '14px', color: 'var(--theme-text-secondary)' }}>{item.label}</span>
                                        <span style={{ fontSize: '16px', fontWeight: '600', color: item.valueColor }}>{item.value}</span>
                                    </div>
                                ))}
                            </div>
                            {isMinor && <div style={{ background: 'var(--theme-primary-light)', borderRadius: '8px', padding: '10px', marginTop: '12px' }}><p style={{ fontSize: '13px', textAlign: 'center', color: 'var(--theme-primary)' }}>Rewards available when you turn 18</p></div>}
                            {!isMinor && isInactive && <div style={{ background: '#fef2f2', borderRadius: '8px', padding: '10px', marginTop: '12px' }}><p style={{ fontSize: '13px', textAlign: 'center', color: '#dc2626' }}>⚠️ Ineligible — more than 5 consecutive inactive days</p></div>}
                            {streak?.streak_bonus_unlocked && profile?.tier === 'premium' && <div style={{ background: 'var(--theme-secondary-light)', borderRadius: '8px', padding: '10px', marginTop: '12px' }}><p style={{ fontSize: '13px', textAlign: 'center', color: 'var(--theme-secondary)', fontWeight: '500' }}>🏆 25-day streak bonus unlocked! Reward: $25</p></div>}
                        </div>
                    </>
                )}

                {activeTab === 'analytics' && <Analytics profile={profile} streak={streak} />}
                {activeTab === 'rewards' && <Rewards profile={profile} />}
                {activeTab === 'settings' && <Settings profile={profile} session={session} onSignOut={signOut} onReplayTutorial={() => { setShowTutorial(true); setActiveTab('home') }} />}

            </div>

            {/* Bottom nav */}
            <div data-tutorial="bottom-nav" style={{ position: 'fixed', bottom: '0', left: '0', right: '0', background: 'var(--theme-card)', borderTop: '1px solid var(--theme-border)' }}>
                <div style={{ maxWidth: '448px', margin: '0 auto', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '10px 0 6px' }}>
                    {[
                        { key: 'home', label: 'Home' },
                        { key: 'analytics', label: 'Analytics' },
                        { key: 'rewards', label: 'Rewards' },
                        { key: 'settings', label: 'Settings' },
                    ].map(tab => (
                        <button key={tab.key} onClick={() => { setActiveTab(tab.key); trackEvent('page_visit', { page: tab.key }) }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '4px 16px', background: 'none', border: 'none', cursor: 'pointer', color: activeTab === tab.key ? 'var(--theme-primary)' : 'var(--theme-text-muted)' }}>
                            {tab.key === 'settings' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            ) : (
                                <NavIcon tab={tab.key} />
                            )}
                            <span style={{ fontSize: '11px' }}>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
    )
}