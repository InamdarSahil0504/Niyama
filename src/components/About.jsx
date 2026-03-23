export default function About({ profile }) {
    const tier = profile?.tier || 'free'

    return (
        <div className="min-h-screen bg-gray-950 text-white px-4 py-8 max-w-lg mx-auto pb-24">

            <h2 className="text-xl font-bold mb-6">About Niyama</h2>

            {/* What is Niyama */}
            <div className="bg-gray-900 rounded-2xl p-6 mb-4">
                <h3 className="text-white font-semibold mb-3">What is Niyama?</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                    Niyama is a discipline-building app that rewards you for building consistent daily habits. Track your habits, earn points, and convert your consistency into real monetary rewards.
                </p>
            </div>

            {/* Points System */}
            <div className="bg-gray-900 rounded-2xl p-6 mb-4">
                <h3 className="text-white font-semibold mb-4">How points work</h3>
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
                        <span className="text-gray-400">All 4 habits bonus</span>
                        <span className="text-green-400 font-medium">+100 pts</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Perfect day total</span>
                        <span className="font-medium">750 pts</span>
                    </div>
                    <div className="border-t border-gray-800 pt-3 flex justify-between">
                        <span className="text-gray-400">1,000 points =</span>
                        <span className="text-green-400 font-medium">$1.00</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Max monthly points</span>
                        <span className="font-medium">22,500 pts</span>
                    </div>
                </div>
            </div>

            {/* Habits */}
            <div className="bg-gray-900 rounded-2xl p-6 mb-4">
                <h3 className="text-white font-semibold mb-4">Daily habits</h3>
                <div className="space-y-3 text-sm">
                    {[
                        { label: 'Wake before 7:30 AM', complete: '+100', incomplete: '-50' },
                        { label: 'Steps 10,000 or more', complete: '+100', incomplete: '-75' },
                        { label: 'Screen time under 2 hrs', complete: '+100', incomplete: '-75' },
                        { label: 'Sleep by 10:30 PM', complete: '+100', incomplete: '-50' },
                    ].map(habit => (
                        <div key={habit.label} className="flex justify-between items-center">
                            <span className="text-gray-400">{habit.label}</span>
                            <div className="flex gap-2">
                                <span className="text-green-400">{habit.complete}</span>
                                <span className="text-gray-600">/</span>
                                <span className="text-red-400">{habit.incomplete}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Reward Tiers */}
            <div className="bg-gray-900 rounded-2xl p-6 mb-4">
                <h3 className="text-white font-semibold mb-4">Reward tiers</h3>
                <div className="space-y-3">
                    {[
                        { name: 'Free', price: '$0', cap: '$5/mo' },
                        { name: 'Plus', price: '$4.99/mo', cap: '$10/mo' },
                        { name: 'Premium', price: '$14.99/mo', cap: '$20/mo' },
                    ].map(t => (
                        <div
                            key={t.name}
                            className={`flex justify-between items-center p-3 rounded-lg ${tier === t.name.toLowerCase()
                                ? 'bg-indigo-950 border border-indigo-700'
                                : 'bg-gray-800'
                                }`}
                        >
                            <div>
                                <span className="font-medium text-sm">{t.name}</span>
                                {tier === t.name.toLowerCase() && (
                                    <span className="text-indigo-400 text-xs ml-2">Your plan</span>
                                )}
                            </div>
                            <div className="text-right">
                                <p className="text-gray-400 text-xs">{t.price}</p>
                                <p className="text-green-400 text-xs">Up to {t.cap}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <p className="text-gray-600 text-xs mt-4 text-center">
                    Premium users with a 25-day streak earn up to $25
                </p>
            </div>

            {/* Eligibility Rules */}
            <div className="bg-gray-900 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4">Reward eligibility rules</h3>
                <div className="space-y-3 text-sm text-gray-400">
                    <p>✓ Minimum 7 successful days per month to qualify</p>
                    <p>✓ No more than 5 consecutive inactive days</p>
                    <p>✓ A successful day = all 4 habits completed</p>
                    <p>✓ Rewards reset at the start of each month</p>
                </div>
            </div>
            {/* Beta Notice */}
            <div className="bg-amber-950 border border-amber-800 rounded-2xl p-6 mt-4">
                <h3 className="text-amber-300 font-semibold mb-3">🧪 Beta testing notice</h3>
                <p className="text-amber-200 text-sm leading-relaxed">
                    Niyama is currently in beta testing. During this period no subscription fees will be charged and no monetary rewards will be paid out. Thank you for helping us test and improve the app!
                </p>
            </div>
        </div>
    )
}