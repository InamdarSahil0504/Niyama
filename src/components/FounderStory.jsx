export default function FounderStory({ onContinue, minimal = false }) {
    return (
        <div className="min-h-screen bg-gray-950 text-white px-4 py-10 max-w-lg mx-auto">

            {!minimal && (
                <>
                    {/* Beta banner */}
                    <div className="text-center mb-6">
                        <span className="bg-amber-900 text-amber-300 text-xs font-medium px-3 py-1 rounded-full">
                            Beta testing version
                        </span>
                    </div>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold">Niyama</h1>
                        <p className="text-gray-400 text-sm mt-1 italic">Nee-yah-ma</p>
                        <h2 className="text-xl font-semibold mt-4 text-indigo-300">A message from the founder</h2>
                    </div>
                </>
            )}

            {/* Story */}
            <div className="bg-gray-900 rounded-2xl p-6 mb-6 space-y-4">
                <p className="text-gray-300 text-sm leading-relaxed italic">
                    I'm a biotech scientist with a PhD in Chemical Engineering specialising in Immunotherapy. For the past five years I've been working on therapies for some of the most devastating diseases humans face — cancer, rheumatoid arthritis, sepsis, traumatic brain injury and most recently neurodegenerative diseases like Alzheimer's and Parkinson's.
                </p>
                <p className="text-gray-300 text-sm leading-relaxed italic">
                    But as I spent years searching for cures, a question kept nagging at me: what if we never had to get here in the first place?
                </p>
                <p className="text-gray-300 text-sm leading-relaxed italic">
                    The science is clear. People who maintain consistent daily habits — regular sleep, physical activity, limited screen time — have dramatically lower risk of developing the diseases I work on. The data is not subtle. It's overwhelming.
                </p>
                <p className="text-gray-300 text-sm leading-relaxed italic">
                    So I asked myself: why aren't more people doing this? The answer isn't ignorance. Everyone knows exercise is good for them. The answer is motivation. Specifically, the absence of any real external incentive to stay consistent when life gets hard.
                </p>
                <p className="text-gray-300 text-sm leading-relaxed italic">
                    Every habit app I found relied entirely on willpower. Streaks, badges, reminders. None of them changed the underlying economics of behavior. Skipping a habit costs nothing. So people skip.
                </p>
                <p className="text-gray-300 text-sm leading-relaxed italic">
                    That's why I built Niyama. A system where discipline is measured, consistency is rewarded, and the rewards are real enough to actually change behavior. Not as a gimmick — but as a scientifically grounded intervention based on the same reinforcement principles we use in clinical research.
                </p>
                <p className="text-gray-300 text-sm leading-relaxed italic">
                    The goal of Niyama is simple: Living healthy every single day — not for others, but for yourself.
                </p>

                {/* Thank you note */}
                <div className="border-t border-gray-700 pt-4 mt-4">
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Thank you for being one of our first beta testers. Your feedback and experience over the coming weeks will directly shape the future of Niyama. I am grateful you are here.
                    </p>
                    <p className="text-gray-500 text-sm mt-3 font-medium">— Sahil Inamdar, CEO & Founder, Niyama</p>
                </div>
            </div>

            <button
                onClick={onContinue}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg transition"
            >
                Continue
            </button>

        </div>
    )
}