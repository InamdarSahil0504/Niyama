export default function Dashboard({ session }) {
    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-white">Niyama</h1>
                <p className="text-gray-400 mt-2">Welcome, {session.user.email}</p>
                <p className="text-gray-600 mt-4 text-sm">Dashboard coming soon...</p>
            </div>
        </div>
    )
}