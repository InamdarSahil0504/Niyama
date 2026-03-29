import { useState } from 'react'
import { supabase } from '../supabase'

const TIERS = [
    {
        key: 'free',
        name: 'Basic',
        price: '$0.99',
        priceNote: '/month',
        cap: '$5.00',
        badge: null,
        description: 'Start your health journey',
        features: [
            'All 5 daily habits',
            'Streak tracking',
            'Points system',
            'Up to $5.00 reward per month',
            '1 month free trial',
            'Qualify with 7 successful days/month',
        ],
        streakBonus: false,
    },
    {
        key: 'plus',
        name: 'Plus',
        price: '$4.99',
        priceNote: '/month',
        cap: '$10.00',
        badge: 'Popular',
        badgeColor: { background: 'var(--theme-primary-light)', color: 'var(--theme-primary)' },
        description: 'Double your reward potential',
        features: [
            'All 5 daily habits',
            'Streak tracking',
            'Points system',
            'Up to $5.00 reward per month',
            '1 month free trial',
            'Qualify with 7 successful days/month',
        ],
        streakBonus: false,
    },
    {
        key: 'premium',
        name: 'Premium',
        price: '$14.99',
        priceNote: '/month',
        cap: '$20.00',
        badge: 'Best value',
        badgeColor: { background: 'var(--theme-secondary-light)', color: 'var(--theme-secondary)' },
        description: 'Unlock the 25-day streak bonus',
        features: [
            'All 5 daily habits',
            'Streak tracking',
            'Points system',
            'Up to $20.00 reward per month',
            '1 month free trial',
            'Qualify with just 5 successful days/month',
        ],
        streakBonus: true,
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
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '12px', fontWeight: '500', padding: '4px 12px', borderRadius: '20px' }}>
                    Beta testing version
                </span>
            </div>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--theme-text)' }}>Niyama</h1>
                <h2 style={{ fontSize: '20px', fontWeight: '600', marginTop: '10px', color: 'var(--theme-text)' }}>Choose your plan</h2>
                <p style={{ fontSize: '14px', color: 'var(--theme-text-secondary)', marginTop: '6px' }}>Tap a plan to select it. You can change this later.</p>
            </div>

            {/* Tier cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                {TIERS.map(tier => {
                    const isSelected = selected === tier.key
                    return (
                        <button
                            key={tier.key}
                            onClick={() => setSelected(tier.key)}
                            style={{
                                background: isSelected ? 'var(--theme-primary-light)' : 'var(--theme-card)',
                                border: isSelected ? '2px solid var(--theme-primary)' : '1px solid var(--theme-border)',
                                borderRadius: '16px',
                                padding: '18px 20px',
                                width: '100%',
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            {/* Badge */}
                            {tier.badge && (
                                <span style={{ ...tier.badgeColor, fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', display: 'inline-block', marginBottom: '10px' }}>
                                    {tier.badge}
                                </span>
                            )}

                            {/* Tier header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <div>
                                    <p style={{ fontSize: '18px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '2px' }}>{tier.name}</p>
                                    <p style={{ fontSize: '13px', color: 'var(--theme-text-secondary)' }}>{tier.description}</p>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                                    <p style={{ fontSize: '22px', fontWeight: '700', color: 'var(--theme-text)' }}>{tier.price}</p>
                                    <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)' }}>{tier.priceNote}</p>
                                    <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--theme-primary)', marginTop: '2px' }}>Up to {tier.cap}/mo{tier.key === 'premium' ? ' or flat $25 streak bonus' : ''}</p>
                                </div>
                            </div>

                            {/* Divider */}
                            <div style={{ borderTop: '1px solid var(--theme-border)', marginBottom: '12px' }} />

                            {/* Features */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {tier.features.map(f => (
                                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ color: 'var(--theme-primary)', fontSize: '13px', flexShrink: 0 }}>✓</span>
                                        <span style={{ fontSize: '13px', color: 'var(--theme-text-secondary)' }}>{f}</span>
                                    </div>
                                ))}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '13px', flexShrink: 0 }}>🏆</span>
                                    <span style={{ fontSize: '13px', color: tier.streakBonus ? 'var(--theme-secondary)' : 'var(--theme-text-muted)', fontWeight: tier.streakBonus ? '500' : '400' }}>
                                        25-day streak = flat $25 payout {!tier.streakBonus && '(Premium only)'}
                                    </span>
                                </div>
                            </div>

                            {/* Selected indicator */}
                            {isSelected && (
                                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--theme-border)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ color: 'var(--theme-primary)', fontSize: '14px' }}>✓</span>
                                    <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--theme-primary)' }}>Selected</p>
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Beta notice */}
            <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#92400e', marginBottom: '8px' }}>🧪 Beta testing notice</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {[
                        '✓ No subscription fees will be charged during beta',
                        '✓ No monetary rewards will be paid out during beta',
                        '✓ All tiers are fully functional during beta',
                        '✓ Every plan includes a 1 month free trial at full launch',
                        '✓ Your selection carries over when the full version launches',
                    ].map((item, i) => (
                        <p key={i} style={{ fontSize: '12px', color: '#78350f' }}>{item}</p>
                    ))}
                </div>
            </div>

            {/* Confirm button */}
            <button
                onClick={confirmTier}
                disabled={!selected || saving}
                style={{
                    background: selected ? 'var(--theme-primary)' : 'var(--theme-border)',
                    color: selected ? 'white' : 'var(--theme-text-muted)',
                    width: '100%',
                    fontWeight: '600',
                    padding: '14px',
                    borderRadius: '10px',
                    fontSize: '15px',
                    cursor: selected ? 'pointer' : 'not-allowed',
                    border: 'none',
                    transition: 'all 0.2s',
                }}
            >
                {saving ? 'Saving...' : selected ? `Continue with ${TIERS.find(t => t.key === selected)?.name}` : 'Select a plan to continue'}
            </button>

        </div>
    )
}