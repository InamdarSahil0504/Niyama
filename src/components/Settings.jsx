import { supabase } from '../supabase'
import About from './About'
import FounderStory from './FounderStory'
import { useState, useEffect, useRef } from 'react'
const FEEDBACK_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScGtdoAUJ-9JPWYeqbd2QH71qPXFJcERubHiSjvKOMxLc1cxw/viewform?usp=header'
function ContactChat({ session, profile }) {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [sending, setSending] = useState(false)
    const [loading, setLoading] = useState(true)
    const [conversation, setConversation] = useState(null)
    const bottomRef = useRef(null)

    useEffect(() => {
        loadMessages()
        const interval = setInterval(loadMessages, 30000)
        window._chatRefresh = interval
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    async function loadMessages() {
        const { data } = await supabase
            .from('contact_messages')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: true })
        if (data && data.length > 0) {
            setMessages(data)
            setConversation(data[0])
        } else {
            setMessages([])
            setConversation(null)
        }
        setLoading(false)
    }

    async function sendMessage() {
        if (!input.trim()) return
        setSending(true)
        const isResolved = conversation?.resolved
        const resolvedAt = conversation?.resolved_at
        const hoursSinceResolved = isResolved && resolvedAt
            ? (new Date() - new Date(resolvedAt)) / (1000 * 60 * 60)
            : null
        const canStartNew = !isResolved || (hoursSinceResolved !== null && hoursSinceResolved >= 24)

        if (!canStartNew) {
            setSending(false)
            return
        }

        const existingConvId = messages.length > 0 && !canStartNew
            ? messages[0].conversation_id
            : (canStartNew && isResolved ? undefined : messages[0]?.conversation_id)

        await supabase.from('contact_messages').insert({
            user_id: session.user.id,
            user_name: profile?.full_name || 'User',
            email: session.user.email,
            message: input.trim(),
            sender: 'user',
            read_by_admin: false,
            conversation_id: existingConvId || undefined,
        })
        setInput('')
        await loadMessages()
        setSending(false)
    }

    if (loading) return <p style={{ fontSize: '14px', color: 'var(--theme-text-secondary)' }}>Loading...</p>

    const isResolved = conversation?.resolved
    const resolvedAt = conversation?.resolved_at
    const hoursSinceResolved = isResolved && resolvedAt
        ? (new Date() - new Date(resolvedAt)) / (1000 * 60 * 60)
        : null
    const chatCleared = isResolved && hoursSinceResolved !== null && hoursSinceResolved >= 24
    const visibleMessages = chatCleared ? [] : messages

    return (
        <div>
            {/* Chat window */}
            <div style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '16px', padding: '16px', marginBottom: '12px', minHeight: '250px', maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {visibleMessages.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '8px' }}>
                        <p style={{ fontSize: '24px' }}>💬</p>
                        <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--theme-text)' }}>Start a conversation</p>
                        <p style={{ fontSize: '12px', color: 'var(--theme-text-secondary)', textAlign: 'center' }}>Send us a message and we'll get back to you as soon as possible.</p>
                    </div>
                ) : (
                    visibleMessages.map((msg, i) => {
                        const isUser = msg.sender === 'user'
                        const isAdmin = msg.sender === 'admin'
                        return (
                            <div key={msg.id || i} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                                {isAdmin && (
                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--theme-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'white', flexShrink: 0, marginRight: '8px', alignSelf: 'flex-end' }}>N</div>
                                )}
                                <div style={{ maxWidth: '75%' }}>
                                    <div style={{ padding: '10px 14px', borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px', fontSize: '14px', lineHeight: '1.5', background: isUser ? 'var(--theme-primary)' : 'var(--theme-bg)', color: isUser ? 'white' : 'var(--theme-text)', border: isUser ? 'none' : '1px solid var(--theme-border)' }}>
                                        {msg.message}
                                    </div>
                                    <p style={{ fontSize: '10px', color: 'var(--theme-text-muted)', marginTop: '3px', textAlign: isUser ? 'right' : 'left' }}>
                                        {isAdmin ? 'Niyama team · ' : ''}{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {/* Resolved notice */}
            {isResolved && !chatCleared && (
                <div style={{ background: 'var(--theme-primary-light)', border: '1px solid var(--theme-border)', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px', textAlign: 'center' }}>
                    <p style={{ fontSize: '13px', color: 'var(--theme-primary)', fontWeight: '500' }}>✓ This conversation has been resolved</p>
                    <p style={{ fontSize: '11px', color: 'var(--theme-text-secondary)', marginTop: '3px' }}>Thank you for reaching out. This window will reset in 24 hours.</p>
                </div>
            )}

            {/* Input */}
            {(!isResolved || chatCleared) && (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" placeholder="Type your message..." value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !sending && sendMessage()}
                        style={{ flex: 1, background: 'var(--theme-bg)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', outline: 'none' }} />
                    <button onClick={sendMessage} disabled={sending || !input.trim()}
                        style={{ background: 'var(--theme-primary)', color: 'white', padding: '12px 16px', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', opacity: (sending || !input.trim()) ? 0.5 : 1, border: 'none' }}>
                        {sending ? '...' : 'Send'}
                    </button>
                </div>
            )}
        </div>
    )
}
export default function Settings({ profile, session, onSignOut, onReplayTutorial }) {
    const [activePage, setActivePage] = useState(null)
    const [message, setMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [saving, setSaving] = useState(false)
    const [chatMessages, setChatMessages] = useState([{ from: 'support', text: 'Hi! How can we help you today?' }])
    const [chatInput, setChatInput] = useState('')

    async function sendMessage() {
        if (!chatInput.trim()) return
        setSending(true)
        const userMessage = { from: 'user', text: chatInput }
        setChatMessages(prev => [...prev, userMessage])
        setChatInput('')
        await supabase.from('contact_messages').insert({ user_id: session.user.id, user_name: profile?.full_name || 'Unknown', email: session.user.email, message: chatInput })
        setTimeout(() => { setChatMessages(prev => [...prev, { from: 'support', text: "Thanks for reaching out! We've received your message and will get back to you shortly." }]); setSending(false) }, 800)
    }

    function getMemberDays() {
        if (!profile?.created_at) return null
        const diffDays = Math.floor((new Date() - new Date(profile.created_at)) / (1000 * 60 * 60 * 24))
        return diffDays
    }

    const menuItems = [
        { key: 'founder', label: "Founder's story", icon: '✨' },
        { key: 'about', label: 'About Niyama', icon: '📖' },
        { key: 'getting-started', label: 'Getting started', icon: '🚀' },
        { key: 'rules', label: 'Rules and points system', icon: '📜' },
        { key: 'tiers', label: 'Subscription tiers', icon: '🏆' },
        { key: 'habits', label: 'Habit importance', icon: '💪' },
        { key: 'legal', label: 'Legal disclaimer', icon: '📋' },
        { key: 'terms', label: 'Terms of service', icon: '📄' },
        { key: 'privacy', label: 'Privacy policy', icon: '🔒' },
        { key: 'theme', label: 'Change theme', icon: '🎨' },
        { key: 'notifications', label: 'Notification preferences', icon: '🔔' },
        { key: 'feedback', label: 'Feedback form', icon: '📝' },
        { key: 'contact', label: 'Contact us', icon: '💬' },
    ]

    const pageStyle = { minHeight: '100vh', background: 'var(--theme-bg)', color: 'var(--theme-text)', padding: '32px 16px', maxWidth: '448px', margin: '0 auto', paddingBottom: '96px' }
    const backBtn = { fontSize: '14px', color: 'var(--theme-primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '24px' }
    const card = { background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '16px', padding: '24px', marginBottom: '16px' }
    const cardTitle = { fontWeight: '600', color: 'var(--theme-text)', marginBottom: '16px' }
    const bodyText = { fontSize: '14px', color: 'var(--theme-text-secondary)', lineHeight: '1.7' }
    if (activePage === 'getting-started') {
        return (
            <div style={pageStyle}>
                <button style={backBtn} onClick={() => setActivePage(null)}>← Back</button>
                <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '6px' }}>Getting started</h2>
                <p style={{ fontSize: '14px', color: 'var(--theme-text-secondary)', marginBottom: '24px' }}>Everything you need to know to get the most out of Niyama.</p>

                <div style={{ background: 'var(--theme-primary)', borderRadius: '16px', padding: '20px', marginBottom: '16px', color: 'white' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Welcome to Niyama 🌿</h3>
                    <p style={{ fontSize: '13px', opacity: '0.9', lineHeight: '1.6' }}>
                        Niyama rewards you for building 4 simple daily habits. The more consistent you are, the more you earn. Here's how to get started.
                    </p>
                </div>

                <div style={card}>
                    <h3 style={cardTitle}>Step 1 — Log your habits daily</h3>
                    <p style={{ ...bodyText, marginBottom: '16px' }}>Every day check off the habits you completed on the Home tab. You can save a draft during the day and submit when you're done.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[
                            { emoji: '🌅', habit: 'Wake before 7:30 AM', tip: 'Check this first thing when you wake up' },
                            { emoji: '👟', habit: 'Steps 10,000 or more', tip: 'Check this in the evening once you\'ve hit your step goal' },
                            { emoji: '📵', habit: 'Screen time under 2 hrs', tip: 'Check this once your screen time is under 2 hours' },
                            { emoji: '🌙', habit: 'Sleep by 10:30 PM', tip: 'Check this before you wind down for the night' },
                        ].map(item => (
                            <div key={item.habit} style={{ display: 'flex', gap: '12px', padding: '10px', background: 'var(--theme-bg)', borderRadius: '10px' }}>
                                <span style={{ fontSize: '18px', flexShrink: '0' }}>{item.emoji}</span>
                                <div>
                                    <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--theme-text)', marginBottom: '2px' }}>{item.habit}</p>
                                    <p style={{ fontSize: '12px', color: 'var(--theme-text-secondary)' }}>{item.tip}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={card}>
                    <h3 style={cardTitle}>Step 2 — Understand your points</h3>
                    <p style={{ ...bodyText, marginBottom: '12px' }}>Every day you start with 250 base points. Complete habits to earn more, miss them to lose some.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                            { label: 'Perfect day (all 4 habits)', value: '750 pts', color: 'var(--theme-primary)' },
                            { label: 'Complete all 4 bonus', value: '+100 pts', color: 'var(--theme-primary)' },
                            { label: '1,000 points equals', value: '$1.00', color: 'var(--theme-primary)' },
                            { label: 'Max monthly value', value: '$22.50', color: 'var(--theme-primary)' },
                        ].map(item => (
                            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', color: 'var(--theme-text-secondary)' }}>{item.label}</span>
                                <span style={{ fontSize: '13px', fontWeight: '600', color: item.color }}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={card}>
                    <h3 style={cardTitle}>Step 3 — Earn your reward</h3>
                    <p style={{ ...bodyText, marginBottom: '12px' }}>To qualify for a reward each month you need to:</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[
                            { icon: '✓', text: 'Complete at least 7 successful days — any 4 out of 5 habits counts as a successful day', color: 'var(--theme-primary)' },
                            { icon: '✓', text: 'Avoid being inactive for 5 or more consecutive days', color: 'var(--theme-primary)' },
                            { icon: '✓', text: 'Your reward is paid out on the 1st of the following month', color: 'var(--theme-primary)' },
                        ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                <span style={{ fontWeight: '700', color: item.color, flexShrink: '0', fontSize: '14px' }}>{item.icon}</span>
                                <p style={{ fontSize: '13px', color: 'var(--theme-text-secondary)', lineHeight: '1.6' }}>{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={card}>
                    <h3 style={cardTitle}>Step 4 — Build your streak</h3>
                    <p style={{ ...bodyText, marginBottom: '12px' }}>A streak is the number of consecutive days where all 4 habits are completed. The longer your streak the bigger the flame.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                            { streak: '3+ days', message: '💪 You\'re building momentum' },
                            { streak: '10+ days', message: '🌟 You\'re on fire' },
                            { streak: '25 days (Premium)', message: '🏆 $25 bonus reward unlocked' },
                        ].map(item => (
                            <div key={item.streak} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'var(--theme-bg)', borderRadius: '8px' }}>
                                <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--theme-text)' }}>{item.streak}</span>
                                <span style={{ fontSize: '12px', color: 'var(--theme-text-secondary)' }}>{item.message}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={card}>
                    <h3 style={cardTitle}>Tips for success</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[
                            'Submit your habits before midnight every day — they auto-submit at midnight but it\'s better to do it yourself.',
                            'Even if you miss all 4 habits, still submit your results so your streak and inactive day count stay accurate.',
                            'Check the Analytics tab regularly to see your progress and identify which habits you struggle with most.',
                            'The honor system depends on your integrity — log honestly, not for Niyama but for yourself.',
                        ].map((tip, i) => (
                            <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                <span style={{ fontWeight: '700', color: 'var(--theme-secondary)', flexShrink: '0' }}>{i + 1}.</span>
                                <p style={{ fontSize: '13px', color: 'var(--theme-text-secondary)', lineHeight: '1.6' }}>{tip}</p>
                            </div>
                        ))}
                    </div>
                </div>
                {onReplayTutorial && (
                    <button
                        onClick={() => { onReplayTutorial(); setActivePage(null) }}
                        style={{ background: 'var(--theme-primary)', color: 'white', width: '100%', fontWeight: '600', padding: '14px', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', marginTop: '8px' }}>
                        Replay guided tour
                    </button>
                )}
            </div>
        )
    }
    if (activePage === 'founder') {
        return (
            <div style={pageStyle}>
                <button style={backBtn} onClick={() => setActivePage(null)}>← Back</button>
                <FounderStory minimal={true} showButton={false} />
            </div>
        )
    }

    if (activePage === 'about') {
        return (
            <div style={pageStyle}>
                <button style={backBtn} onClick={() => setActivePage(null)}>← Back</button>
                <About profile={profile} />
            </div>
        )
    }

    if (activePage === 'rules') {
        return (
            <div style={pageStyle}>
                <button style={backBtn} onClick={() => setActivePage(null)}>← Back</button>
                <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '24px' }}>How Niyama works</h2>
                <div style={card}>
                    <h3 style={cardTitle}>Your 4 daily habits</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                            { habit: 'Wake before 7:30 AM', complete: '+100 pts', incomplete: '-50 pts', flex: false },
                            { habit: 'Steps 10,000 or more', complete: '+100 pts', incomplete: '-75 pts', flex: false },
                            { habit: 'Screen time under 3 hrs', complete: '+100 pts', incomplete: 'no penalty', flex: true },
                            { habit: 'Sleep by 10:30 PM', complete: '+100 pts', incomplete: '-50 pts', flex: false },
                            { habit: '30 min active heart rate', complete: '+100 pts', incomplete: '-75 pts', flex: false },
                        ].map(item => (
                            <div key={item.habit} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '14px', color: 'var(--theme-text-secondary)' }}>{item.habit}</span>
                                    {item.flex && (
                                        <span style={{ fontSize: '10px', background: 'var(--theme-secondary-light)', color: 'var(--theme-secondary)', padding: '1px 6px', borderRadius: '8px', fontWeight: '500' }}>flex</span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                                    <span style={{ color: 'var(--theme-primary)', fontWeight: '500' }}>{item.complete}</span>
                                    <span style={{ color: 'var(--theme-text-muted)' }}>/</span>
                                    <span style={{ color: item.flex ? 'var(--theme-text-muted)' : 'var(--theme-secondary)', fontWeight: '500' }}>{item.incomplete}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div style={card}>
                    <h3 style={cardTitle}>Points system</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[
                            { label: 'Base points per day', value: '250 pts', highlight: false },
                            { label: 'Per habit completed', value: '+100 pts', highlight: true },
                            { label: 'All 4 habits bonus', value: '+100 pts', highlight: true },
                            { label: 'Perfect day total', value: '750 pts', highlight: false },
                            { label: 'Worst day total', value: '0 pts', highlight: false },
                        ].map(item => (
                            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '14px', color: 'var(--theme-text-secondary)' }}>{item.label}</span>
                                <span style={{ fontSize: '14px', fontWeight: '500', color: item.highlight ? 'var(--theme-primary)' : 'var(--theme-text)' }}>{item.value}</span>
                            </div>
                        ))}
                        <div style={{ borderTop: '1px solid var(--theme-border)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '14px', color: 'var(--theme-text-secondary)' }}>Points to money</span>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--theme-primary)' }}>1,000 pts = $1.00</span>
                        </div>
                    </div>
                </div>
                <div style={card}>
                    <h3 style={cardTitle}>Reward eligibility rules</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                            'Minimum of 7 successful days per month to qualify. A successful day means completing any 4 out of 5 habits.',
                            'No more than 5 consecutive inactive days.',
                            'Reward = min(points value, tier cap).',
                            'Rewards reset at the start of every month.',
                            'Premium users with a 25-day streak receive a flat $25 payout.',
                        ].map((rule, i) => (
                            <div key={i} style={{ display: 'flex', gap: '12px' }}>
                                <span style={{ fontWeight: '700', color: 'var(--theme-primary)', flexShrink: '0' }}>{i + 1}.</span>
                                <p style={{ fontSize: '14px', color: 'var(--theme-text-secondary)', lineHeight: '1.6' }}>{rule}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '16px', padding: '24px' }}>
                    <h3 style={{ fontWeight: '600', color: '#dc2626', marginBottom: '12px' }}>Honor system and fair play</h3>
                    <p style={{ fontSize: '14px', color: '#dc2626', lineHeight: '1.7' }}>Niyama operates on an honor system. All habit logging is self-reported. Users found fraudulently reporting habits will be permanently disqualified and may have their account suspended. Niyama reserves the right to audit user behaviour at any time.</p>
                </div>
            </div>
        )
    }

    if (activePage === 'tiers') {
        return (
            <div style={pageStyle}>
                <button style={backBtn} onClick={() => setActivePage(null)}>← Back</button>
                <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '24px' }}>Subscription tiers</h2>
                {[
                    { name: 'Free', price: '$0', note: 'forever', cap: '$5.00', badge: null, features: ['All 4 daily habits', 'Streak tracking', 'Up to $5 reward/month'], streakBonus: false },
                    { name: 'Plus', price: '$4.99', note: '/month', cap: '$10.00', badge: 'Popular', badgeStyle: { background: 'var(--theme-primary-light)', color: 'var(--theme-primary)' }, borderStyle: { border: '2px solid var(--theme-primary)' }, features: ['All 4 daily habits', 'Streak tracking', 'Up to $10 reward/month'], streakBonus: false },
                    { name: 'Premium', price: '$14.99', note: '/month', cap: '$20.00', badge: 'Best value', badgeStyle: { background: 'var(--theme-secondary-light)', color: 'var(--theme-secondary)' }, borderStyle: { border: '2px solid var(--theme-secondary)' }, features: ['All 4 daily habits', 'Streak tracking', 'Up to $20 reward/month'], streakBonus: true },
                ].map(tier => (
                    <div key={tier.name} style={{ ...card, ...(tier.borderStyle || {}) }}>
                        {tier.badge && <span style={{ ...tier.badgeStyle, fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', display: 'inline-block', marginBottom: '12px' }}>{tier.badge}</span>}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--theme-text)' }}>{tier.name}</h3>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '22px', fontWeight: '700', color: 'var(--theme-text)' }}>{tier.price}</p>
                                <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)' }}>{tier.note}</p>
                                <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--theme-primary)', marginTop: '2px' }}>Up to {tier.cap}/mo</p>
                            </div>
                        </div>
                        {tier.features.map(f => (
                            <div key={f} style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                                <span style={{ color: 'var(--theme-primary)', fontSize: '12px' }}>✓</span>
                                <span style={{ fontSize: '13px', color: 'var(--theme-text-secondary)' }}>{f}</span>
                            </div>
                        ))}
                        {tier.streakBonus
                            ? <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}><span>🏆</span><span style={{ fontSize: '13px', color: 'var(--theme-secondary)', fontWeight: '500' }}>25-day streak = $25 bonus</span></div>
                            : <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}><span style={{ color: 'var(--theme-text-muted)', fontSize: '12px' }}>✗</span><span style={{ fontSize: '13px', color: 'var(--theme-text-muted)' }}>25-day streak bonus not available</span></div>
                        }
                    </div>
                ))}
                <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '16px', padding: '20px' }}>
                    <h3 style={{ fontWeight: '600', color: '#92400e', marginBottom: '8px' }}>🧪 Beta testing notice</h3>
                    <p style={{ fontSize: '13px', color: '#78350f' }}>No subscription fees will be charged and no monetary rewards will be paid out during beta. All tiers are fully functional.</p>
                </div>
            </div>
        )
    }

    if (activePage === 'habits') {
        return (
            <div style={pageStyle}>
                <button style={backBtn} onClick={() => setActivePage(null)}>← Back</button>
                <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '24px' }}>Why habits matter</h2>
                <div style={card}>
                    <h3 style={cardTitle}>The power of daily habits</h3>
                    <p style={bodyText}>Research shows that up to 40% of our daily actions are habits rather than conscious decisions. The habits you build today shape the person you become tomorrow. Small, consistent actions compound over time into remarkable results.</p>
                </div>
                <div style={card}>
                    <h3 style={cardTitle}>Why these 4 habits?</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[
                            { emoji: '🌅', title: 'Waking before 7:30 AM', text: 'Early rising gives you quiet, uninterrupted time to set intentions, exercise, and prepare mentally for the day.' },
                            { emoji: '👟', title: '10,000 steps daily', text: 'Walking 10,000 steps reduces heart disease risk, improves mood through endorphin release, and builds physical and mental resilience.' },
                            { emoji: '📵', title: 'Screen time under 2 hours', text: 'Excessive screen time is linked to reduced attention spans, poor sleep quality, and increased anxiety. Limiting it protects your mental health.' },
                            { emoji: '🌙', title: 'Sleep by 10:30 PM', text: 'Quality sleep is the foundation of everything. Sleeping before 10:30 PM aligns with your body\'s natural rhythm, improving memory, immunity and emotional regulation.' },
                        ].map(item => (
                            <div key={item.title}>
                                <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--theme-text)', marginBottom: '4px' }}>{item.emoji} {item.title}</p>
                                <p style={{ fontSize: '13px', color: 'var(--theme-text-secondary)', lineHeight: '1.6' }}>{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div style={card}>
                    <h3 style={cardTitle}>Discipline and rewards</h3>
                    <p style={bodyText}>Niyama combines the science of habit formation with real financial incentives. By attaching tangible rewards to consistent behavior, we make discipline something worth working towards — every single day.</p>
                </div>
            </div>
        )
    }

    if (activePage === 'legal') {
        return (
            <div style={pageStyle}>
                <button style={backBtn} onClick={() => setActivePage(null)}>← Back</button>
                <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '24px' }}>Legal disclaimer</h2>
                <div style={card}>
                    {[
                        'Niyama is currently in beta testing. By using this app you agree that the service is provided "as is" without any warranties of any kind.',
                        'No subscription fees will be charged and no monetary rewards will be paid out during the beta period.',
                        'Point values, reward caps, subscription tiers and app features are subject to change at any time without notice.',
                        'The reward system is subject to eligibility verification and Niyama reserves the right to withhold rewards in cases of suspected misuse.',
                        'This beta version is intended for testing purposes only. All data collected during beta testing may be reset before the official launch.',
                    ].map((text, i) => (
                        <p key={i} style={{ ...bodyText, marginBottom: i < 4 ? '16px' : '0' }}>{text}</p>
                    ))}
                </div>
            </div>
        )
    }

    if (activePage === 'terms') {
        return (
            <div style={pageStyle}>
                <button style={backBtn} onClick={() => setActivePage(null)}>← Back</button>
                <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '24px' }}>Terms of service</h2>
                {[
                    { title: 'Acceptance of terms', text: 'By creating an account and using Niyama you agree to be bound by these Terms of Service. If you do not agree to these terms please do not use the app.' },
                    { title: 'Eligibility', text: 'You must be at least 18 years of age to participate in the rewards system. Users between 13 and 17 may use the habit tracking features but are not eligible for monetary rewards or paid subscriptions. Users under 13 are not permitted to use Niyama.' },
                    { title: 'Honor system and fair use', text: 'Niyama operates on an honor system. All habit logging is self-reported. Users who fraudulently report habit completion will be permanently disqualified and may have their account suspended.' },
                    { title: 'Rewards', text: 'Rewards are subject to eligibility rules. Niyama reserves the right to modify or terminate the rewards program at any time. During beta testing no monetary rewards will be paid out.' },
                    { title: 'Subscriptions', text: 'Paid subscriptions are billed monthly. The first month may be prorated. Subscriptions renew automatically unless cancelled. During beta no fees will be charged.' },
                    { title: 'Limitation of liability', text: 'Niyama is provided "as is" without warranties. The app is not a medical device and does not provide medical advice. Always consult a healthcare professional before making significant lifestyle changes.' },
                    { title: 'Changes to terms', text: 'Niyama reserves the right to update these terms at any time. Last updated: March 2026.' },
                ].map(section => (
                    <div key={section.title} style={card}>
                        <h3 style={cardTitle}>{section.title}</h3>
                        <p style={bodyText}>{section.text}</p>
                    </div>
                ))}
            </div>
        )
    }

    if (activePage === 'privacy') {
        return (
            <div style={pageStyle}>
                <button style={backBtn} onClick={() => setActivePage(null)}>← Back</button>
                <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '24px' }}>Privacy policy</h2>
                {[
                    { title: 'What we collect', text: 'We collect the following personal information: full name, email address, date of birth, gender, subscription tier, daily habit logs, points and streak data.' },
                    { title: 'How we use your data', text: 'Your data is used to provide the Niyama service including habit tracking, points calculation, reward eligibility and personalisation. We do not sell your personal data to third parties.' },
                    { title: 'Data storage', text: 'Your data is stored securely using Supabase. Data is encrypted in transit and at rest. You may request deletion of your account and all data at any time through Settings.' },
                    { title: 'Third party services', text: 'Niyama uses Supabase (database), Vercel (hosting), Stripe (payments — coming soon) and Tremendous (rewards — coming soon).' },
                    { title: 'Your rights', text: 'You have the right to access, correct or delete your personal data at any time. California residents have additional rights under CCPA.' },
                    { title: "Children's privacy", text: 'Niyama does not knowingly collect data from children under 13. Users between 13 and 17 have restricted access to the rewards system.' },
                    { title: 'Contact', text: 'If you have questions about this Privacy Policy please contact us through the Contact Us page. Last updated: March 2026.' },
                ].map(section => (
                    <div key={section.title} style={card}>
                        <h3 style={cardTitle}>{section.title}</h3>
                        <p style={bodyText}>{section.text}</p>
                    </div>
                ))}
            </div>
        )
    }

    if (activePage === 'theme') {
        return (
            <div style={pageStyle}>
                <button style={backBtn} onClick={() => setActivePage(null)}>← Back</button>
                <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '6px' }}>Change theme</h2>
                <p style={{ fontSize: '14px', color: 'var(--theme-text-secondary)', marginBottom: '24px' }}>Choose your preferred color theme.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    {[
                        { key: 'sage', label: 'Sage', sub: 'Green dominant', bg: '#F4F7F5', primary: '#5A8A78', secondary: '#D4735F', border: '#D9E5DF', cardBorder: '#D9E5DF' },
                        { key: 'salmon', label: 'Salmon', sub: 'Pink dominant', bg: '#F7F4F4', primary: '#D4735F', secondary: '#5A8A78', border: '#E5D9D5', cardBorder: '#E5D9D5' },
                    ].map(t => (
                        <button key={t.key} onClick={async () => {
                            const root = document.documentElement
                            root.style.setProperty('--theme-bg', t.bg)
                            root.style.setProperty('--theme-primary', t.primary)
                            root.style.setProperty('--theme-secondary', t.secondary)
                            root.style.setProperty('--theme-border', t.border)
                            root.style.setProperty('--theme-primary-light', t.key === 'sage' ? '#EAF2EE' : '#FCEEE9')
                            root.style.setProperty('--theme-secondary-light', t.key === 'sage' ? '#FCEEE9' : '#EAF2EE')
                            await supabase.from('profiles').update({ color_theme: t.key }).eq('id', session.user.id)
                            setActivePage(null)
                        }}
                            style={{ borderRadius: '12px', overflow: 'hidden', border: profile?.color_theme === t.key ? `2px solid ${t.primary}` : '1px solid var(--theme-border)', cursor: 'pointer', background: 'none' }}>
                            <div style={{ background: t.bg, padding: '12px' }}>
                                <div style={{ background: t.primary, borderRadius: '8px', padding: '8px', marginBottom: '8px' }}>
                                    <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}></div>
                                    <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.4)', width: '75%' }}></div>
                                </div>
                                <div style={{ background: '#FFFFFF', border: `1px solid ${t.cardBorder}`, borderRadius: '8px', padding: '8px' }}>
                                    <div style={{ height: '6px', borderRadius: '3px', background: t.primary, width: '60%', marginBottom: '4px' }}></div>
                                    <div style={{ height: '20px', borderRadius: '6px', background: t.secondary }}></div>
                                </div>
                            </div>
                            <div style={{ background: t.bg, borderTop: `1px solid ${t.cardBorder}`, padding: '8px' }}>
                                <p style={{ fontSize: '13px', fontWeight: '500', textAlign: 'center', color: '#1A1A1A', margin: 0 }}>{t.label}</p>
                                <p style={{ fontSize: '11px', textAlign: 'center', color: '#6B7280', margin: 0 }}>{t.sub}</p>
                            </div>
                        </button>
                    ))}
                </div>
                <p style={{ fontSize: '12px', textAlign: 'center', color: 'var(--theme-text-muted)' }}>
                    Currently using {profile?.color_theme === 'salmon' ? 'Salmon' : 'Sage'} theme
                </p>
            </div>
        )
    }
    if (activePage === 'notifications') {
        return (
            <div style={pageStyle}>
                <button style={backBtn} onClick={() => setActivePage(null)}>← Back</button>
                <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '6px' }}>Notification preferences</h2>
                <p style={{ fontSize: '14px', color: 'var(--theme-text-secondary)', marginBottom: '24px' }}>Manage your email reminders.</p>

                <div style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                            <p style={{ fontSize: '15px', fontWeight: '500', color: 'var(--theme-text)', marginBottom: '3px' }}>Daily habit reminders</p>
                            <p style={{ fontSize: '13px', color: 'var(--theme-text-secondary)' }}>Receive email reminders to log your habits</p>
                        </div>
                        <button onClick={async () => {
                            const newVal = !profile?.email_reminders
                            await supabase.from('profiles').update({ email_reminders: newVal }).eq('id', session.user.id)
                            window.location.reload()
                        }}
                            style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: profile?.email_reminders !== false ? 'var(--theme-primary)' : '#D1D5DB', position: 'relative', transition: 'background 0.2s' }}>
                            <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', transition: 'left 0.2s', left: profile?.email_reminders !== false ? '23px' : '3px' }} />
                        </button>
                    </div>

                    <div style={{ borderTop: '1px solid var(--theme-border)', paddingTop: '16px' }}>
                        <p style={{ fontSize: '13px', color: 'var(--theme-text-secondary)', marginBottom: '8px' }}>You will receive:</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {[
                                { time: '2:30 PM', desc: 'Motivational mid-day nudge — check your steps and screen time' },
                                { time: '9:00 PM', desc: 'Wind down reminder — log your habits and get to bed on time' },
                            ].map(item => (
                                <div key={item.time} style={{ display: 'flex', gap: '12px', padding: '10px', background: 'var(--theme-bg)', borderRadius: '10px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--theme-primary)', flexShrink: 0, minWidth: '52px' }}>{item.time}</span>
                                    <p style={{ fontSize: '13px', color: 'var(--theme-text-secondary)', lineHeight: '1.5' }}>{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ background: 'var(--theme-primary-light)', border: '1px solid var(--theme-border)', borderRadius: '12px', padding: '14px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--theme-text-secondary)', lineHeight: '1.6' }}>
                        Reminders are only sent on days when you have not yet submitted your habits. We will never send more than 2 emails per day.
                    </p>
                </div>
            </div>
        )
    }
    if (activePage === 'feedback') {
        return (
            <div style={pageStyle}>
                <button style={backBtn} onClick={() => setActivePage(null)}>← Back</button>
                <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '6px' }}>Feedback form</h2>
                <p style={{ fontSize: '14px', color: 'var(--theme-text-secondary)', marginBottom: '24px' }}>We'd love to hear what you think about Niyama.</p>
                <div style={{ ...card, textAlign: 'center' }}>
                    <p style={{ ...bodyText, marginBottom: '24px' }}>Tap the button below to open our feedback form. It takes about 3 minutes to complete.</p>
                    <a href={FEEDBACK_FORM_URL} target="_blank" rel="noopener noreferrer"
                        style={{ background: 'var(--theme-primary)', color: 'white', fontWeight: '600', padding: '12px 32px', borderRadius: '8px', textDecoration: 'none', display: 'inline-block' }}>
                        Open feedback form
                    </a>
                </div>
            </div>
        )
    }

    if (activePage === 'contact') {
        return (
            <div style={pageStyle}>
                <button style={backBtn} onClick={() => { setActivePage(null); clearInterval(window._chatRefresh) }}>← Back</button>
                <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '6px' }}>Contact us</h2>
                <p style={{ fontSize: '14px', color: 'var(--theme-text-secondary)', marginBottom: '24px' }}>Have a question? Send us a message.</p>
                <ContactChat session={session} profile={profile} />
            </div>
        )
    }

    if (activePage === 'delete-account') {
        return (
            <div style={pageStyle}>
                <button style={backBtn} onClick={() => setActivePage(null)}>← Back</button>
                <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '6px' }}>Delete account</h2>
                <p style={{ fontSize: '14px', color: 'var(--theme-text-secondary)', marginBottom: '24px' }}>This action is permanent and cannot be undone.</p>
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
                    <h3 style={{ fontWeight: '600', color: '#dc2626', marginBottom: '12px' }}>What will be deleted</h3>
                    {['Your account and login credentials', 'All habit logs and points history', 'Your streak and analytics data', 'All personal information including name, email, date of birth and gender'].map((item, i) => (
                        <p key={i} style={{ fontSize: '14px', color: '#dc2626', marginBottom: '6px' }}>✗ {item}</p>
                    ))}
                </div>
                {message && <p style={{ fontSize: '14px', color: 'var(--theme-primary)', marginBottom: '16px' }}>{message}</p>}
                <button onClick={async () => {
                    const confirmed = window.confirm('Are you absolutely sure? This cannot be undone.')
                    if (!confirmed) return
                    setSaving(true)
                    const { error } = await supabase.rpc('delete_user')
                    if (error) { setMessage('Something went wrong. Please contact us to delete your account.') } else { await supabase.auth.signOut() }
                    setSaving(false)
                }}
                    style={{ background: '#dc2626', color: 'white', width: '100%', fontWeight: '600', padding: '14px', borderRadius: '8px', cursor: 'pointer', fontSize: '15px' }}>
                    Permanently delete my account
                </button>
            </div>
        )
    }

    // Main settings menu
    return (
        <div style={{ minHeight: '100vh', background: 'var(--theme-bg)', paddingBottom: '96px' }}>
            <div style={{ maxWidth: '448px', margin: '0 auto', padding: '32px 16px' }}>

                {/* Profile card */}
                <div style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', background: 'var(--theme-primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', color: 'var(--theme-primary)', flexShrink: '0' }}>
                            {profile?.full_name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                            <p style={{ fontWeight: '600', color: 'var(--theme-text)', fontSize: '16px' }}>{profile?.full_name || 'User'}</p>
                            <p style={{ fontSize: '14px', color: 'var(--theme-text-secondary)', marginTop: '2px' }}>{session?.user?.email}</p>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                                <span style={{ background: 'var(--theme-primary)', color: 'white', fontSize: '11px', padding: '2px 10px', borderRadius: '20px', textTransform: 'capitalize' }}>
                                    {profile?.tier || 'free'} plan
                                </span>
                                {getMemberDays() !== null && (
                                    <span style={{ background: 'var(--theme-bg)', color: 'var(--theme-text-secondary)', fontSize: '11px', padding: '2px 10px', borderRadius: '20px', border: '1px solid var(--theme-border)' }}>
                                        Member for {getMemberDays() === 0 ? 'less than a day' : `${getMemberDays()} ${getMemberDays() === 1 ? 'day' : 'days'}`}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Menu items */}
                <div style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px' }}>
                    {menuItems.map((item, index) => (
                        <button key={item.key} onClick={() => setActivePage(item.key)}
                            style={{
                                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '16px 20px', background: 'none', cursor: 'pointer', transition: 'background 0.15s',
                                borderBottom: index !== menuItems.length - 1 ? '1px solid var(--theme-border)' : 'none',
                            }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                                <span style={{ fontSize: '15px', color: 'var(--theme-text)' }}>{item.label}</span>
                            </div>
                            <span style={{ color: 'var(--theme-text-muted)', fontSize: '16px' }}>→</span>
                        </button>
                    ))}
                </div>

                {/* Sign out */}
                <button onClick={() => { const confirmed = window.confirm('Are you sure you want to sign out?'); if (confirmed) onSignOut() }}
                    style={{ width: '100%', background: 'var(--theme-card)', border: '1px solid var(--theme-border)', color: '#dc2626', fontWeight: '500', padding: '16px', borderRadius: '16px', cursor: 'pointer', fontSize: '15px', marginBottom: '12px' }}>
                    Sign out
                </button>

                <button onClick={() => setActivePage('delete-account')}
                    style={{ width: '100%', background: 'var(--theme-card)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)', fontWeight: '500', padding: '16px', borderRadius: '16px', cursor: 'pointer', fontSize: '15px' }}>
                    Delete account
                </button>

                <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)', textAlign: 'center', marginTop: '24px' }}>Niyama · Version 1.0.0 Beta</p>

            </div>
        </div>
    )
}