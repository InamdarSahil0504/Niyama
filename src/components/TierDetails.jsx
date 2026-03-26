export default function TierDetails({ onContinue, showButton = true }) {
    const card = { background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '16px', padding: '24px' }

    const tiers = [
        {
            name: 'Free', price: '$0', note: 'forever',
            cap: '$5.00', badge: null,
            features: ['All 4 daily habits', 'Streak tracking', 'Up to $5 reward/month'],
            streakBonus: false,
        },
        {
            name: 'Plus', price: '$4.99', note: '/month',
            cap: '$10.00', badge: 'Popular',
            badgeStyle: { background: 'var(--theme-primary-light)', color: 'var(--theme-primary)' },
            borderStyle: { border: '2px solid var(--theme-primary)' },
            features: ['All 4 daily habits', 'Streak tracking', 'Up to $10 reward/month'],
            streakBonus: false,
        },
        {
            name: 'Premium', price: '$14.99', note: '/month',
            cap: '$20.00', badge: 'Best value',
            badgeStyle: { background: 'var(--theme-secondary-light)', color: 'var(--theme-secondary)' },
            borderStyle: { border: '2px solid var(--theme-secondary)' },
            features: ['All 4 daily habits', 'Streak tracking', 'Up to $20 reward/month'],
            streakBonus: true,
        },
    ]

    return (
        <div style={{ minHeight: '100vh', background: 'var(--theme-bg)' }} className="px-4 py-10 max-w-lg mx-auto pb-24">

            {showButton && (
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '12px', fontWeight: '500', padding: '4px 12px', borderRadius: '20px' }}>
                        Beta testing version
                    </span>
                </div>
            )}

            <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '24px' }}>Subscription tiers</h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                {tiers.map(tier => (
                    <div key={tier.name} style={{ ...card, ...(tier.borderStyle || {}) }}>
                        {tier.badge && (
                            <span style={{ ...tier.badgeStyle, fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', display: 'inline-block', marginBottom: '12px' }}>
                                {tier.badge}
                            </span>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--theme-text)' }}>{tier.name}</h3>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '22px', fontWeight: '700', color: 'var(--theme-text)' }}>{tier.price}</p>
                                <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)' }}>{tier.note}</p>
                                <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--theme-primary)', marginTop: '2px' }}>Up to {tier.cap}/mo</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {tier.features.map(f => (
                                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ color: 'var(--theme-primary)', fontSize: '12px' }}>✓</span>
                                    <span style={{ fontSize: '13px', color: 'var(--theme-text-secondary)' }}>{f}</span>
                                </div>
                            ))}
                            {tier.streakBonus && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ color: 'var(--theme-secondary)', fontSize: '12px' }}>🏆</span>
                                    <span style={{ fontSize: '13px', color: 'var(--theme-secondary)', fontWeight: '500' }}>25-day streak = $25 bonus payout</span>
                                </div>
                            )}
                            {!tier.streakBonus && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ color: 'var(--theme-text-muted)', fontSize: '12px' }}>✗</span>
                                    <span style={{ fontSize: '13px', color: 'var(--theme-text-muted)' }}>25-day streak bonus not available</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
                <h3 style={{ fontWeight: '600', color: '#92400e', marginBottom: '8px' }}>🧪 Beta testing notice</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[
                        '✓ No subscription fees will be charged during beta',
                        '✓ No monetary rewards will be paid out during beta',
                        '✓ All tiers are fully functional to experience the system',
                        '✓ Your tier selection will carry over when the full version launches',
                    ].map((item, i) => (
                        <p key={i} style={{ fontSize: '13px', color: '#78350f' }}>{item}</p>
                    ))}
                </div>
            </div>

            {showButton && (
                <button onClick={onContinue}
                    style={{ background: 'var(--theme-primary)', color: 'white', width: '100%', fontWeight: '600', padding: '14px', borderRadius: '8px', fontSize: '15px', cursor: 'pointer' }}>
                    I understand
                </button>
            )}

        </div>
    )
}