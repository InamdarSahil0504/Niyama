export default function TierDetails({ onContinue, showButton = true }) {
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

            <h1 className="text-2xl font-bold mb-6">Subscription tiers</h1>

            {/* Tier cards */}
            <div className="space-y-4 mb-6">

                {/* Free */}
                <div className="bg-gray-900 rounded-2xl p-6">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <h2 className="text-lg font-semibold">Free</h2>
                            <p className="text-gray-500 text-sm">Get started with habit tracking</p>
                        </div>
                        <span className="text-2xl font-bold">$0</span>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Monthly reward cap</span>
                            <span className="text-green-400 font-medium">$5.00</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Habit tracking</span>
                            <span className="text-white">✓ All 4 habits</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Streak tracking</span>
                            <span className="text-white">✓ Included</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">25-day streak bonus</span>
                            <span className="text-gray-600">✗ Not available</span>
                        </div>
                    </div>
                </div>

                {/* Plus */}
                <div className="bg-gray-900 rounded-2xl p-6 border border-indigo-700">
                    <div className="bg-indigo-900 text-indigo-300 text-xs px-2 py-0.5 rounded-full inline-block mb-3">Popular</div>
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <h2 className="text-lg font-semibold">Plus</h2>
                            <p className="text-gray-500 text-sm">Double your reward potential</p>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-bold">$4.99</span>
                            <p className="text-gray-500 text-xs">/month</p>
                        </div>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Monthly reward cap</span>
                            <span className="text-green-400 font-medium">$10.00</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Habit tracking</span>
                            <span className="text-white">✓ All 4 habits</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Streak tracking</span>
                            <span className="text-white">✓ Included</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">25-day streak bonus</span>
                            <span className="text-gray-600">✗ Not available</span>
                        </div>
                    </div>
                </div>

                {/* Premium */}
                <div className="bg-gray-900 rounded-2xl p-6 border border-amber-700">
                    <div className="bg-amber-900 text-amber-300 text-xs px-2 py-0.5 rounded-full inline-block mb-3">Best value</div>
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <h2 className="text-lg font-semibold">Premium</h2>
                            <p className="text-gray-500 text-sm">Unlock the streak bonus</p>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-bold">$14.99</span>
                            <p className="text-gray-500 text-xs">/month</p>
                        </div>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Monthly reward cap</span>
                            <span className="text-green-400 font-medium">$20.00</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Habit tracking</span>
                            <span className="text-white">✓ All 4 habits</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Streak tracking</span>
                            <span className="text-white">✓ Included</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">25-day streak bonus</span>
                            <span className="text-green-400 font-medium">✓ Up to $25 payout</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* Beta notice */}
            <div className="bg-amber-950 border border-amber-800 rounded-2xl p-5 mb-6">
                <h3 className="text-amber-300 font-semibold mb-2">🧪 Beta testing notice</h3>
                <div className="space-y-2 text-sm text-amber-200">
                    <p>During the beta testing period:</p>
                    <p>✓ <span className="text-white font-medium">No subscription fees</span> will be charged regardless of the tier you choose</p>
                    <p>✓ <span className="text-white font-medium">No monetary rewards</span> will be paid out during this period</p>
                    <p>✓ All tiers are fully functional so you can experience the complete Niyama system</p>
                    <p>✓ Your tier selection and data will carry over when the full version launches</p>
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