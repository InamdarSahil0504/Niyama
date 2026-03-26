export default function FounderStory({ onContinue, minimal = false, showButton = true }) {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--theme-bg)' }} className="px-4 py-10 max-w-lg mx-auto">

            {!minimal && (
                <>
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '12px', fontWeight: '500', padding: '4px 12px', borderRadius: '20px' }}>
                            Beta testing version
                        </span>
                    </div>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--theme-text)' }}>Niyama</h1>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginTop: '12px', color: 'var(--theme-primary)' }}>A message from the founder</h2>
                    </div>
                </>
            )}

            <div style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
                {[
                    'Hi, my name is Sahil Inamdar and I am the founder of Niyama.',
                    'Five years ago, as a young scientist with a PhD focusing on cancer immunotherapy, I embarked on my journey in the biotech industry with a primary purpose of developing therapies for patients suffering from various diseases. I worked on devastating diseases humans face like Sepsis, Traumatic Brain Injury, Rheumatoid Arthritis and cancers (currently being tested in clinical trials). Most recently, I have been trying to develop therapies for neurodegenerative diseases like Alzheimer\'s and Parkinson\'s. Every day in the lab I see what these diseases do to people — the loss of independence, of memory, and importantly the inability to recognise the faces they love.',
                    'But as I spent years searching for cures, a question kept nagging at me: what if we never had to get here in the first place?',
                    'See, I am a scientist by training and by passion. I spent months researching, combing through scientific journals and clinical studies looking for answers. What I found was both simple and profound. People who maintain consistent daily habits — regular sleep, physical activity, limited screen time — have dramatically lower risk of developing the diseases I work on every day.',
                    'Yes! It is that simple. The data is not subtle. It is overwhelming. And yet most people are not doing it.',
                    'So I asked myself: why? The answer isn\'t ignorance. Everyone knows exercise is good for them. The answer is motivation. Specifically, the absence of any real external incentive to stay consistent when life gets hard.',
                    'Every habit app I found relied entirely on willpower. Streaks, badges, reminders. None of them changed the underlying economics of behavior. Skipping a habit costs nothing. So people skip.',
                    'That\'s why I built Niyama. A system where discipline is measured, consistency is rewarded, and the rewards are real enough to actually change behavior. Not as a gimmick — but as a scientifically grounded intervention based on the same reinforcement principles we use in clinical research.',
                    'The goal of Niyama is simple: Living healthy every single day — not for others, but for yourself.',
                ].map((para, i) => (
                    <p key={i} style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--theme-text)', fontStyle: 'italic', marginBottom: i < 8 ? '16px' : '0' }}>
                        {para}
                    </p>
                ))}

                <div style={{ borderTop: '1px solid var(--theme-border)', marginTop: '20px', paddingTop: '20px' }}>
                    <p style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--theme-text-secondary)' }}>
                        Thank you for being one of our first beta testers. Your feedback and experience over the coming weeks will directly shape the future of Niyama. I am grateful you are here.
                    </p>
                    <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--theme-text)', marginTop: '12px' }}>
                        — Sahil Inamdar, Founder
                    </p>
                </div>
            </div>

            {showButton && (
                <button onClick={onContinue}
                    style={{ background: 'var(--theme-primary)', color: 'white', width: '100%', fontWeight: '600', padding: '14px', borderRadius: '8px', fontSize: '15px', cursor: 'pointer' }}>
                    Continue
                </button>
            )}

        </div>
    )
}