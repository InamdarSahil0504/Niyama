import { useState } from 'react'
export default function Tutorial({ profile, onComplete }) {
    const [step, setStep] = useState(0)

    const steps = [
        {
            target: 'streak',
            title: '🔥 Your streak',
            message: 'This tracks your consecutive days with all 4 habits completed. Keep the flame alive — miss a day and it resets to zero!',
            arrow: 'bottom',
        },
        {
            target: 'habits',
            title: '✅ Your daily habits',
            message: 'Check off each habit you complete today. You can save a draft during the day and submit your final results before midnight.',
            arrow: 'top',
        },
        {
            target: 'points',
            title: '⭐ Your points',
            message: 'Every habit earns you 100 points. Complete all 4 for a 100 point bonus. A perfect day is worth 750 points total.',
            arrow: 'top',
        },
        {
            target: 'stats',
            title: '📊 Your stats',
            message: 'Track your monthly and all-time progress here. Your successful days count towards reward eligibility each month.',
            arrow: 'top',
        },
        {
            target: 'rewards',
            title: '🎁 Your rewards',
            message: 'Complete 7 or more successful days in a month to qualify for a real monetary reward. Your points determine how much you earn.',
            arrow: 'top',
        },
        {
            target: 'nav',
            title: '🗺️ Navigate the app',
            message: 'Use the tabs at the bottom to explore your Analytics, Rewards catalogue and Settings. You can replay this tour anytime from Settings → Getting started.',
            arrow: 'bottom',
        },
    ]

    const current = steps[step]
    const isLast = step === steps.length - 1

    const tooltipPositions = {
        streak: { top: '185px' },
        habits: { top: '285px' },
        points: { top: '390px' },
        stats: { top: '490px' },
        rewards: { top: '560px' },
        nav: { bottom: '80px' },
    }

    const highlightPositions = {
        streak: { top: '70px', height: '90px' },
        habits: { top: '168px', height: '160px' },
        points: { top: '168px', height: '160px' },
        stats: { top: '335px', height: '110px' },
        rewards: { top: '452px', height: '80px' },
        nav: { bottom: '0px', height: '60px' },
    }

    const highlight = highlightPositions[current.target]
    const tooltip = tooltipPositions[current.target]

    return (
        <>
            {/* Semi-transparent overlay */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                pointerEvents: 'none',
            }}>
                {/* Top overlay */}
                <div style={{
                    position: 'absolute', left: 0, right: 0, top: 0,
                    height: highlight.top || 'auto',
                    background: 'rgba(0,0,0,0.45)',
                    bottom: highlight.top ? 'auto' : highlight.bottom ? `calc(${highlight.bottom} + ${highlight.height})` : 'auto',
                }} />
                {/* Bottom overlay */}
                {highlight.top && (
                    <div style={{
                        position: 'absolute', left: 0, right: 0,
                        top: `calc(${highlight.top} + ${highlight.height})`,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.45)',
                    }} />
                )}
                {/* Highlight border */}
                <div style={{
                    position: 'absolute', left: '12px', right: '12px',
                    top: highlight.top || 'auto',
                    bottom: highlight.bottom || 'auto',
                    height: highlight.height,
                    border: '2px solid #D4735F',
                    borderRadius: '16px',
                    boxShadow: '0 0 0 2px rgba(212,115,95,0.3)',
                }} />
            </div>

            {/* Tooltip card */}
            <div style={{
                position: 'fixed',
                left: '16px', right: '16px',
                zIndex: 1001,
                maxWidth: '416px',
                margin: '0 auto',
                ...tooltip,
            }}>
                {/* Arrow up */}
                {current.arrow === 'bottom' && (
                    <div style={{
                        width: 0, height: 0,
                        borderLeft: '10px solid transparent',
                        borderRight: '10px solid transparent',
                        borderBottom: '12px solid white',
                        marginLeft: '20px', marginBottom: '-1px',
                    }} />
                )}

                <div style={{
                    background: 'white',
                    borderRadius: '14px',
                    padding: '16px',
                    border: '1px solid #D9E5DF',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                }}>
                    {/* Step indicators */}
                    <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                        {steps.map((_, i) => (
                            <div key={i} style={{
                                height: '4px',
                                borderRadius: '2px',
                                flex: i === step ? '2' : '1',
                                background: i <= step ? '#5A8A78' : '#D9E5DF',
                                transition: 'all 0.3s',
                            }} />
                        ))}
                    </div>

                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A1A', marginBottom: '6px' }}>{current.title}</p>
                    <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: '1.6', marginBottom: '12px' }}>{current.message}</p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button
                            onClick={onComplete}
                            style={{ fontSize: '12px', color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                            Skip tour
                        </button>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {step > 0 && (
                                <button
                                    onClick={() => setStep(step - 1)}
                                    style={{ background: 'none', border: '1px solid #D9E5DF', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', color: '#6B7280', cursor: 'pointer' }}>
                                    ← Back
                                </button>
                            )}
                            <button
                                onClick={() => isLast ? onComplete() : setStep(step + 1)}
                                style={{ background: '#5A8A78', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                {isLast ? 'Got it! 🎉' : 'Next →'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Arrow down */}
                {current.arrow === 'top' && (
                    <div style={{
                        width: 0, height: 0,
                        borderLeft: '10px solid transparent',
                        borderRight: '10px solid transparent',
                        borderTop: '12px solid white',
                        marginLeft: '20px', marginTop: '-1px',
                    }} />
                )}
            </div>
        </>
    )
}