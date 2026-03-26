export default function Rewards({ profile }) {
    const tier = profile?.tier || 'free'
    const tierCaps = { free: 5, plus: 10, premium: 20 }
    const cap = tierCaps[tier]

    const brands = [
        { name: 'Amazon', category: 'Shopping', icon: '🛍️' },
        { name: 'Starbucks', category: 'Food and drink', icon: '☕' },
        { name: 'Netflix', category: 'Entertainment', icon: '🎬' },
        { name: 'Uber', category: 'Transport', icon: '🚗' },
        { name: 'Airbnb', category: 'Travel', icon: '🏠' },
        { name: 'Spotify', category: 'Music', icon: '🎵' },
    ]

    const card = { background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '16px', padding: '24px', marginBottom: '16px' }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--theme-bg)' }} className="px-4 py-8 max-w-lg mx-auto pb-24">

            <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '6px' }}>Rewards</h2>
            <p style={{ fontSize: '14px', color: 'var(--theme-text-secondary)', marginBottom: '24px' }}>See what you can earn with your points</p>

            {/* Reward potential */}
            <div style={{ background: 'var(--theme-primary)', borderRadius: '16px', padding: '24px', marginBottom: '16px', color: 'white' }}>
                <p style={{ fontSize: '14px', opacity: '0.8', marginBottom: '4px' }}>Your reward potential</p>
                <p style={{ fontSize: '40px', fontWeight: '700' }}>${cap}.00<span style={{ fontSize: '18px', opacity: '0.8' }}>/mo</span></p>
                <p style={{ fontSize: '14px', marginTop: '8px', opacity: '0.8', textTransform: 'capitalize' }}>{tier} plan</p>
                {tier === 'premium' && <p style={{ fontSize: '12px', marginTop: '8px', opacity: '0.9' }}>🏆 Unlock up to $25 with a 25-day streak</p>}
            </div>

            {/* How it works */}
            <div style={card}>
                <h3 style={{ fontWeight: '600', color: 'var(--theme-text)', marginBottom: '16px' }}>How rewards work</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                        'Complete your daily habits and earn points',
                        'Accumulate points throughout the month',
                        'At month end your points convert to a reward',
                        'Receive a coupon code redeemable at your chosen brand',
                    ].map((step, i) => (
                        <div key={i} style={{ display: 'flex', gap: '12px' }}>
                            <span style={{ fontWeight: '700', color: 'var(--theme-primary)', flexShrink: '0' }}>{i + 1}.</span>
                            <p style={{ fontSize: '14px', color: 'var(--theme-text-secondary)', lineHeight: '1.6' }}>{step}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Beta notice */}
            <div style={{ background: 'var(--theme-secondary-light)', border: '1px solid var(--theme-border)', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
                <p style={{ fontSize: '13px', textAlign: 'center', color: 'var(--theme-secondary)' }}>
                    🧪 Rewards are coming after beta. Here's a preview of where you'll be able to redeem them.
                </p>
            </div>

            {/* Brand catalogue */}
            <div style={card}>
                <h3 style={{ fontWeight: '600', color: 'var(--theme-text)', marginBottom: '16px' }}>Where you can redeem</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {brands.map(brand => (
                        <div key={brand.name} style={{ background: 'var(--theme-bg)', border: '1px solid var(--theme-border)', borderRadius: '12px', padding: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '22px' }}>{brand.icon}</span>
                            <div>
                                <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--theme-text)' }}>{brand.name}</p>
                                <p style={{ fontSize: '11px', color: 'var(--theme-text-muted)' }}>{brand.category}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <p style={{ fontSize: '12px', textAlign: 'center', color: 'var(--theme-text-muted)', marginTop: '16px' }}>More brands available after beta launch</p>
            </div>

        </div>
    )
}