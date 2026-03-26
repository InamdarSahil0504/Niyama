import { useState } from 'react'
import { supabase } from '../supabase'

const TIERS = [
    {
        key: 'free',
        name: 'Free',
        price: '$0',
        priceNote: 'forever',
        cap: '$5.00',
        description: 'Get started with habit tracking',
        badge: null,
        features: ['All 4 daily habits', 'Streak tracking', 'Points system', 'Up to $5 reward/month'],
    },
    {
        key: 'plus',
        name: 'Plus',
        price: '$4.99',
        priceNote: '/month',
        cap: '$10.00',
        description: 'Double your reward potential',
        badge: 'Popular',
        badgeColor: { background: '#EAF2EE', color: '#4A7C65' },
        features: ['All 4 daily habits', 'Streak tracking', 'Points system', 'Up to $10 reward/month'],
    },
    {
        key: 'premium',
        name: 'Premium',
        price: '$14.99',
        priceNote: '/month',
        cap: '$20.00',
        description: 'Unlock the 25-day streak bonus',
        badge: 'Best value',
        badgeColor: { background: '#FCEEE9', color: '#C0614A' },
        features: ['All 4 daily habits', 'Streak tracking', 'Points system', 'Up to $20 reward/month', '25-day streak = $25 bonus'],
    },
]

export default function TierSelect({ userId, onComplete }) {
    const [selected, setSelected] = useState(null)
    const [saving, setSaving] = useState(false)

    async function confirmTier() {
        if (!selected) return
        setSaving(true)
        await supabase.from('profiles').update({ tier: selected, tier_chosen: true }).eq('id', userId)
        onComplete(selected)
        setSaving(false)
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--theme-bg)' }} className="px-4 py-10 max-w-lg mx-auto pb-24">

            {/* Beta banner */}
            <div className="text-center mb-6">
                <span className="bg-amber-100 text-amber-700 text-xs font-medium px-3 py-1 rounded-full">
                    Beta testing version
                </span>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold" style={{ color: 'var(--theme-text)' }}>Niyama</h1>
                <h2 className="text-xl font-semibold mt-3" style={{ color: 'var(--theme-text)' }}>Choose your plan</h2>
                <p className="text-sm mt-2" style={{ color: 'var(--theme-text-secondary)' }}>You can upgrade or downgrade after launch</p>
            </div>

            {/* Tier cards */}
            <div className="space-y-4 mb-6">
                {TIERS.map(tier => (
                    <button
                        key={tier.key}
                        onClick={() => setSelected(tier.key)}
                        className="w-full text-left rounded-2xl p-5 transition"
                        style={{
                            background: selected === tier.key ? 'var(--theme-primary-light)' : 'var(--theme-card)',
                            border: selected === tier.key ? '2px solid var(--theme-primary)' : '1px solid var(--theme-border)',
                        }}
                    >
                        {/* Tier header */}
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-lg" style={{ color: 'var(--theme-text)' }}>{tier.name}</span>
                                    {tier.badge && (
                                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={tier.badgeColor}>
                                            {tier.badge}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>{tier.description}</p>
                            </div>
                            <div className="text-right ml-4 flex-shrink-0">
                                <p className="font-bold text-xl" style={{ color: 'var(--theme-text)' }}>{tier.price}</p>
                                <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{tier.priceNote}</p>
                                <p className="text-sm font-semibold mt-1" style={{ color: 'var(--theme-primary)' }}>Up to {tier.cap}/mo</p>
                            </div>
                        </div>

                        {/* Features */}
                        <div className="space-y-1">
                            {tier.features.map(feature => (
                                <div key={feature} className="flex items-center gap-2">
                                    <span className="text-xs" style={{ color: 'var(--theme-primary)' }}>✓</span>
                                    <span className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>{feature}</span>
                                </div>
                            ))}
                        </div>

                        {/* Selected indicator */}
                        {selected === tier.key && (
                            <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--theme-border)' }}>
                                <p className="text-xs font-medium" style={{ color: 'var(--theme-primary)' }}>✓ Selected</p>
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* Beta notice */}
            <div className="rounded-2xl p-5 mb-6" style={{ background: '#fffbeb', border: '1px solid #fcd34d' }}>
                <h3 className="font-semibold mb-2" style={{ color: '#92400e' }}>🧪 Beta testing notice</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#78350f' }}>
                    During beta testing no subscription fees will be charged and no monetary rewards will be paid out. Your tier selection will carry over when the full version launches.
                </p>
            </div>

            {/* Confirm button */}
            <button
                onClick={confirmTier}
                disabled={!selected || saving}
                className="w-full font-semibold py-3 rounded-lg transition"
                style={{
                    background: selected ? 'var(--theme-primary)' : 'var(--theme-border)',
                    color: selected ? 'white' : 'var(--theme-text-muted)',
                    cursor: selected ? 'pointer' : 'not-allowed',
                }}
            >
                {saving ? 'Saving...' : selected ? `Continue with ${TIERS.find(t => t.key === selected)?.name}` : 'Select a plan to continue'}
            </button>

        </div>
    )
}