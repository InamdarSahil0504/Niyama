import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import TierSelect from './TierSelect'
import Analytics from './Analytics'
import Rewards from './Rewards'
import Settings from './Settings'
import FounderStory from './FounderStory'
import RulesPage from './RulesPage'
import TierDetails from './TierDetails'
const HABITS = [
    { key: 'wake_before_8', label: 'Wake before 7:30 AM', points: 100, penalty: 50 },
    { key: 'steps_over_5000', label: 'Steps 10,000 or more', points: 100, penalty: 75 },
    { key: 'screen_under_2hrs', label: 'Screen time under 2 hrs', points: 100, penalty: 75 },
    { key: 'sleep_before_1030', label: 'Sleep by 10:30 PM', points: 100, penalty: 50 },
]

const TIER_CAPS = { free: 5, plus: 10, premium: 20 }

function calcLivePoints(habits) {
    let points = 250
    HABITS.forEach(habit => {
        if (habits[habit.key]) points += habit.points
    })
    const allCompleted = HABITS.every(h => habits[h.key])
    if (allCompleted) points += 100
    return points
}

function calcPoints(habits) {
    let points = 250
    let allCompleted = true
    HABITS.forEach(habit => {
        if (habits[habit.key]) {
            points += habit.points
        } else {
            points -= habit.penalty
            allCompleted = false
        }
    })
    if (allCompleted) points += 100
    return Math.max(points, 0)
}

function calcReward(monthlyPoints, tier, streakBonusUnlocked, successfulDays, consecutiveInactiveDays) {
    if (consecutiveInactiveDays >= 5) return '0.00'
    if (successfulDays < 7) return '0.00'
    if (streakBonusUnlocked && tier === 'premium') return '25.00'
    const pointsValue = monthlyPoints / 1000
    const cap = TIER_CAPS[tier]
    return Math.min(pointsValue, cap).toFixed(2)
}

export default function Dashboard({ session }) {
    const [profile, setProfile] = useState(null)
    const [onboardingStep, setOnboardingStep] = useState(null)
    const [streak, setStreak] = useState(null)
    const [todayHabits, setTodayHabits] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(null)
    const [tierSelected, setTierSelected] = useState(false)
    const [activeTab, setActiveTab] = useState('home')
    const [habits, setHabits] = useState({
        wake_before_8: false,
        screen_under_2hrs: false,
        steps_over_5000: false,
        sleep_before_1030: false,
    })

    const today = new Date().toISOString().split('T')[0]

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        setLoading(true)
        const userId = session.user.id

        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (profileData) {
            const todayDate = new Date()
            const currentMonth = todayDate.getMonth()
            const currentYear = todayDate.getFullYear()

            if (profileData.last_active_date) {
                const lastActive = new Date(profileData.last_active_date)
                const lastMonth = lastActive.getMonth()
                const lastYear = lastActive.getFullYear()

                if (currentMonth !== lastMonth || currentYear !== lastYear) {
                    await supabase.from('profiles').update({
                        monthly_points: 0,
                        successful_days: 0,
                        consecutive_inactive_days: 0,
                    }).eq('id', userId)

                    await supabase.from('streaks').update({
                        current_streak: 0,
                        streak_bonus_unlocked: false,
                        updated_at: new Date().toISOString(),
                    }).eq('user_id', userId)

                    await supabase.from('habits').delete().eq('user_id', userId)
                } else {
                    const lastActiveDate = new Date(profileData.last_active_date)
                    const diffDays = Math.floor((todayDate - lastActiveDate) / (1000 * 60 * 60 * 24))
                    if (diffDays > 0) {
                        await supabase.from('profiles').update({
                            consecutive_inactive_days: Math.min((profileData.consecutive_inactive_days || 0) + diffDays, 99),
                        }).eq('id', userId)
                    }
                }
            }
        }

        const { data: updatedProfile } = await supabase
            .from('profiles').select('*').eq('id', userId).single()
        setProfile(updatedProfile)
        // Check if onboarding is needed
        if (updatedProfile && !updatedProfile.onboarding_complete) {
            setOnboardingStep('founder-story')
        }
        const { data: streakData } = await supabase
            .from('streaks').select('*').eq('user_id', userId).single()
        setStreak(streakData)

        const { data: habitData } = await supabase
            .from('habits').select('*').eq('user_id', userId).eq('date', today).single()

        if (habitData) {
            setTodayHabits(habitData)
            setHabits({
                wake_before_8: habitData.wake_before_8,
                screen_under_2hrs: habitData.screen_under_2hrs,
                steps_over_5000: habitData.steps_over_5000,
                sleep_before_1030: habitData.sleep_before_1030,
            })
        }

        setLoading(false)
    }
    async function saveDraft() {
        setSaving('draft')
        const userId = session.user.id

        if (todayHabits) {
            await supabase
                .from('habits')
                .update({
                    ...habits,
                    day_successful: false,
                    points_earned: 0,
                    submitted: false,
                })
                .eq('id', todayHabits.id)
        } else {
            await supabase
                .from('habits')
                .insert({
                    user_id: userId,
                    date: today,
                    ...habits,
                    day_successful: false,
                    points_earned: 0,
                    submitted: false,
                })
        }

        await fetchData()
        setSaving(null)
    }
    async function saveHabits() {
        setSaving(true)
        const userId = session.user.id
        const points = calcPoints(habits)
        const daySuccessful = HABITS.every(h => habits[h.key] === true)

        if (todayHabits) {
            await supabase.from('habits').update({
                ...habits, day_successful: daySuccessful, points_earned: points, submitted: true,
            }).eq('id', todayHabits.id)
        } else {
            await supabase.from('habits').insert({
                user_id: userId, date: today, ...habits,
                day_successful: daySuccessful, points_earned: points, submitted: true,
            })
        }

        const { data: allHabits } = await supabase
            .from('habits').select('points_earned').eq('user_id', userId)
        const monthlyPoints = allHabits.reduce((sum, h) => sum + h.points_earned, 0)

        const { data: successfulHabits } = await supabase
            .from('habits').select('day_successful').eq('user_id', userId).eq('day_successful', true)
        const successfulDays = successfulHabits.length

        let newStreak = streak.current_streak
        let newLongest = streak.longest_streak
        let newStreakBonus = streak.streak_bonus_unlocked

        if (daySuccessful) {
            newStreak += 1
            if (newStreak > newLongest) newLongest = newStreak
            if (newStreak >= 25) newStreakBonus = true
        } else {
            newStreak = 0
        }

        await supabase.from('streaks').update({
            current_streak: newStreak,
            longest_streak: newLongest,
            streak_bonus_unlocked: newStreakBonus,
            updated_at: new Date().toISOString(),
        }).eq('user_id', userId)

        await supabase.from('profiles').update({
            monthly_points: monthlyPoints,
            successful_days: successfulDays,
            consecutive_inactive_days: 0,
            last_active_date: today,
        }).eq('id', userId)

        await fetchData()
        setSaving(null)
    }

    async function signOut() {
        await supabase.auth.signOut()
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950">
            <p className="text-white">Loading...</p>
        </div>
    )

    // Onboarding flow for new users
    if (onboardingStep === 'founder-story') {
        return <FounderStory onContinue={() => setOnboardingStep('rules')} />
    }

    if (onboardingStep === 'rules') {
        return (
            <RulesPage onContinue={async () => {
                await supabase.from('profiles').update({ rules_acknowledged: true }).eq('id', session.user.id)
                setOnboardingStep('tier-details')
            }} />
        )
    }

    if (onboardingStep === 'tier-details') {
        return (
            <TierDetails onContinue={async () => {
                await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', session.user.id)
                setOnboardingStep(null)
            }} />
        )
    }

    if (!profile?.tier_chosen) {
        return (
            <TierSelect
                userId={session.user.id}
                onComplete={(tier) => {
                    setProfile({ ...profile, tier, tier_chosen: true })
                    setTierSelected(true)
                }}
            />
        )
    }

    const todayPoints = calcLivePoints(habits)
    const successfulDays = profile?.successful_days || 0
    const reward = calcReward(
        profile?.monthly_points || 0,
        profile?.tier || 'free',
        streak?.streak_bonus_unlocked || false,
        successfulDays,
        profile?.consecutive_inactive_days || 0
    )
    const tierCap = streak?.streak_bonus_unlocked && profile?.tier === 'premium'
        ? 25 : TIER_CAPS[profile?.tier || 'free']
    const remaining = Math.max(tierCap - parseFloat(reward), 0).toFixed(2)
    const isInactive = (profile?.consecutive_inactive_days || 0) >= 5
    const isEligible = successfulDays >= 7 && !isInactive
    const tierLabel = profile?.tier
        ? profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)
        : 'Free'

    return (
        <div className="bg-gray-950 min-h-screen text-white">
            <div className="max-w-lg mx-auto px-4 py-8 pb-24">

                {/* Header */}
                <div className="flex justify-between items-center mb-2">
                    <div>
                        <h1 className="text-2xl font-bold">Niyama</h1>
                        <p className="text-gray-400 text-sm">Hey, {profile?.full_name || 'there'} 👋</p>
                    </div>
                    <span className="bg-indigo-900 text-indigo-300 text-xs font-medium px-3 py-1 rounded-full">
                        {tierLabel}
                    </span>
                </div>
                <div className="text-center mb-6">
                    <span className="bg-amber-900 text-amber-300 text-xs font-medium px-3 py-1 rounded-full">
                        Beta testing version
                    </span>
                </div>

                {/* Tab Content */}
                {activeTab === 'home' && (
                    <>
                        {/* Streak Banner */}
                        <div className="bg-indigo-900 rounded-2xl p-4 mb-6">
                            <div className="flex justify-between items-center mb-3">
                                <div>
                                    <p className="text-indigo-300 text-sm">Current streak</p>
                                    <p className="text-3xl font-bold">{streak?.current_streak || 0} days</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-indigo-300 text-sm">25 day goal</p>
                                    <p className="text-indigo-400 text-sm mt-1">{streak?.current_streak || 0}/25</p>
                                </div>
                            </div>
                            <div className="w-full bg-indigo-800 rounded-full h-2">
                                <div
                                    className="bg-indigo-400 h-2 rounded-full transition-all"
                                    style={{ width: `${Math.min((streak?.current_streak || 0) / 25 * 100, 100)}%` }}
                                />
                            </div>
                        </div>

                        {/* Progress toward 7 successful days */}
                        <div className="bg-gray-900 rounded-2xl p-4 mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-gray-400 text-sm">Progress to reward eligibility</p>
                                <p className="text-sm font-semibold">{successfulDays}/7 days</p>
                            </div>
                            <div className="w-full bg-gray-800 rounded-full h-2">
                                <div
                                    className="bg-green-500 h-2 rounded-full transition-all"
                                    style={{ width: `${Math.min(successfulDays / 7 * 100, 100)}%` }}
                                />
                            </div>
                            {isEligible && (
                                <p className="text-green-400 text-xs mt-2">✓ Eligible for rewards this month</p>
                            )}
                        </div>

                        {/* Habits */}
                        <div className="bg-gray-900 rounded-2xl p-6 mb-6">
                            <h2 className="text-lg font-semibold mb-1">Today's habits</h2>
                            <p className="text-gray-500 text-xs mb-4">Base: 250 pts · Perfect day: 750 pts</p>
                            <div className="space-y-3">
                                {HABITS.map(habit => (
                                    <label key={habit.key} className="flex items-center justify-between cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={habits[habit.key]}
                                                onChange={e => !todayHabits?.submitted && setHabits({ ...habits, [habit.key]: e.target.checked })}
                                                disabled={!!todayHabits?.submitted}
                                                className="w-5 h-5 rounded accent-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                            <span className={habits[habit.key] ? 'text-white' : 'text-gray-400'}>
                                                {habit.label}
                                            </span>
                                        </div>
                                        <span className="text-xs">
                                            <span className="text-green-400">+{habit.points}</span>
                                            <span className="text-gray-600"> / </span>
                                            <span className="text-red-400">-{habit.penalty}</span>
                                        </span>
                                    </label>
                                ))}
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-800">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-gray-400 text-sm">Today's points</span>
                                    <span className="text-xl font-bold">{todayPoints}</span>
                                </div>
                                <div className="w-full bg-gray-800 rounded-full h-2">
                                    <div
                                        className="bg-indigo-400 h-2 rounded-full transition-all"
                                        style={{ width: `${(todayPoints / 750) * 100}%` }}
                                    />
                                </div>
                                <div className="flex justify-between mt-1">
                                    <span className="text-gray-600 text-xs">0</span>
                                    <span className="text-gray-600 text-xs">750 max</span>
                                </div>
                            </div>

                            {todayHabits?.submitted ? (
                                <div className="w-full mt-4 bg-gray-800 text-gray-500 font-semibold py-3 rounded-lg text-center text-sm">
                                    ✓ Submitted for today
                                </div>
                            ) : (
                                <>
                                    <div className="flex gap-2 mt-4">
                                        <button
                                            onClick={saveDraft}
                                            disabled={saving}
                                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition text-sm"
                                        >
                                            {saving === 'draft' ? 'Saving...' : 'Save habits'}
                                        </button>
                                        <button
                                            onClick={saveHabits}
                                            disabled={saving}
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg transition text-sm"
                                        >
                                            {saving === 'submit' ? 'Submitting...' : "Submit today's habits"}
                                        </button>
                                    </div>
                                    <div className="border-l-4 border-indigo-500 bg-gray-800 rounded-r-lg p-3 mt-3">
                                        <p className="text-slate-300 text-xs leading-relaxed">
                                            ✏️ <span className="text-white font-medium">Heads up!</span> Once submitted, today's log is final. Review before submitting.
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Points Summary */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-gray-900 rounded-2xl p-4">
                                <p className="text-gray-400 text-sm">Monthly points</p>
                                <p className="text-2xl font-bold mt-1">{profile?.monthly_points || 0}</p>
                                <p className="text-gray-600 text-xs mt-1">max 22,500</p>
                            </div>
                            <div className="bg-gray-900 rounded-2xl p-4">
                                <p className="text-gray-400 text-sm">Successful days</p>
                                <p className="text-2xl font-bold mt-1">{successfulDays}</p>
                                <p className="text-gray-600 text-xs mt-1">this month</p>
                            </div>
                        </div>

                        {/* Rewards */}
                        <div className="bg-gray-900 rounded-2xl p-6">
                            <h2 className="text-lg font-semibold mb-4">Rewards</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Estimated reward</span>
                                    <span className="text-green-400 font-semibold">${reward}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Reward cap</span>
                                    <span className="font-semibold">${tierCap}.00</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Remaining cap</span>
                                    <span className="font-semibold">${remaining}</span>
                                </div>
                            </div>
                            {isInactive && (
                                <div className="bg-red-900 rounded-lg p-3 mt-4">
                                    <p className="text-red-300 text-sm text-center">⚠️ Ineligible — more than 5 consecutive inactive days</p>
                                </div>
                            )}
                            {!isInactive && successfulDays < 7 && (
                                <div className="bg-gray-800 rounded-lg p-3 mt-4">
                                    <p className="text-gray-400 text-sm text-center">
                                        {7 - successfulDays} more successful {7 - successfulDays === 1 ? 'day' : 'days'} needed to qualify
                                    </p>
                                </div>
                            )}
                            {streak?.streak_bonus_unlocked && profile?.tier === 'premium' && (
                                <div className="bg-indigo-900 rounded-lg p-3 mt-4">
                                    <p className="text-indigo-300 text-sm text-center">🏆 25-day streak bonus unlocked! Reward: $25</p>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'analytics' && (
                    <Analytics profile={profile} streak={streak} />
                )}

                {activeTab === 'rewards' && (
                    <Rewards profile={profile} />
                )}

                {activeTab === 'settings' && (
                    <Settings
                        profile={profile}
                        session={session}
                        onSignOut={signOut}
                    />
                )}

            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700">
                <div className="max-w-lg mx-auto flex justify-around items-center py-3">

                    <button
                        onClick={() => setActiveTab('home')}
                        className={`flex flex-col items-center gap-1 px-4 py-1 rounded-lg transition ${activeTab === 'home' ? 'text-indigo-400' : 'text-white'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span className="text-xs">Home</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`flex flex-col items-center gap-1 px-4 py-1 rounded-lg transition ${activeTab === 'analytics' ? 'text-indigo-400' : 'text-white'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="text-xs">Analytics</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('rewards')}
                        className={`flex flex-col items-center gap-1 px-4 py-1 rounded-lg transition ${activeTab === 'rewards' ? 'text-indigo-400' : 'text-white'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                        </svg>
                        <span className="text-xs">Rewards</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex flex-col items-center gap-1 px-4 py-1 rounded-lg transition ${activeTab === 'settings' ? 'text-indigo-400' : 'text-white'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-xs">Settings</span>
                    </button>

                </div>
            </div>

        </div>
    )
}