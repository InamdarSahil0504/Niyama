import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const HABITS = [
    { key: 'wake_before_8', label: 'Wake before 8 AM', points: 100, penalty: 50 },
    { key: 'steps_over_5000', label: 'Steps 5,000 or more', points: 100, penalty: 75 },
    { key: 'screen_under_2hrs', label: 'Screen time under 2 hrs', points: 100, penalty: 75 },
    { key: 'sleep_before_1030', label: 'Sleep before 10:30 PM', points: 100, penalty: 50 },
]

const TIER_CAPS = { free: 5, plus: 10, premium: 20 }

// Shows live points during the day (no deductions, just base + completions)
function calcLivePoints(habits) {
    let points = 250
    HABITS.forEach(habit => {
        if (habits[habit.key]) points += habit.points
    })
    const allCompleted = HABITS.every(h => habits[h.key])
    if (allCompleted) points += 100
    return points
}

// Final score saved at end of day (includes deductions)
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
    const [streak, setStreak] = useState(null)
    const [todayHabits, setTodayHabits] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
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
            const todayStr = todayDate.toISOString().split('T')[0]
            const currentMonth = todayDate.getMonth()
            const currentYear = todayDate.getFullYear()

            // Check if it's a new month and reset if so
            if (profileData.last_active_date) {
                const lastActive = new Date(profileData.last_active_date)
                const lastMonth = lastActive.getMonth()
                const lastYear = lastActive.getFullYear()

                if (currentMonth !== lastMonth || currentYear !== lastYear) {
                    // It's a new month — reset monthly data
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
                            updated_at: new Date().toISOString(),
                        })
                        .eq('user_id', userId)

                    await supabase
                        .from('habits')
                        .delete()
                        .eq('user_id', userId)
                } else {
                    // Same month — check for inactivity
                    const lastActiveDate = new Date(profileData.last_active_date)
                    const diffTime = todayDate - lastActiveDate
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

                    if (diffDays > 0) {
                        const newInactiveDays = (profileData.consecutive_inactive_days || 0) + diffDays
                        await supabase
                            .from('profiles')
                            .update({
                                consecutive_inactive_days: Math.min(newInactiveDays, 99),
                            })
                            .eq('id', userId)
                    }
                }
            }
        }

        // Refetch updated profile
        const { data: updatedProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
        setProfile(updatedProfile)

        const { data: streakData } = await supabase
            .from('streaks')
            .select('*')
            .eq('user_id', userId)
            .single()
        setStreak(streakData)

        const { data: habitData } = await supabase
            .from('habits')
            .select('*')
            .eq('user_id', userId)
            .eq('date', today)
            .single()

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

    async function saveHabits() {
        setSaving(true)
        const userId = session.user.id
        const points = calcPoints(habits)
        const daySuccessful = HABITS.every(h => habits[h.key] === true)

        // Save or update today's habits
        if (todayHabits) {
            await supabase
                .from('habits')
                .update({
                    ...habits,
                    day_successful: daySuccessful,
                    points_earned: points,
                })
                .eq('id', todayHabits.id)
        } else {
            await supabase
                .from('habits')
                .insert({
                    user_id: userId,
                    date: today,
                    ...habits,
                    day_successful: daySuccessful,
                    points_earned: points,
                })
        }

        // Recalculate monthly points from all habit logs
        const { data: allHabits } = await supabase
            .from('habits')
            .select('points_earned')
            .eq('user_id', userId)

        const monthlyPoints = allHabits.reduce((sum, h) => sum + h.points_earned, 0)

        // Count all successful days this month
        const { data: successfulHabits } = await supabase
            .from('habits')
            .select('day_successful')
            .eq('user_id', userId)
            .eq('day_successful', true)

        const successfulDays = successfulHabits.length

        // Update streak
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

        await supabase
            .from('streaks')
            .update({
                current_streak: newStreak,
                longest_streak: newLongest,
                streak_bonus_unlocked: newStreakBonus,
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)

        await supabase
            .from('profiles')
            .update({
                monthly_points: monthlyPoints,
                successful_days: successfulDays,
                consecutive_inactive_days: 0,
                last_active_date: today,
            })
            .eq('id', userId)

        await fetchData()
        setSaving(false)
    }

    async function signOut() {
        await supabase.auth.signOut()
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950">
            <p className="text-white">Loading...</p>
        </div>
    )

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
        ? 25
        : TIER_CAPS[profile?.tier || 'free']
    const remaining = Math.max(tierCap - parseFloat(reward), 0).toFixed(2)
    const isInactive = (profile?.consecutive_inactive_days || 0) >= 5
    const isEligible = successfulDays >= 7 && !isInactive

    return (
        <div className="min-h-screen bg-gray-950 text-white px-4 py-8 max-w-lg mx-auto">

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Niyama</h1>
                    <p className="text-gray-400 text-sm">Hey, {profile?.full_name || 'there'} 👋</p>
                </div>
                <button
                    onClick={signOut}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                >
                    Sign out
                </button>
            </div>

            {/* Streak Banner */}
            <div className="bg-indigo-900 rounded-2xl p-4 mb-6">
                <div className="flex justify-between items-center mb-3">
                    <div>
                        <p className="text-indigo-300 text-sm">Current streak</p>
                        <p className="text-3xl font-bold">{streak?.current_streak || 0} days</p>
                    </div>
                    <div className="text-right">
                        <p className="text-indigo-300 text-sm">25 day goal</p>
                        <p className="text-indigo-400 text-sm mt-1">
                            {streak?.current_streak || 0}/25
                        </p>
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
                    <p className="text-green-400 text-xs mt-2">
                        ✓ Eligible for rewards this month
                    </p>
                )}
            </div>

            {/* Habits */}
            <div className="bg-gray-900 rounded-2xl p-6 mb-6">
                <h2 className="text-lg font-semibold mb-1">Today's habits</h2>
                <p className="text-gray-500 text-xs mb-4">Base: 250 pts · Perfect day: 750 pts</p>
                <div className="space-y-3">
                    {HABITS.map(habit => (
                        <label
                            key={habit.key}
                            className="flex items-center justify-between cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={habits[habit.key]}
                                    onChange={e => !todayHabits && setHabits({ ...habits, [habit.key]: e.target.checked })}
                                    disabled={!!todayHabits}
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

                {todayHabits ? (
                    <div className="w-full mt-4 bg-gray-800 text-gray-500 font-semibold py-3 rounded-lg text-center text-sm">
                        ✓ Submitted for today
                    </div>
                ) : (
                    <>
                        <button
                            onClick={saveHabits}
                            disabled={saving}
                            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg transition"
                        >
                            {saving ? 'Saving...' : "Save today's habits"}
                        </button>
                        <p className="text-gray-600 text-xs text-center mt-2">
                            Note: No changes can be made once submitted
                        </p>
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
                    <div className="flex justify-between">
                        <span className="text-gray-400">Your tier</span>
                        <span className="capitalize font-semibold">{profile?.tier || 'free'}</span>
                    </div>
                </div>

                {/* Status messages */}
                {isInactive && (
                    <div className="bg-red-900 rounded-lg p-3 mt-4">
                        <p className="text-red-300 text-sm text-center">
                            ⚠️ Ineligible — more than 5 consecutive inactive days
                        </p>
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
                        <p className="text-indigo-300 text-sm text-center">
                            🏆 25-day streak bonus unlocked! Reward: $25
                        </p>
                    </div>
                )}
            </div>

        </div>
    )
}