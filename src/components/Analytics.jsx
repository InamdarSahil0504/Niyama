export default function Analytics({ profile, streak }) {
    const monthlyPoints = profile?.monthly_points || 0
    const successfulDays = profile?.successful_days || 0
    const overallSuccessfulDays = profile?.overall_successful_days || 0
    const totalDaysLogged = profile?.total_days_logged || 0
    const totalHabitsCompleted = profile?.total_habits_completed || 0
    const currentStreak = streak?.current_streak || 0
    const longestStreak = streak?.longest_streak || 0
    const pointsValue = (monthlyPoints / 1000).toFixed(2)

    const completionRate = totalDaysLogged > 0
        ? Math.round((overallSuccessfulDays / totalDaysLogged) * 100)
        : 0

    const monthlyCompletionRate = successfulDays > 0
        ? Math.round((successfulDays / 30) * 100)
        : 0

    const avgHabitsPerDayOverall = totalDaysLogged > 0
        ? (totalHabitsCompleted / totalDaysLogged).toFixed(1)
        : '0.0'

    const avgHabitsPerDayMonthly = successfulDays > 0
        ? ((successfulDays * 4) / 30).toFixed(1)
        : '0.0'

    return (
        <div className="min-h-screen bg-gray-950 text-white px-4 py-8 max-w-lg mx-auto pb-24">

            <h2 className="text-xl font-bold mb-6">Your analytics</h2>

            {/* Monthly Overview */}
            <div className="bg-gray-900 rounded-2xl p-6 mb-4">
                <h3 className="text-gray-400 text-sm font-medium mb-4">This month</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-gray-500 text-xs">Monthly points</p>
                        <p className="text-2xl font-bold mt-1">{monthlyPoints}</p>
                        <p className="text-gray-600 text-xs">max 22,500</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs">Points value</p>
                        <p className="text-2xl font-bold mt-1 text-green-400">${pointsValue}</p>
                        <p className="text-gray-600 text-xs">before cap</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs">Successful days</p>
                        <p className="text-2xl font-bold mt-1">{successfulDays}</p>
                        <p className="text-gray-600 text-xs">this month</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs">Monthly completion</p>
                        <p className="text-2xl font-bold mt-1">{monthlyCompletionRate}%</p>
                        <p className="text-gray-600 text-xs">of 30 days</p>
                    </div>
                </div>
            </div>

            {/* All Time Stats */}
            <div className="bg-gray-900 rounded-2xl p-6 mb-4">
                <h3 className="text-gray-400 text-sm font-medium mb-4">All time</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-gray-500 text-xs">Overall successful days</p>
                        <p className="text-2xl font-bold mt-1">{overallSuccessfulDays}</p>
                        <p className="text-gray-600 text-xs">since joining</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs">Total days logged</p>
                        <p className="text-2xl font-bold mt-1">{totalDaysLogged}</p>
                        <p className="text-gray-600 text-xs">since joining</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs">Overall success rate</p>
                        <p className="text-2xl font-bold mt-1">{completionRate}%</p>
                        <p className="text-gray-600 text-xs">of days logged</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs">Total habits completed</p>
                        <p className="text-2xl font-bold mt-1">{totalHabitsCompleted}</p>
                        <p className="text-gray-600 text-xs">all time</p>
                    </div>
                </div>
            </div>

            {/* Daily Averages */}
            <div className="bg-gray-900 rounded-2xl p-6 mb-4">
                <h3 className="text-gray-400 text-sm font-medium mb-4">Daily averages</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-gray-500 text-xs">Avg habits per day (overall)</p>
                        <p className="text-2xl font-bold mt-1">{avgHabitsPerDayOverall}</p>
                        <p className="text-gray-600 text-xs">out of 4</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs">Avg habits per day (month)</p>
                        <p className="text-2xl font-bold mt-1">{avgHabitsPerDayMonthly}</p>
                        <p className="text-gray-600 text-xs">out of 4</p>
                    </div>
                </div>

                {/* Habit completion bar */}
                <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Overall habit completion rate</span>
                        <span>{totalDaysLogged > 0 ? Math.round((totalHabitsCompleted / (totalDaysLogged * 4)) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                            className="bg-indigo-400 h-2 rounded-full transition-all"
                            style={{ width: `${totalDaysLogged > 0 ? Math.round((totalHabitsCompleted / (totalDaysLogged * 4)) * 100) : 0}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Streak Stats */}
            <div className="bg-gray-900 rounded-2xl p-6 mb-4">
                <h3 className="text-gray-400 text-sm font-medium mb-4">Streak stats</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-gray-500 text-xs">Current streak</p>
                        <p className="text-2xl font-bold mt-1">{currentStreak} days</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs">Longest streak</p>
                        <p className="text-2xl font-bold mt-1">{longestStreak} days</p>
                    </div>
                </div>

                {profile?.tier === 'premium' && (
                    <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Progress to 25-day bonus</span>
                            <span>{currentStreak}/25</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2">
                            <div
                                className="bg-indigo-400 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min((currentStreak / 25) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Eligibility Status */}
            <div className="bg-gray-900 rounded-2xl p-6">
                <h3 className="text-gray-400 text-sm font-medium mb-4">Reward eligibility</h3>
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Minimum 7 successful days</span>
                        <span className={successfulDays >= 7 ? 'text-green-400 text-sm' : 'text-gray-600 text-sm'}>
                            {successfulDays >= 7 ? '✓ Met' : `${7 - successfulDays} remaining`}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">No 5+ consecutive inactive days</span>
                        <span className={
                            (profile?.consecutive_inactive_days || 0) < 5
                                ? 'text-green-400 text-sm'
                                : 'text-red-400 text-sm'
                        }>
                            {(profile?.consecutive_inactive_days || 0) < 5 ? '✓ Met' : '✗ Not met'}
                        </span>
                    </div>
                    {profile?.tier === 'premium' && (
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">25-day streak bonus</span>
                            <span className={streak?.streak_bonus_unlocked ? 'text-indigo-400 text-sm' : 'text-gray-600 text-sm'}>
                                {streak?.streak_bonus_unlocked ? '🏆 Unlocked' : 'Locked'}
                            </span>
                        </div>
                    )}
                </div>
            </div>

        </div>
    )
}