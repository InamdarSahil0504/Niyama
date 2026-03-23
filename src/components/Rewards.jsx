export default function Rewards({ profile }) {
    const tier = profile?.tier || 'free'
    const tierCaps = { free: 5, plus: 10, premium: 20 }
    const cap = tierCaps[tier]

    const brands = [
        { name: 'Amazon', category: 'Shopping', icon: '🛍️' },
        { name: 'Starbucks', category: 'Food & drink', icon: '☕' },
        { name: 'Netflix', category: 'Entertainment', icon: '🎬' },
        { name: 'Uber', category: 'Transport', icon: '🚗' },
        { name: 'Airbnb', category: 'Travel', icon: '🏠' },
        { name: 'Spotify', category: 'Music', icon: '🎵' },
    ]

    return (
        <div className="min-h-screen bg-gray-950 text-white px-4 py-8 max-w-lg mx-auto pb-24">

            <h2 className="text-xl font-bold mb-2">Rewards</h2>
            <p className="text-gray-400 text-sm mb-6">See what you can earn with your points</p>

            {/* Your reward potential */}
            <div className="bg-indigo-900 rounded-2xl p-6 mb-6">
                <p className="text-indigo-300 text-sm mb-1">Your reward potential</p>
                <p className="text-4xl font-bold">${cap}.00<span className="text-lg text-indigo-300">/mo</span></p>
                <p className="text-indigo-300 text-sm mt-2 capitalize">{tier} plan</p>
                {tier === 'premium' && (
                    <p className="text-indigo-200 text-xs mt-2">
                        🏆 Unlock up to $25 with a 25-day streak
                    </p>
                )}
            </div>

            {/* How it works */}
            <div className="bg-gray-900 rounded-2xl p-6 mb-6">
                <h3 className="text-white font-semibold mb-4">How rewards work</h3>
                <div className="space-y-3 text-sm">
                    <div className="flex gap-3">
                        <span className="text-indigo-400 font-bold">1.</span>
                        <p className="text-gray-400">Complete your daily habits and earn points</p>
                    </div>
                    <div className="flex gap-3">
                        <span className="text-indigo-400 font-bold">2.</span>
                        <p className="text-gray-400">Accumulate points throughout the month</p>
                    </div>
                    <div className="flex gap-3">
                        <span className="text-indigo-400 font-bold">3.</span>
                        <p className="text-gray-400">At month end your points convert to a reward</p>
                    </div>
                    <div className="flex gap-3">
                        <span className="text-indigo-400 font-bold">4.</span>
                        <p className="text-gray-400">Receive a coupon code redeemable at your chosen brand</p>
                    </div>
                </div>
            </div>

            {/* Coming soon banner */}
            <div className="bg-amber-950 border border-amber-800 rounded-2xl p-4 mb-6">
                <p className="text-amber-300 text-sm text-center">
                    🧪 Rewards are coming after beta. Here's a preview of where you'll be able to redeem them.
                </p>
            </div>

            {/* Brand catalogue */}
            <div className="bg-gray-900 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4">Where you can redeem</h3>
                <div className="grid grid-cols-2 gap-3">
                    {brands.map(brand => (
                        <div
                            key={brand.name}
                            className="bg-gray-800 rounded-xl p-4 flex items-center gap-3"
                        >
                            <span style={{ fontSize: '24px' }}>{brand.icon}</span>
                            <div>
                                <p className="text-white text-sm font-medium">{brand.name}</p>
                                <p className="text-gray-500 text-xs">{brand.category}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <p className="text-gray-600 text-xs text-center mt-4">
                    More brands available after beta launch
                </p>
            </div>

        </div>
    )
}