export default function RulesPage({ onContinue, showButton = true }) {
    return (
        <div className="min-h-screen bg-gray-950 text-white px-4 py-10 max-w-lg mx-auto pb-24">

            {/* Beta banner — only shown during onboarding */}
            {showButton && (
                <div className="text-center mb-6">
                    <span className="bg-amber-900 text-amber-300 text-xs font-medium px-3 py-1 rounded-full">
                        Beta testing version
                    </span>
                </div>
            )}

            <h1 className="text-2xl font-bold mb-6">How Niyama works</h1>

            {/* Daily habits */}
            <div className="bg-gray-900 rounded-2xl p-6 mb-4">
                <h2 className="text-lg font-semibold mb-4">Your 4 daily habits</h2>
                <div className="space-y-3 text-sm">
                    {[
                        { habit: 'Wake before 7:30 AM', complete: '+100 pts', incomplete: '-50 pts' },
                        { habit: 'Steps 10,000 or more', complete: '+100 pts', incomplete: '-75 pts' },
                        { habit: 'Screen time under 2 hrs', complete: '+100 pts', incomplete: '-75 pts' },
                        { habit: 'Sleep by 10:30 PM', complete: '+100 pts', incomplete: '-50 pts' },
                    ].map(item => (
                        <div key={item.habit} className="flex justify-between items-center">
                            <span className="text-gray-300">{item.habit}</span>
                            <div className="flex gap-2 text-xs">
                                <span className="text-green-400">{item.complete}</span>
                                <span className="text-gray-600">/</span>
                                <span className="text-red-400">{item.incomplete}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Points system */}
            <div className="bg-gray-900 rounded-2xl p-6 mb-4">
                <h2 className="text-lg font-semibold mb-4">Points system</h2>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-400">Base points per day</span>
                        <span className="font-medium">250 pts</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Per habit completed</span>
                        <span className="text-green-400 font-medium">+100 pts</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">All 4 habits completed bonus</span>
                        <span className="text-green-400 font-medium">+100 pts</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Perfect day total</span>
                        <span className="font-medium">750 pts</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Worst day total</span>
                        <span className="font-medium">0 pts</span>
                    </div>
                    <div className="border-t border-gray-800 pt-3 flex justify-between">
                        <span className="text-gray-400">Points to money</span>
                        <span className="text-green-400 font-medium">1,000 pts = $1.00</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Maximum monthly points</span>
                        <span className="font-medium">22,500 pts = $22.50</span>
                    </div>
                </div>
            </div>

            {/* Reward eligibility */}
            <div className="bg-gray-900 rounded-2xl p-6 mb-4">
                <h2 className="text-lg font-semibold mb-4">Reward eligibility rules</h2>
                <div className="space-y-3 text-sm text-gray-400">
                    <div className="flex gap-3">
                        <span className="text-indigo-400 font-bold">1.</span>
                        <p>You must complete a minimum of <span className="text-white font-medium">7 successful days</span> in the month to qualify for any reward. A successful day means all 4 habits are completed.</p>
                    </div>
                    <div className="flex gap-3">
                        <span className="text-indigo-400 font-bold">2.</span>
                        <p>You cannot be inactive for more than <span className="text-white font-medium">5 consecutive calendar days</span>. Inactive means no habit logging or app activity. Exceeding this disqualifies you from rewards for that month.</p>
                    </div>
                    <div className="flex gap-3">
                        <span className="text-indigo-400 font-bold">3.</span>
                        <p>Your reward is calculated as <span className="text-white font-medium">min(points value, tier cap)</span>. Points value = monthly points divided by 1,000.</p>
                    </div>
                    <div className="flex gap-3">
                        <span className="text-indigo-400 font-bold">4.</span>
                        <p>Rewards reset at the start of every month. Points do not carry over.</p>
                    </div>
                    <div className="flex gap-3">
                        <span className="text-indigo-400 font-bold">5.</span>
                        <p>Premium users who achieve a <span className="text-white font-medium">25-day continuous streak</span> of successful days receive a flat <span className="text-white font-medium">$25 payout</span> — overriding the normal $20 cap.</p>
                    </div>
                </div>
            </div>

            {/* Honor system */}
            <div className="bg-red-950 border border-red-800 rounded-2xl p-6 mb-6">
                <h2 className="text-lg font-semibold mb-3 text-red-300">Honor system & fair play</h2>
                <div className="space-y-3 text-sm text-red-200">
                    <p>Niyama currently operates on an <span className="font-medium text-white">honor system</span>. All habit logging is self-reported and trust-based.</p>
                    <p>Users who are found to be <span className="font-medium text-white">fraudulently reporting habits</span> to game the reward system will be <span className="font-medium text-white">permanently disqualified</span> from rewards and may have their account suspended.</p>
                    <p>Niyama reserves the right to <span className="font-medium text-white">audit user behaviour</span> and revoke reward eligibility at any time.</p>
                    <p>This system works because of the integrity of its users. Please be honest — not for Niyama, but for yourself.</p>
                </div>
            </div>

            {showButton && (
                <button
                    onClick={onContinue}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg transition"
                >
                    I understand
                </button>
            )}

        </div>
    )
}