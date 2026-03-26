import { useState } from 'react'
import { supabase } from '../supabase'
import About from './About'
import FounderStory from './FounderStory'

const FEEDBACK_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScGtdoAUJ-9JPWYeqbd2QH71qPXFJcERubHiSjvKOMxLc1cxw/viewform?usp=header'

export default function Settings({ profile, session, onSignOut }) {
    const [activePage, setActivePage] = useState(null)
    const [message, setMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [saving, setSaving] = useState(false)
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
        await supabase.from('contact_messages').insert({
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

    function getMemberDays() {
        if (!profile?.created_at) return null
        const created = new Date(profile.created_at)
        const today = new Date()
        const diffDays = Math.floor((today - created) / (1000 * 60 * 60 * 24))
        return diffDays
    }

    const menuItems = [
        { key: 'founder', label: "Founder's story", icon: '✨' },
        { key: 'about', label: 'About Niyama', icon: '📖' },
        { key: 'rules', label: 'Rules and points system', icon: '📜' },
        { key: 'tiers', label: 'Subscription tiers', icon: '🏆' },
        { key: 'habits', label: 'Habit importance', icon: '💪' },
        { key: 'legal', label: 'Legal disclaimer', icon: '📋' },
        { key: 'terms', label: 'Terms of service', icon: '📄' },
        { key: 'privacy', label: 'Privacy policy', icon: '🔒' },
        { key: 'theme', label: 'Change theme', icon: '🎨' },
        { key: 'feedback', label: 'Feedback form', icon: '📝' },
        { key: 'contact', label: 'Contact us', icon: '💬' },
    ]

    if (activePage === 'founder') {
        return (
            <div className="min-h-screen bg-gray-950 text-white px-4 py-8 max-w-lg mx-auto pb-24">
                <button onClick={() => setActivePage(null)} className="text-indigo-400 text-sm mb-6 flex items-center gap-1">
                    &larr; Back
                </button>
                <FounderStory onContinue={() => setActivePage(null)} minimal={true} showButton={false} />
            </div>
        )
    }

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

    if (activePage === 'rules') {
        return (
            <div className="min-h-screen bg-gray-950 text-white px-4 py-8 max-w-lg mx-auto pb-24">
                <button onClick={() => setActivePage(null)} className="text-indigo-400 text-sm mb-6 flex items-center gap-1">
                    &larr; Back
                </button>
                <h2 className="text-xl font-bold mb-6">How Niyama works</h2>

                <div className="bg-gray-900 rounded-2xl p-6 mb-4">
                    <h3 className="text-white font-semibold mb-4">Your 4 daily habits</h3>
                    <div className="space-y-3 text-sm">
                        {[
                            { habit: 'Wake before 7:30 AM', complete: '+100 pts', incomplete: '-50 pts' },
                            { habit: 'Steps 10,000 or more', complete: '+100 pts', incomplete: '-75 pts' },
                            { habit: 'Screen time under 2 hrs', complete: '+100 pts', incomplete: '-75 pts' },
                            { habit: 'Sleep by 10:30 PM', complete: '+100 pts', incomplete: '-50 pts' },
                        ].map(item => (
                            <div key={item.habit} className="flex justify-between items-center">
                                <span className="text-gray-400">{item.habit}</span>
                                <div className="flex gap-2 text-xs">
                                    <span className="text-green-400">{item.complete}</span>
                                    <span className="text-gray-600">/</span>
                                    <span className="text-red-400">{item.incomplete}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-gray-900 rounded-2xl p-6 mb-4">
                    <h3 className="text-white font-semibold mb-4">Points system</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-gray-400">Base points per day</span><span className="font-medium">250 pts</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Per habit completed</span><span className="text-green-400 font-medium">+100 pts</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">All 4 habits bonus</span><span className="text-green-400 font-medium">+100 pts</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Perfect day total</span><span className="font-medium">750 pts</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Worst day total</span><span className="font-medium">0 pts</span></div>
                        <div className="border-t border-gray-800 pt-3 flex justify-between">
                            <span className="text-gray-400">Points to money</span>
                            <span className="text-green-400 font-medium">1,000 pts = $1.00</span>
                        </div>
                        <div className="flex justify-between"><span className="text-gray-400">Maximum monthly</span><span className="font-medium">22,500 pts = $22.50</span></div>
                    </div>
                </div>

                <div className="bg-gray-900 rounded-2xl p-6 mb-4">
                    <h3 className="text-white font-semibold mb-4">Reward eligibility rules</h3>
                    <div className="space-y-3 text-sm text-gray-400">
                        <div className="flex gap-3"><span className="text-indigo-400 font-bold">1.</span><p>Minimum of <span className="text-white font-medium">7 successful days</span> per month to qualify. A successful day means all 4 habits completed.</p></div>
                        <div className="flex gap-3"><span className="text-indigo-400 font-bold">2.</span><p>No more than <span className="text-white font-medium">5 consecutive inactive days</span>. Exceeding this disqualifies you from rewards that month.</p></div>
                        <div className="flex gap-3"><span className="text-indigo-400 font-bold">3.</span><p>Reward = <span className="text-white font-medium">min(points value, tier cap)</span>. Points value = monthly points divided by 1,000.</p></div>
                        <div className="flex gap-3"><span className="text-indigo-400 font-bold">4.</span><p>Rewards reset at the start of every month. Points do not carry over.</p></div>
                        <div className="flex gap-3"><span className="text-indigo-400 font-bold">5.</span><p>Premium users with a <span className="text-white font-medium">25-day continuous streak</span> receive a flat <span className="text-white font-medium">$25 payout</span>.</p></div>
                    </div>
                </div>

                <div className="bg-red-950 border border-red-800 rounded-2xl p-6">
                    <h3 className="text-red-300 font-semibold mb-3">Honor system and fair play</h3>
                    <div className="space-y-2 text-sm text-red-200">
                        <p>Niyama operates on an <span className="font-medium text-white">honor system</span>. All habit logging is self-reported and trust-based.</p>
                        <p>Users found <span className="font-medium text-white">fraudulently reporting habits</span> will be <span className="font-medium text-white">permanently disqualified</span> from rewards and may have their account suspended.</p>
                        <p>Niyama reserves the right to <span className="font-medium text-white">audit user behaviour</span> and revoke eligibility at any time.</p>
                    </div>
                </div>
            </div>
        )
    }

    if (activePage === 'tiers') {
        return (
            <div className="min-h-screen bg-gray-950 text-white px-4 py-8 max-w-lg mx-auto pb-24">
                <button onClick={() => setActivePage(null)} className="text-indigo-400 text-sm mb-6 flex items-center gap-1">
                    &larr; Back
                </button>
                <h2 className="text-xl font-bold mb-6">Subscription tiers</h2>

                <div className="space-y-4 mb-6">
                    <div className="bg-gray-900 rounded-2xl p-6">
                        <div className="flex justify-between items-start mb-3">
                            <div><h3 className="text-lg font-semibold">Free</h3><p className="text-gray-500 text-sm">Get started with habit tracking</p></div>
                            <span className="text-2xl font-bold">$0</span>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-gray-400">Monthly reward cap</span><span className="text-green-400 font-medium">$5.00</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Habit tracking</span><span className="text-white">All 4 habits</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Streak tracking</span><span className="text-white">Included</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">25-day streak bonus</span><span className="text-gray-600">Not available</span></div>
                        </div>
                    </div>

                    <div className="bg-gray-900 rounded-2xl p-6 border border-indigo-700">
                        <div className="bg-indigo-900 text-indigo-300 text-xs px-2 py-0.5 rounded-full inline-block mb-3">Popular</div>
                        <div className="flex justify-between items-start mb-3">
                            <div><h3 className="text-lg font-semibold">Plus</h3><p className="text-gray-500 text-sm">Double your reward potential</p></div>
                            <div className="text-right"><span className="text-2xl font-bold">$4.99</span><p className="text-gray-500 text-xs">/month</p></div>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-gray-400">Monthly reward cap</span><span className="text-green-400 font-medium">$10.00</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Habit tracking</span><span className="text-white">All 4 habits</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Streak tracking</span><span className="text-white">Included</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">25-day streak bonus</span><span className="text-gray-600">Not available</span></div>
                        </div>
                    </div>

                    <div className="bg-gray-900 rounded-2xl p-6 border border-amber-700">
                        <div className="bg-amber-900 text-amber-300 text-xs px-2 py-0.5 rounded-full inline-block mb-3">Best value</div>
                        <div className="flex justify-between items-start mb-3">
                            <div><h3 className="text-lg font-semibold">Premium</h3><p className="text-gray-500 text-sm">Unlock the streak bonus</p></div>
                            <div className="text-right"><span className="text-2xl font-bold">$14.99</span><p className="text-gray-500 text-xs">/month</p></div>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-gray-400">Monthly reward cap</span><span className="text-green-400 font-medium">$20.00</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Habit tracking</span><span className="text-white">All 4 habits</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Streak tracking</span><span className="text-white">Included</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">25-day streak bonus</span><span className="text-green-400 font-medium">Up to $25 payout</span></div>
                        </div>
                    </div>
                </div>

                <div className="bg-amber-950 border border-amber-800 rounded-2xl p-5">
                    <h3 className="text-amber-300 font-semibold mb-2">Beta testing notice</h3>
                    <p className="text-sm text-amber-200">During the beta testing period no subscription fees will be charged and no monetary rewards will be paid out. All tiers are fully functional so you can experience the complete Niyama system.</p>
                </div>
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
                    <p className="text-gray-400 text-sm leading-relaxed">Research shows that up to 40% of our daily actions are habits rather than conscious decisions. The habits you build today shape the person you become tomorrow. Small, consistent actions compound over time into remarkable results.</p>
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
                    <p className="text-gray-400 text-sm leading-relaxed">Niyama combines the science of habit formation with real financial incentives. By attaching tangible rewards to consistent behavior, we make discipline something worth working towards — every single day.</p>
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
                    <p className="text-gray-400 text-sm leading-relaxed">Niyama is currently in beta testing. By using this app you agree that the service is provided "as is" without any warranties of any kind. No subscription fees will be charged and no monetary rewards will be paid out during the beta period.</p>
                    <p className="text-gray-400 text-sm leading-relaxed mt-4">Point values, reward caps, subscription tiers and app features are subject to change at any time without notice. Niyama is not responsible for any decisions made based on information displayed in the app.</p>
                    <p className="text-gray-400 text-sm leading-relaxed mt-4">The reward system is subject to eligibility verification and Niyama reserves the right to withhold rewards in cases of suspected misuse or fraudulent activity.</p>
                    <p className="text-gray-400 text-sm leading-relaxed mt-4">This beta version is intended for testing purposes only. All data collected during beta testing may be reset before the official launch.</p>
                </div>
            </div>
        )
    }

    if (activePage === 'terms') {
        return (
            <div className="min-h-screen bg-gray-950 text-white px-4 py-8 max-w-lg mx-auto pb-24">
                <button onClick={() => setActivePage(null)} className="text-indigo-400 text-sm mb-6 flex items-center gap-1">
                    &larr; Back
                </button>
                <h2 className="text-xl font-bold mb-6">Terms of service</h2>
                <div className="bg-gray-900 rounded-2xl p-6 mb-4">
                    <h3 className="text-white font-semibold mb-3">Acceptance of terms</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">By creating an account and using Niyama you agree to be bound by these Terms of Service. If you do not agree to these terms please do not use the app.</p>
                </div>
                <div className="bg-gray-900 rounded-2xl p-6 mb-4">
                    <h3 className="text-white font-semibold mb-3">Eligibility</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">You must be at least 18 years of age to participate in the rewards system. Users between 13 and 17 may use the habit tracking features but are not eligible for monetary rewards or paid subscriptions. Users under 13 are not permitted to use Niyama.</p>
                </div>
                <div className="bg-gray-900 rounded-2xl p-6 mb-4">
                    <h3 className="text-white font-semibold mb-3">Honor system and fair use</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">Niyama operates on an honor system. All habit logging is self-reported. Users who fraudulently report habit completion to game the reward system will be permanently disqualified from rewards and may have their account suspended. Niyama reserves the right to audit user behavior and revoke reward eligibility at any time.</p>
                </div>
                <div className="bg-gray-900 rounded-2xl p-6 mb-4">
                    <h3 className="text-white font-semibold mb-3">Rewards</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">Rewards are subject to eligibility rules including minimum successful days and inactivity limits. Niyama reserves the right to modify, suspend or terminate the rewards program at any time. Reward values, tier caps and eligibility criteria are subject to change without notice. During beta testing no monetary rewards will be paid out.</p>
                </div>
                <div className="bg-gray-900 rounded-2xl p-6 mb-4">
                    <h3 className="text-white font-semibold mb-3">Subscriptions</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">Paid subscriptions are billed monthly. The first month may be prorated based on your signup date. Subscriptions automatically renew unless cancelled. During beta testing no subscription fees will be charged.</p>
                </div>
                <div className="bg-gray-900 rounded-2xl p-6 mb-4">
                    <h3 className="text-white font-semibold mb-3">Limitation of liability</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">Niyama is provided "as is" without warranties of any kind. Niyama is not responsible for any decisions made based on information displayed in the app. The app is not a medical device and does not provide medical advice. Always consult a qualified healthcare professional before making significant lifestyle changes.</p>
                </div>
                <div className="bg-gray-900 rounded-2xl p-6">
                    <h3 className="text-white font-semibold mb-3">Changes to terms</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">Niyama reserves the right to update these terms at any time. Continued use of the app after changes constitutes acceptance of the new terms. Last updated: March 2026.</p>
                </div>
            </div>
        )
    }

    if (activePage === 'privacy') {
        return (
            <div className="min-h-screen bg-gray-950 text-white px-4 py-8 max-w-lg mx-auto pb-24">
                <button onClick={() => setActivePage(null)} className="text-indigo-400 text-sm mb-6 flex items-center gap-1">
                    &larr; Back
                </button>
                <h2 className="text-xl font-bold mb-6">Privacy policy</h2>
                <div className="bg-gray-900 rounded-2xl p-6 mb-4">
                    <h3 className="text-white font-semibold mb-3">What we collect</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">We collect the following personal information when you create an account and use Niyama: full name, email address, date of birth, gender, subscription tier, daily habit logs, points and streak data.</p>
                </div>
                <div className="bg-gray-900 rounded-2xl p-6 mb-4">
                    <h3 className="text-white font-semibold mb-3">How we use your data</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">Your data is used to provide the Niyama service including habit tracking, points calculation, reward eligibility and personalisation. We use aggregated and anonymised data to improve the app. We do not sell your personal data to third parties.</p>
                </div>
                <div className="bg-gray-900 rounded-2xl p-6 mb-4">
                    <h3 className="text-white font-semibold mb-3">Data storage</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">Your data is stored securely using Supabase, a cloud database provider. Data is encrypted in transit and at rest. We retain your data for as long as your account is active. You may request deletion of your account and all associated data at any time through the Settings menu.</p>
                </div>
                <div className="bg-gray-900 rounded-2xl p-6 mb-4">
                    <h3 className="text-white font-semibold mb-3">Third party services</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">Niyama uses the following third party services: Supabase (database and authentication), Vercel (hosting), Stripe (payment processing — coming soon), Tremendous (reward payouts — coming soon). Each service has its own privacy policy governing their use of your data.</p>
                </div>
                <div className="bg-gray-900 rounded-2xl p-6 mb-4">
                    <h3 className="text-white font-semibold mb-3">Your rights</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">You have the right to access, correct or delete your personal data at any time. To exercise these rights please use the account deletion option in Settings or contact us through the Contact Us page. California residents have additional rights under CCPA including the right to know what data we collect and the right to opt out of data sales (we do not sell data).</p>
                </div>
                <div className="bg-gray-900 rounded-2xl p-6 mb-4">
                    <h3 className="text-white font-semibold mb-3">Children's privacy</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">Niyama does not knowingly collect personal information from children under 13. If we become aware that a user is under 13 we will immediately delete their account and all associated data. Users between 13 and 17 have restricted access to the rewards system.</p>
                </div>
                <div className="bg-gray-900 rounded-2xl p-6">
                    <h3 className="text-white font-semibold mb-3">Contact</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">If you have any questions about this Privacy Policy please contact us through the Contact Us page in Settings. Last updated: March 2026.</p>
                </div>
            </div>
        )
    }
    if (activePage === 'theme') {
        return (
            <div className="min-h-screen bg-gray-950 text-white px-4 py-8 max-w-lg mx-auto pb-24">
                <button onClick={() => setActivePage(null)} className="text-indigo-400 text-sm mb-6 flex items-center gap-1">
                    &larr; Back
                </button>
                <h2 className="text-xl font-bold mb-2">Change theme</h2>
                <p className="text-gray-400 text-sm mb-6">Choose your preferred color theme.</p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Sage theme */}
                    <button
                        onClick={async () => {
                            await supabase.from('profiles').update({ color_theme: 'sage' }).eq('id', session.user.id)
                            const root = document.documentElement
                            root.style.setProperty('--theme-bg', '#F4F7F5')
                            root.style.setProperty('--theme-primary', '#5A8A78')
                            root.style.setProperty('--theme-secondary', '#D4735F')
                            root.style.setProperty('--theme-border', '#D9E5DF')
                            root.style.setProperty('--theme-primary-light', '#EAF2EE')
                            root.style.setProperty('--theme-secondary-light', '#FCEEE9')
                            setActivePage(null)
                        }}
                        className={`rounded-xl overflow-hidden border-2 transition ${profile?.color_theme === 'sage' ? 'border-indigo-500' : 'border-gray-700'}`}
                    >
                        <div style={{ background: '#F4F7F5' }} className="p-3">
                            <div style={{ background: '#5A8A78' }} className="rounded-lg p-2 mb-2">
                                <div className="h-2 rounded bg-white opacity-60 mb-1"></div>
                                <div className="h-2 rounded bg-white opacity-40 w-3/4"></div>
                            </div>
                            <div style={{ background: '#FFFFFF', border: '1px solid #D9E5DF' }} className="rounded-lg p-2">
                                <div className="h-1.5 rounded mb-1" style={{ background: '#5A8A78', width: '60%' }}></div>
                                <div className="h-5 rounded mt-2" style={{ background: '#D4735F' }}></div>
                            </div>
                        </div>
                        <div style={{ background: '#F4F7F5', borderTop: '1px solid #D9E5DF' }} className="py-2">
                            <p className="text-xs font-medium text-center" style={{ color: '#1A1A1A' }}>Sage</p>
                            <p className="text-xs text-center" style={{ color: '#6B7280' }}>Green dominant</p>
                        </div>
                    </button>

                    {/* Salmon theme */}
                    <button
                        onClick={async () => {
                            await supabase.from('profiles').update({ color_theme: 'salmon' }).eq('id', session.user.id)
                            const root = document.documentElement
                            root.style.setProperty('--theme-bg', '#F7F4F4')
                            root.style.setProperty('--theme-primary', '#D4735F')
                            root.style.setProperty('--theme-secondary', '#5A8A78')
                            root.style.setProperty('--theme-border', '#E5D9D5')
                            root.style.setProperty('--theme-primary-light', '#FCEEE9')
                            root.style.setProperty('--theme-secondary-light', '#EAF2EE')
                            setActivePage(null)
                        }}
                        className={`rounded-xl overflow-hidden border-2 transition ${profile?.color_theme === 'salmon' ? 'border-indigo-500' : 'border-gray-700'}`}
                    >
                        <div style={{ background: '#F7F4F4' }} className="p-3">
                            <div style={{ background: '#D4735F' }} className="rounded-lg p-2 mb-2">
                                <div className="h-2 rounded bg-white opacity-60 mb-1"></div>
                                <div className="h-2 rounded bg-white opacity-40 w-3/4"></div>
                            </div>
                            <div style={{ background: '#FFFFFF', border: '1px solid #E5D9D5' }} className="rounded-lg p-2">
                                <div className="h-1.5 rounded mb-1" style={{ background: '#D4735F', width: '60%' }}></div>
                                <div className="h-5 rounded mt-2" style={{ background: '#5A8A78' }}></div>
                            </div>
                        </div>
                        <div style={{ background: '#F7F4F4', borderTop: '1px solid #E5D9D5' }} className="py-2">
                            <p className="text-xs font-medium text-center" style={{ color: '#1A1A1A' }}>Salmon</p>
                            <p className="text-xs text-center" style={{ color: '#6B7280' }}>Pink dominant</p>
                        </div>
                    </button>
                </div>

                {profile?.color_theme === 'sage' || !profile?.color_theme ? (
                    <p className="text-gray-500 text-xs text-center">Currently using Sage theme</p>
                ) : (
                    <p className="text-gray-500 text-xs text-center">Currently using Salmon theme</p>
                )}
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
                    <p className="text-gray-400 text-sm mb-6">Tap the button below to open our feedback form. It takes about 3 minutes to complete.</p>
                    <a href={FEEDBACK_FORM_URL} target="_blank" rel="noopener noreferrer" className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-8 rounded-lg transition">
                        Open feedback form
                    </a>
                </div>
            </div>
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

                <div className="bg-gray-900 rounded-2xl p-4 mb-4 space-y-3 min-h-48">
                    {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${msg.from === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-gray-800 text-gray-300 rounded-bl-sm'}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {sending && (
                        <div className="flex justify-start">
                            <div className="bg-gray-800 text-gray-500 text-sm px-4 py-2 rounded-2xl rounded-bl-sm">Typing...</div>
                        </div>
                    )}
                </div>

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

    if (activePage === 'delete-account') {
        return (
            <div className="min-h-screen bg-gray-950 text-white px-4 py-8 max-w-lg mx-auto pb-24">
                <button onClick={() => setActivePage(null)} className="text-indigo-400 text-sm mb-6 flex items-center gap-1">
                    &larr; Back
                </button>
                <h2 className="text-xl font-bold mb-2">Delete account</h2>
                <p className="text-gray-400 text-sm mb-6">This action is permanent and cannot be undone.</p>

                <div className="bg-red-950 border border-red-800 rounded-2xl p-6 mb-6">
                    <h3 className="text-red-300 font-semibold mb-3">What will be deleted</h3>
                    <div className="space-y-2 text-sm text-red-200">
                        <p>✗ Your account and login credentials</p>
                        <p>✗ All habit logs and points history</p>
                        <p>✗ Your streak and analytics data</p>
                        <p>✗ All personal information including name, email, date of birth and gender</p>
                    </div>
                </div>

                {message && <p className="text-sm text-indigo-400 mb-4">{message}</p>}

                <button
                    onClick={async () => {
                        const confirmed = window.confirm('Are you absolutely sure? This cannot be undone.')
                        if (!confirmed) return
                        setSaving(true)
                        const { error } = await supabase.rpc('delete_user')
                        if (error) {
                            setMessage('Something went wrong. Please contact us to delete your account.')
                        } else {
                            await supabase.auth.signOut()
                        }
                        setSaving(false)
                    }}
                    className="w-full bg-red-900 hover:bg-red-800 text-white font-semibold py-3 rounded-lg transition"
                >
                    Permanently delete my account
                </button>
            </div>
        )
    }

    // Main settings menu
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
                        <div className="flex gap-2 mt-1 flex-wrap">
                            <span className="bg-indigo-900 text-indigo-300 text-xs px-2 py-0.5 rounded-full capitalize">
                                {profile?.tier || 'free'} plan
                            </span>
                            {getMemberDays() !== null && (
                                <span className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded-full">
                                    Member for {getMemberDays() === 0 ? 'less than a day' : `${getMemberDays()} ${getMemberDays() === 1 ? 'day' : 'days'}`}
                                </span>
                            )}
                            <p className="text-gray-700 text-xs text-center mt-4">Version 1.0.0 Beta</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Menu items */}
            <div className="bg-gray-900 rounded-2xl overflow-hidden mb-6">
                {menuItems.map((item, index) => (
                    <button
                        key={item.key}
                        onClick={() => setActivePage(item.key)}
                        className={`w-full flex items-center justify-between px-6 py-4 hover:bg-gray-800 transition ${index !== menuItems.length - 1 ? 'border-b border-gray-800' : ''}`}
                    >
                        <div className="flex items-center gap-3">
                            <span style={{ fontSize: '16px' }}>{item.icon}</span>
                            <span className="text-base">{item.label}</span>
                        </div>
                        <span className="text-gray-600">→</span>
                    </button>
                ))}
            </div>

            {/* Sign out */}
            <button
                onClick={() => {
                    const confirmed = window.confirm('Are you sure you want to sign out?')
                    if (confirmed) onSignOut()
                }}
                className="w-full bg-gray-900 hover:bg-gray-800 text-red-400 font-medium py-4 rounded-2xl transition text-sm mb-3"
            >
                Sign out
            </button>

            <button
                onClick={() => setActivePage('delete-account')}
                className="w-full bg-gray-900 hover:bg-gray-800 text-gray-600 font-medium py-4 rounded-2xl transition text-sm"
            >
                Delete account
            </button>

            <p className="text-gray-700 text-xs text-center mt-6">Niyama · Version 1.0.0 Beta</p>

        </div>
    )
}