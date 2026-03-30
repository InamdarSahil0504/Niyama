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

                {/* Opening — personal and grounding */}
                <p style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--theme-text)', fontStyle: 'italic', marginBottom: '16px' }}>
                    Hi, my name is Sahil Inamdar and I am the founder of Niyama.
                </p>

                {/* The scientific background */}
                <p style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--theme-text)', fontStyle: 'italic', marginBottom: '16px' }}>
                    Five years ago, as a young scientist with a PhD focusing on cancer immunotherapy, I embarked on my journey in the biotech industry with one purpose — developing cures for patients suffering from devastating diseases. I worked on Sepsis, Traumatic Brain Injury, Rheumatoid Arthritis and cancers currently being tested in clinical trials. Most recently, I have been focused on neurodegenerative diseases like Alzheimer's and Parkinson's. Every day in the lab I see what these diseases do to people — the loss of independence, of memory, and the inability to recognise the faces they love.
                </p>

                {/* The pivot question */}
                <p style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--theme-text)', fontStyle: 'italic', marginBottom: '16px' }}>
                    But as I spent years searching for cures, a question kept nagging at me: what if we never had to get here in the first place?
                </p>

                {/* The science of prevention */}
                <p style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--theme-text)', fontStyle: 'italic', marginBottom: '16px' }}>
                    The scientific literature is unambiguous. Sleep deprivation accelerates neurodegeneration. Sedentary behaviour drives metabolic disease. Chronic screen exposure disrupts dopamine and cortisol regulation. Irregular wake times destabilise the circadian rhythm — the biological clock governing nearly every cellular process in the body. The diseases I work on every day share a common foundation. And that foundation is built — or destroyed — by daily behaviour.
                </p>

                {/* The five habits */}
                <p style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--theme-text)', fontStyle: 'italic', marginBottom: '16px' }}>
                    The five habits in Niyama are not arbitrary. They were chosen because the evidence for each is overwhelming. Waking consistently before 7:30 AM. Reaching 10,000 steps. Limiting screen time to under 3 hours. Elevating your heart rate for 30 minutes. Being asleep before 10:30 PM. These are the highest-leverage daily behaviours known to science for extending healthspan and reducing the risk of the diseases I have spent my career trying to cure.
                </p>

                {/* The behaviour gap */}
                <p style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--theme-text)', fontStyle: 'italic', marginBottom: '16px' }}>
                    The problem was never that people didn't know this. The problem is that knowing something and doing it every single day are completely different challenges. Motivation fades. Willpower is finite. Every habit app I found relied entirely on streaks and badges — none of them changed the underlying economics of behaviour. Skipping a habit costs nothing. So people skip.
                </p>

                {/* The solution */}
                <p style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--theme-text)', fontStyle: 'italic', marginBottom: '16px' }}>
                    That's why I built Niyama. A daily discipline platform where your behaviour has real financial consequences. Consistency is rewarded. The rewards are real enough to actually change behaviour — not as a gimmick, but as a scientifically grounded intervention based on the same reinforcement principles we use in clinical research.
                </p>

                {/* The mission */}
                <p style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--theme-text)', fontStyle: 'italic', marginBottom: '0' }}>
                    The goal is simple. Living healthy every single day — not for others, but for yourself.
                </p>

                {/* Closing */}
                <div style={{ borderTop: '1px solid var(--theme-border)', marginTop: '20px', paddingTop: '20px' }}>
                    <p style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--theme-text-secondary)' }}>
                        Thank you for being one of our first beta testers. Your experience over the coming weeks will directly shape the future of Niyama. I am grateful you are here.
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