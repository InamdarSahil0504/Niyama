import { useState } from 'react'
import { supabase } from '../supabase'

export default function Auth() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [isSignUp, setIsSignUp] = useState(false)
    const [isForgotPassword, setIsForgotPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [agreedToTerms, setAgreedToTerms] = useState(false)
    const [message, setMessage] = useState('')

    async function handleResetPassword() {
        if (!email) { setMessage('Please enter your email address first.'); return }
        setLoading(true)
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password',
        })
        if (error) { setMessage(error.message) } else { setMessage('Password reset email sent! Please check your inbox.') }
        setLoading(false)
    }

    async function handleAuth() {
        setLoading(true)
        setMessage('')
        if (isSignUp && !agreedToTerms) {
            setMessage('Please agree to the Terms of Service and Privacy Policy to continue.')
            setLoading(false)
            return
        }
        if (isSignUp) {
            const { data, error } = await supabase.auth.signUp({
                email, password,
                options: { data: { full_name: fullName } }
            })
            if (error) {
                setMessage(error.message)
            } else if (data.user) {
                await supabase.from('profiles').insert({ id: data.user.id, full_name: fullName, tier: 'free', monthly_points: 0 })
                await supabase.from('streaks').insert({ user_id: data.user.id, current_streak: 0, longest_streak: 0, successful_days_this_month: 0 })
                setMessage('Account created! You can now log in.')
                setIsSignUp(false)
            }
        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) setMessage(error.message)
        }
        setLoading(false)
    }

    const inputStyle = {
        background: 'var(--theme-bg)',
        border: '1px solid var(--theme-border)',
        color: 'var(--theme-text)',
        width: '100%',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '14px',
        outline: 'none',
    }

    const labelStyle = {
        fontSize: '14px',
        color: 'var(--theme-text-secondary)',
        display: 'block',
        marginBottom: '4px',
    }

    if (isForgotPassword) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--theme-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
                <div style={{ width: '100%', maxWidth: '448px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <h1 style={{ fontSize: '36px', fontWeight: '700', color: 'var(--theme-text)' }}>Niyama</h1>
                    </div>
                    <div style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '16px', padding: '32px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--theme-text)', marginBottom: '8px' }}>Reset your password</h2>
                        <p style={{ fontSize: '14px', color: 'var(--theme-text-secondary)', marginBottom: '24px' }}>Enter your email and we'll send you a reset link.</p>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={labelStyle}>Email</label>
                            <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
                        </div>
                        {message && <p style={{ fontSize: '14px', color: 'var(--theme-primary)', marginBottom: '16px' }}>{message}</p>}
                        <button onClick={handleResetPassword} disabled={loading}
                            style={{ background: 'var(--theme-primary)', color: 'white', width: '100%', fontWeight: '600', padding: '12px', borderRadius: '8px', marginBottom: '16px', cursor: 'pointer' }}>
                            {loading ? 'Sending...' : 'Send reset link'}
                        </button>
                        <button onClick={() => { setIsForgotPassword(false); setMessage('') }}
                            style={{ width: '100%', fontSize: '14px', color: 'var(--theme-text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                            Back to login
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--theme-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
            <div style={{ width: '100%', maxWidth: '448px' }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '36px', fontWeight: '700', color: 'var(--theme-text)', letterSpacing: '-0.02em' }}>Niyama</h1>
                    <p style={{ fontSize: '14px', color: 'var(--theme-text-secondary)', marginTop: '8px' }}>Successful habits. Real rewards.</p>
                    <div style={{ marginTop: '24px', padding: '0 16px' }}>
                        <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--theme-text)', fontStyle: 'italic' }}>Nee-yah-ma</p>
                        <p style={{ fontSize: '12px', color: 'var(--theme-text-secondary)', marginTop: '8px', lineHeight: '1.6' }}>
                            A Sanskrit word meaning <span style={{ fontStyle: 'italic' }}>discipline</span> and <span style={{ fontStyle: 'italic' }}>self-observance</span>. Rooted in ancient yoga philosophy, it represents the practice of showing up consistently — not for others, but for yourself.
                        </p>
                    </div>
                    <div style={{ marginTop: '16px' }}>
                        <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '12px', fontWeight: '500', padding: '4px 12px', borderRadius: '20px' }}>
                            Beta testing version
                        </span>
                    </div>
                </div>

                {/* Card */}
                <div style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '16px', padding: '32px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--theme-text)', marginBottom: '24px' }}>
                        {isSignUp ? 'Create your account' : 'Welcome back'}
                    </h2>

                    {isSignUp && (
                        <div style={{ marginBottom: '16px' }}>
                            <label style={labelStyle}>Full name</label>
                            <input type="text" placeholder="Your name" value={fullName} onChange={e => setFullName(e.target.value)} style={inputStyle} />
                        </div>
                    )}

                    <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Email</label>
                        <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <label style={labelStyle}>Password</label>
                            {!isSignUp && (
                                <button onClick={() => { setIsForgotPassword(true); setMessage('') }}
                                    style={{ fontSize: '12px', color: 'var(--theme-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                    Forgot password?
                                </button>
                            )}
                        </div>
                        <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
                    </div>

                    {message && <p style={{ fontSize: '14px', color: 'var(--theme-primary)', marginBottom: '16px' }}>{message}</p>}

                    {isSignUp && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                            <input type="checkbox" id="terms" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)}
                                style={{ marginTop: '2px', width: '16px', height: '16px', flexShrink: '0', cursor: 'pointer' }} />
                            <label htmlFor="terms" style={{ fontSize: '12px', color: 'var(--theme-text-secondary)', lineHeight: '1.6', cursor: 'pointer' }}>
                                I agree to the{' '}
                                <span style={{ color: 'var(--theme-primary)', textDecoration: 'underline' }}>Terms of Service</span>
                                {' '}and{' '}
                                <span style={{ color: 'var(--theme-primary)', textDecoration: 'underline' }}>Privacy Policy</span>
                            </label>
                        </div>
                    )}

                    <button onClick={handleAuth} disabled={loading}
                        style={{ background: 'var(--theme-text)', color: 'white', width: '100%', fontWeight: '600', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontSize: '15px' }}>
                        {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Log in'}
                    </button>

                    <p style={{ textAlign: 'center', fontSize: '15px', color: 'var(--theme-text)', marginTop: '24px' }}>
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                        <button onClick={() => { setIsSignUp(!isSignUp); setMessage('') }}
                            style={{ fontWeight: '600', color: 'var(--theme-primary)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>
                            {isSignUp ? 'Log in' : 'Sign up'}
                        </button>
                    </p>

                    <div style={{ borderTop: '1px solid var(--theme-border)', marginTop: '24px', paddingTop: '16px' }}>
                        <p style={{ fontSize: '11px', color: 'var(--theme-text-muted)', textAlign: 'center', lineHeight: '1.6' }}>
                            Niyama is currently in beta testing. By signing up you agree that the service is provided "as is" without any warranties. No subscription fees will be charged and no monetary rewards will be paid out during the beta period.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    )
}