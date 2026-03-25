import { useState } from 'react'
import { supabase } from '../supabase'

const TIERS = [
    {
        key: 'free',
        name: 'Free',
        price: '$0',
        cap: '$5',
        description: 'Get started with habit tracking',
    },
    {
        key: 'plus',
        name: 'Plus',
        price: '$4.99/mo',
        cap: '$10',
        description: 'Double your reward potential',
    },
    {
        key: 'premium',
        name: 'Premium',
        price: '$14.99/mo',
        cap: '$20',
        description: 'Unlock the 25-day streak reward of $25',
    },
]

export default function TierSelect({ userId, onComplete }) {
    const [selected, setSelected] = useState(null)
    const [saving, setSaving] = useState(false)

    async function confirmTier() {
        if (!selected) return
        setSaving(true)

        await supabase
            .from('profiles')
            .update({ tier: selected, tier_chosen: true })
            .eq('id', userId)

        onComplete(selected)
        setSaving(false)
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white px-4 py-12 max-w-lg mx-auto">

            {/* Beta banner */}
            <div className="text-center mb-4">
                <span className="bg-amber-900 text-amber-300 text-xs font-medium px-3 py-1 rounded-full">
                    Beta testing version
                </span>
            </div>

            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold">Niyama</h1>
                <p className="text-gray-400 mt-2">Choose your plan to get started</p>
                <p className="text-gray-600 text-xs mt-2">This cannot be changed later</p>
                <div className="mt-4">
                    <span className="bg-amber-900 text-amber-300 text-xs font-medium px-3 py-1 rounded-full">
                        Beta testing version
                    </span>
                </div>
            </div>

            {/* Tier Cards */}
            <div className="space-y-4 mb-8">
                {TIERS.map(tier => (
                    <button key={tier.key} onClick={() => setSelected(tier.key)}
                        className={`w-full text-left rounded-2xl p-5 border transition ${selected === tier.key
                            ? 'border-indigo-500 bg-indigo-950'
                            : 'border-gray-800 bg-gray-900 hover:border-gray-600'
                            }`}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-lg">{tier.name}</span>
                                    {tier.key === 'plus' && (
                                        <span className="bg-indigo-900 text-indigo-300 text-xs px-2 py-0.5 rounded-full">
                                            Popular
                                        </span>
                                    )}
                                    {tier.key === 'premium' && (
                                        <span className="bg-amber-900 text-amber-300 text-xs px-2 py-0.5 rounded-full">
                                            Best value
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-400 text-sm">{tier.description}</p>
                            </div>
                            <div className="text-right ml-4">
                                <p className="font-semibold">{tier.price}</p>
                                <p className="text-green-400 text-sm">Up to {tier.cap}/mo</p>
                            </div>
                        </div>

                        {/* Selected indicator */}
                        {selected === tier.key && (
                            <div className="mt-3 pt-3 border-t border-indigo-800">
                                <p className="text-indigo-300 text-xs">✓ Selected</p>
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* Confirm Button */}
            <button onClick={confirmTier} disabled={!selected || saving} className={`w-full font-semibold py-3 rounded-lg
        transition ${selected ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}>
                {saving ? 'Saving...' : selected ? 'Continue' : 'Select a plan to continue'}
            </button>

            <div className="bg-amber-950 border border-amber-800 rounded-2xl p-6 mt-4">
                <h3 className="text-amber-300 font-semibold mb-3">🧪 Beta testing notice</h3>
                <p className="text-amber-200 text-sm leading-relaxed">
                    Niyama is currently in beta testing. During this period no subscription fees will be charged and no monetary rewards will be paid out. Thank you for helping us test and improve the app!
                </p>
            </div>

        </div>
    )
}