import { useState } from 'react'
import { supabase } from '../supabase'
import About from './About'

const FEEDBACK_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScGtdoAUJ-9JPWYeqbd2QH71qPXFJcERubHiSjvKOMxLc1cxw/viewform?usp=header'

export default function Settings({ profile, session, onSignOut }) {
    const [activePage, setActivePage] = useState(null)
    const [message, setMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [sent, setSent] = useState(false)
    const [chatMessages, setChatMessages] = useState([
        { from: 'support', text: 'Hi! How can we help you today?' }
    ])
    const [chatInput, setChatInput] = useState('')

    async function sendMessage() {
        if (!chatInput.trim()) return
        setSending(true)

        const userMessage = { from: 'user', text: chatInput }
        setChatMessages(prev => [...prev, userMessage])
        setChatInput('')

        await supabase
            .from('contact_messages')
            .insert({
                user_id: session.user.id,
                user_name: profile?.full_name || 'Unknown',
                email: session.user.email,
                message: chatInput,
            })

        setTimeout(() => {
            setChatMessages(prev => [...prev, {
                from: 'support',
                text: "Thanks for reaching out! We've received your message and will get back to you shortly."
            }])
            setSending(false)
        }, 800)
    }

    const menuItems = [
        { key: 'about', label: 'About Niyama', icon: '📖' },
        { key: 'habits', label: 'Habit Importance', icon: '💪' },
        { key: 'legal', label: 'Legal Disclaimer', icon: '📋' },
        { key: 'feedback', label: 'Feedback Form', icon: '📝' },
        { key: 'contact', label: 'Contact Us', icon: '💬' },
    ]

    if (activePage === 'about') {
        return (
            <div className="min-h-screen bg-gray-950 text-white px-4 py-8 max-w-lg mx-auto pb-24">
                <button onClick={() => setActivePage(null)} className="text-indigo-400 text-sm mb-6 flex items-center gap-1">
                    &larr; Back
                </button>
                <About profile={profile} />
            </div>
        )
    }

    if (activePage === 'habits') {
        return (
            <div className="min-h-screen bg-gray-950 text-white px-4 py-8 max-w-lg mx-auto pb-24">
                <button onClick={() => setActivePage(null)} className="text-indigo-400 text-sm mb-6 flex items-center gap-1">
                    &larr; Back
                </button>
                <h2 className="text-xl font-bold mb-6">Why habits matter</h2>

                <div className="bg-gray-900 rounded-2xl p-6 mb-4">
                    <h3 className="text-white font-semibold mb-3">The power of daily habits</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Research shows that up to 40% of our daily actions are habits rather than conscious decisions. The habits you build today shape the person you become tomorrow. Small, consistent actions compound over time into remarkable results.
                    </p>
                </div>

                <div className="bg-gray-900 rounded-2xl p-6 mb-4">
                    <h3 className="text-white font-semibold mb-3">Why these 4 habits?</h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-white text-sm font-medium">🌅 Waking before 7:30 AM</p>
                            <p className="text-gray-400 text-xs mt-1 leading-relaxed">Early rising gives you quiet, uninterrupted time to set intentions, exercise, and prepare mentally for the day before the world demands your attention.</p>
                        </div>
                        <div>
                            <p className="text-white text-sm font-medium">👟 10,000 steps daily</p>
                            <p className="text-gray-400 text-xs mt-1 leading-relaxed">Walking 10,000 steps reduces the risk of heart disease, improves mood through endorphin release, and builds the physical endurance that carries into mental resilience.</p>
                        </div>
                        <div>
                            <p className="text-white text-sm font-medium">📵 Screen time under 2 hours</p>
                            <p className="text-gray-400 text-xs mt-1 leading-relaxed">Excessive screen time is linked to reduced attention spans, poor sleep quality, and increased anxiety. Limiting it frees up time for meaningful activities and protects your mental health.</p>
                        </div>
                        <div>
                            <p className="text-white text-sm font-medium">🌙 Sleep by 10:30 PM</p>
                            <p className="text-gray-400 text-xs mt-1 leading-relaxed">Quality sleep is the foundation of everything. Sleeping before 10:30 PM aligns with your body's natural rhythm, improving memory consolidation, immune function, and emotional regulation.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-900 rounded-2xl p-6">
                    <h3 className="text-white font-semibold mb-3">Discipline and rewards</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Niyama combines the science of habit formation with real financial incentives. By attaching tangible rewards to consistent behavior, we make discipline something worth working towards — every single day.
                    </p>
                </div>
            </div>
        )
    }

    if (activePage === 'legal') {
        return (
            <div className="min-h-screen bg-gray-950 text-white px-4 py-8 max-w-lg mx-auto pb-24">
                <button onClick={() => setActivePage(null)} className="text-indigo-400 text-sm mb-6 flex items-center gap-1">
                    &larr; Back
                </button>
                <h2 className="text-xl font-bold mb-6">Legal disclaimer</h2>
                <div className="bg-gray-900 rounded-2xl p-6">
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Niyama is currently in beta testing. By using this app you agree that the service is provided "as is" without any warranties of any kind. No subscription fees will be charged and no monetary rewards will be paid out during the beta period.
                    </p>
                    <p className="text-gray-400 text-sm leading-relaxed mt-4">
                        Point values, reward caps, subscription tiers and app features are subject to change at any time without notice. Niyama is not responsible for any decisions made based on information displayed in the app.
                    </p>
                    <p className="text-gray-400 text-sm leading-relaxed mt-4">
                        The reward system is subject to eligibility verification and Niyama reserves the right to withhold rewards in cases of suspected misuse or fraudulent activity.
                    </p>
                    <p className="text-gray-400 text-sm leading-relaxed mt-4">
                        This beta version is intended for testing purposes only. All data collected during beta testing may be reset before the official launch.
                    </p>
                </div>
            </div>
        )
    }

    if (activePage === 'feedback') {
        return (
            <div className="min-h-screen bg-gray-950 text-white px-4 py-8 max-w-lg mx-auto pb-24">
                <button onClick={() => setActivePage(null)} className="text-indigo-400 text-sm mb-6 flex items-center gap-1">
                    &larr; Back
                </button>
                <h2 className="text-xl font-bold mb-2">Feedback form</h2>
                <p className="text-gray-400 text-sm mb-6">We'd love to hear what you think about Niyama.</p>
                <div className="bg-gray-900 rounded-2xl p-6 text-center">
                    <p className="text-gray-400 text-sm mb-6">
                        Tap the button below to open our feedback form. It takes about 3 minutes to complete.
                    </p>

                    <a href={FEEDBACK_FORM_URL} target="_blank" rel="noopener noreferrer" className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-8 rounded-lg transition">
                        Open feedback form
                    </a>
                </div>
            </div >
        )
    }

    if (activePage === 'contact') {
        return (
            <div className="min-h-screen bg-gray-950 text-white px-4 py-8 max-w-lg mx-auto pb-24">
                <button onClick={() => setActivePage(null)} className="text-indigo-400 text-sm mb-6 flex items-center gap-1">
                    &larr; Back
                </button>
                <h2 className="text-xl font-bold mb-2">Contact us</h2>
                <p className="text-gray-400 text-sm mb-6">Have a question? Send us a message and we'll get back to you.</p>

                {/* Chat messages */}
                <div className="bg-gray-900 rounded-2xl p-4 mb-4 space-y-3 min-h-48">
                    {chatMessages.map((msg, i) => (
                        <div
                            key={i}
                            className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${msg.from === 'user'
                                ? 'bg-indigo-600 text-white rounded-br-sm'
                                : 'bg-gray-800 text-gray-300 rounded-bl-sm'
                                }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {sending && (
                        <div className="flex justify-start">
                            <div className="bg-gray-800 text-gray-500 text-sm px-4 py-2 rounded-2xl rounded-bl-sm">
                                Typing...
                            </div>
                        </div>
                    )}
                </div>

                {/* Chat input */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Type your message..."
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                        className="flex-1 bg-gray-900 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={sending || !chatInput.trim()}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl transition disabled:opacity-50"
                    >
                        Send
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white px-4 py-8 max-w-lg mx-auto pb-24">

            {/* Profile card */}
            <div className="bg-gray-900 rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-900 rounded-full flex items-center justify-center text-lg font-bold text-indigo-300">
                        {profile?.full_name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                        <p className="font-semibold">{profile?.full_name || 'User'}</p>
                        <p className="text-gray-400 text-sm">{session?.user?.email}</p>
                        <span className="bg-indigo-900 text-indigo-300 text-xs px-2 py-0.5 rounded-full mt-1 inline-block capitalize">
                            {profile?.tier || 'free'} plan
                        </span>
                    </div>
                </div>
            </div>

            {/* Menu items */}
            <div className="bg-gray-900 rounded-2xl overflow-hidden mb-6">
                {menuItems.map((item, index) => (
                    <button
                        key={item.key}
                        onClick={() => setActivePage(item.key)}
                        className={`w-full flex items-center justify-between px-6 py-4 hover:bg-gray-800 transition ${index !== menuItems.length - 1 ? 'border-b border-gray-800' : ''
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <span style={{ fontSize: '16px' }}>{item.icon}</span>
                            <span className="text-sm">{item.label}</span>
                        </div>
                        <span className="text-gray-600">→</span>
                    </button>
                ))}
            </div>

            {/* Sign out */}
            <button
                onClick={onSignOut}
                className="w-full bg-gray-900 hover:bg-gray-800 text-red-400 font-medium py-4 rounded-2xl transition text-sm"
            >
                Sign Out
            </button>

        </div>
    )
}