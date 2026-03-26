import { useState } from 'react'
import { supabase } from '../supabase'

export default function PersonalDetails({ userId, onContinue }) {
    const [day, setDay] = useState('')
    const [month, setMonth] = useState('')
    const [year, setYear] = useState('')
    const [gender, setGender] = useState('')
    const [theme, setTheme] = useState('')
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]

    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 100 }, (_, i) => currentYear - i)
    const days = Array.from({ length: 31 }, (_, i) => i + 1)

    function calculateAge(d, m, y) {
        const today = new Date()
        const birth = new Date(y, m - 1, d)
        let age = today.getFullYear() - birth.getFullYear()
        const monthDiff = today.getMonth() - birth.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--
        }
        return age
    }

    function handleGenderSelect(g) {
        setGender(g)
        // Pre-select theme based on gender but allow override
        if (g === 'Female') {
            setTheme('salmon')
        } else {
            setTheme('sage')
        }
    }

    async function handleContinue() {
        if (!day || !month || !year) {
            setMessage('Please enter your date of birth.')
            return
        }
        if (!gender) {
            setMessage('Please select your gender.')
            return
        }
        if (!theme) {
            setMessage('Please select your preferred theme.')
            return
        }

        const age = calculateAge(parseInt(day), parseInt(month), parseInt(year))

        // Block under 13
        if (age < 13) {
            setMessage('Sorry — Niyama is not available for users under 13 years of age.')
            return
        }

        setSaving(true)
        const isMinor = age < 18
        const dob = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

        await supabase.from('profiles').update({
            gender,
            date_of_birth: dob,
            age,
            is_minor: isMinor,
            color_theme: theme,
        }).eq('id', userId)

        onContinue(isMinor, theme)
        setSaving(false)
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white px-4 py-10 max-w-lg mx-auto">

            {/* Beta banner */}
            <div className="text-center mb-6">
                <span className="bg-amber-900 text-amber-300 text-xs font-medium px-3 py-1 rounded-full">
                    Beta testing version
                </span>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold">Niyama</h1>
                <h2 className="text-xl font-semibold mt-4 text-indigo-300">Tell us about yourself</h2>
                <p className="text-gray-500 text-sm mt-2">This helps us personalise your experience</p>
            </div>

            {/* Date of birth */}
            <div className="bg-gray-900 rounded-2xl p-6 mb-4">
                <h3 className="text-white font-semibold mb-1">Date of birth</h3>
                <p className="text-gray-500 text-xs mb-4">Required to verify eligibility for rewards</p>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="text-gray-500 text-xs mb-1 block">Day</label>
                        <select
                            value={day}
                            onChange={e => setDay(e.target.value)}
                            className="w-full bg-gray-800 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Day</option>
                            {days.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-gray-500 text-xs mb-1 block">Month</label>
                        <select
                            value={month}
                            onChange={e => setMonth(e.target.value)}
                            className="w-full bg-gray-800 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Month</option>
                            {months.map((m, i) => (
                                <option key={m} value={i + 1}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-gray-500 text-xs mb-1 block">Year</label>
                        <select
                            value={year}
                            onChange={e => setYear(e.target.value)}
                            className="w-full bg-gray-800 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Year</option>
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Gender */}
            <div className="bg-gray-900 rounded-2xl p-6 mb-4">
                <h3 className="text-white font-semibold mb-1">Gender</h3>
                <p className="text-gray-500 text-xs mb-4">Helps us understand our users better</p>
                <div className="grid grid-cols-2 gap-3">
                    {['Male', 'Female', 'Other', 'Prefer not to say'].map(g => (
                        <button
                            key={g}
                            onClick={() => handleGenderSelect(g)}
                            className={`py-3 rounded-xl text-sm font-medium transition border ${gender === g
                                    ? 'bg-indigo-600 border-indigo-500 text-white'
                                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                                }`}
                        >
                            {g}
                        </button>
                    ))}
                </div>
            </div>

            {/* Color theme */}
            <div className="bg-gray-900 rounded-2xl p-6 mb-6">
                <h3 className="text-white font-semibold mb-1">Choose your theme</h3>
                <p className="text-gray-500 text-xs mb-4">You can change this anytime in Settings</p>
                <div className="grid grid-cols-2 gap-4">

                    {/* Theme A — Sage */}
                    <button
                        onClick={() => setTheme('sage')}
                        className={`rounded-xl overflow-hidden border-2 transition ${theme === 'sage' ? 'border-indigo-500' : 'border-gray-700'
                            }`}
                    >
                        <div style={{ background: '#F4F7F5' }} className="p-3">
                            <div style={{ background: '#5A8A78' }} className="rounded-lg p-2 mb-2">
                                <div className="h-2 rounded bg-white opacity-60 mb-1"></div>
                                <div className="h-2 rounded bg-white opacity-40 w-3/4"></div>
                            </div>
                            <div style={{ background: '#FFFFFF', border: '1px solid #D9E5DF' }} className="rounded-lg p-2">
                                <div className="h-1.5 rounded mb-1" style={{ background: '#5A8A78', width: '60%' }}></div>
                                <div className="h-1.5 rounded mb-1" style={{ background: '#5A8A78', width: '80%' }}></div>
                                <div className="h-5 rounded mt-2" style={{ background: '#D4735F' }}></div>
                            </div>
                        </div>
                        <div style={{ background: '#F4F7F5', borderTop: '1px solid #D9E5DF' }} className="py-2">
                            <p className="text-xs font-medium text-center" style={{ color: '#1A1A1A' }}>Sage</p>
                            <p className="text-xs text-center" style={{ color: '#6B7280' }}>Green dominant</p>
                        </div>
                    </button>

                    {/* Theme B — Salmon */}
                    <button
                        onClick={() => setTheme('salmon')}
                        className={`rounded-xl overflow-hidden border-2 transition ${theme === 'salmon' ? 'border-indigo-500' : 'border-gray-700'
                            }`}
                    >
                        <div style={{ background: '#F7F4F4' }} className="p-3">
                            <div style={{ background: '#D4735F' }} className="rounded-lg p-2 mb-2">
                                <div className="h-2 rounded bg-white opacity-60 mb-1"></div>
                                <div className="h-2 rounded bg-white opacity-40 w-3/4"></div>
                            </div>
                            <div style={{ background: '#FFFFFF', border: '1px solid #E5D9D5' }} className="rounded-lg p-2">
                                <div className="h-1.5 rounded mb-1" style={{ background: '#D4735F', width: '60%' }}></div>
                                <div className="h-1.5 rounded mb-1" style={{ background: '#D4735F', width: '80%' }}></div>
                                <div className="h-5 rounded mt-2" style={{ background: '#5A8A78' }}></div>
                            </div>
                        </div>
                        <div style={{ background: '#F7F4F4', borderTop: '1px solid #E5D9D5' }} className="py-2">
                            <p className="text-xs font-medium text-center" style={{ color: '#1A1A1A' }}>Salmon</p>
                            <p className="text-xs text-center" style={{ color: '#6B7280' }}>Pink dominant</p>
                        </div>
                    </button>
                </div>
            </div>

            {message && (
                <div className="bg-red-950 border border-red-800 rounded-lg p-3 mb-4">
                    <p className="text-red-300 text-sm text-center">{message}</p>
                </div>
            )}

            <button
                onClick={handleContinue}
                disabled={saving}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg transition"
            >
                {saving ? 'Saving...' : 'Continue'}
            </button>

        </div>
    )
}