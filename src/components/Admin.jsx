import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const ADMIN_PASSWORD = 'NiyamaHealth'

const s = {
    bg: '#111827',
    card: '#1F2937',
    cardBorder: '#374151',
    input: '#374151',
    text: '#F9FAFB',
    muted: '#9CA3AF',
    dim: '#6B7280',
    primary: '#5A8A78',
    secondary: '#D4735F',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
}

const btn = (color = s.primary, text = 'white') => ({
    background: color, color: text, border: 'none', borderRadius: '8px',
    padding: '8px 14px', fontSize: '13px', fontWeight: '500', cursor: 'pointer'
})

const cardStyle = {
    background: s.card, border: `1px solid ${s.cardBorder}`,
    borderRadius: '12px', padding: '20px', marginBottom: '16px'
}

const inputStyle = {
    background: s.input, color: s.text, border: `1px solid ${s.cardBorder}`,
    borderRadius: '8px', padding: '10px 12px', fontSize: '13px', outline: 'none', width: '100%', boxSizing: 'border-box'
}

export default function Admin() {
    const [authed, setAuthed] = useState(false)
    const [password, setPassword] = useState('')
    const [activeTab, setActiveTab] = useState('dashboard')
    const [users, setUsers] = useState([])
    const [streaks, setStreaks] = useState([])
    const [rewards, setRewards] = useState([])
    const [appEvents, setAppEvents] = useState([])
    const [allHabits, setAllHabits] = useState([])
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [selectedUser, setSelectedUser] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterTier, setFilterTier] = useState('all')
    const [filterGender, setFilterGender] = useState('all')
    const [filterAge, setFilterAge] = useState('all')
    const [filterStatus, setFilterStatus] = useState('all')
    const [npsScore, setNpsScore] = useState('')
    const [savingNps, setSavingNps] = useState(false)
    const [savedNps, setSavedNps] = useState(null)
    const [adminNotes, setAdminNotes] = useState([])
    const [newNote, setNewNote] = useState('')
    const [savingNote, setSavingNote] = useState(false)
    const [adjustUserId, setAdjustUserId] = useState(null)
    const [adjustAmount, setAdjustAmount] = useState('')
    const [adjustReason, setAdjustReason] = useState('')
    const [messageUserId, setMessageUserId] = useState(null)
    const [messageText, setMessageText] = useState('')
    const [sendingMessage, setSendingMessage] = useState(false)
    const [editingReward, setEditingReward] = useState(null)
    const [rewardOverrideValue, setRewardOverrideValue] = useState('')
    const [exportStep, setExportStep] = useState(0)
    const [exportFormat, setExportFormat] = useState('excel')
    const [exportSelectedUsers, setExportSelectedUsers] = useState([])
    const [exportColumns, setExportColumns] = useState(['profile', 'activation', 'monthly', 'alltime', 'habits', 'rewards', 'streak'])
    const [monthlyReportNarrative, setMonthlyReportNarrative] = useState('')
    const [showManualReport, setShowManualReport] = useState(false)
    const [exportMode, setExportMode] = useState(false)
    const [showColumnPicker, setShowColumnPicker] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const [replyText, setReplyText] = useState('')
    const [sendingReply, setSendingReply] = useState(false)
    const [resolvingConversation, setResolvingConversation] = useState(false)
    const [userMessages, setUserMessages] = useState([])
    const [loadingMessages, setLoadingMessages] = useState(false)
    const [resetDayUserId, setResetDayUserId] = useState(null)
    const [resetDayDate, setResetDayDate] = useState('')
    const [resettingDay, setResettingDay] = useState(false)

    function handleLogin() {
        if (password === ADMIN_PASSWORD) { setAuthed(true); fetchData() }
        else setMessage('Incorrect password')
    }

    async function fetchData() {
        setLoading(true)
        const [{ data: profileData }, { data: streakData }, { data: rewardData }, { data: eventData }, { data: habitData }] = await Promise.all([
            supabase.from('profiles').select('*').order('created_at', { ascending: false }),
            supabase.from('streaks').select('*'),
            supabase.from('rewards').select('*').order('month', { ascending: false }),
            supabase.from('app_events').select('*').order('created_at', { ascending: false }),
            supabase.from('habits').select('*').order('date', { ascending: false }),
        ])

        // Fetch emails from auth.users via admin API
        const { data: authUsers } = await supabase.auth.admin.listUsers()
        const emailMap = {}
        if (authUsers?.users) {
            authUsers.users.forEach(u => { emailMap[u.id] = u.email })
        }
        const profilesWithEmail = (profileData || []).map(p => ({ ...p, email: emailMap[p.id] || p.email || '' }))
        setUsers(profilesWithEmail)
        setStreaks(streakData || [])
        setRewards(rewardData || [])
        setAppEvents(eventData || [])
        setAllHabits(habitData || [])
        const { data: npsData } = await supabase.from('admin_adjustments').select('adjustment').eq('reason', 'nps_score').order('created_at', { ascending: false }).limit(1)
        setSavedNps(npsData?.[0]?.adjustment || null)
        // Count unread messages
        const { data: unreadData } = await supabase
            .from('contact_messages')
            .select('user_id')
            .eq('read_by_admin', false)
            .eq('sender', 'user')
        const uniqueUnread = new Set(unreadData?.map(m => m.user_id) || [])
        setUnreadCount(uniqueUnread.size)
        // Fetch all messages for the messages tab
        const { data: allMessages } = await supabase
            .from('contact_messages')
            .select('*')
            .order('created_at', { ascending: true })
        setUserMessages(allMessages || [])
        setLoading(false)
    }

    async function fetchAdminNotes(userId) {
        const { data } = await supabase.from('admin_notes').select('*').eq('user_id', userId).order('created_at', { ascending: false })
        setAdminNotes(data || [])
    }
    async function fetchUserMessages(userId) {
        setLoadingMessages(true)
        const { data } = await supabase
            .from('contact_messages')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true })
        setUserMessages(data || [])
        // Mark all as read
        await supabase
            .from('contact_messages')
            .update({ read_by_admin: true })
            .eq('user_id', userId)
            .eq('read_by_admin', false)
        setLoadingMessages(false)
    }

    async function sendAdminReply(userId, userEmail, userName) {
        if (!replyText.trim()) return
        setSendingReply(true)
        const existingConv = userMessages[0]
        await supabase.from('contact_messages').insert({
            user_id: userId,
            user_name: 'Niyama Admin',
            email: 'admin@niyama.app',
            message: replyText.trim(),
            sender: 'admin',
            read_by_admin: true,
            conversation_id: existingConv?.conversation_id,
        })

        // Send email notification to user via Resend
        try {
            await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                    from: 'onboarding@resend.dev',
                    to: userEmail,
                    reply_to: 'info.niyamahealth@gmail.com',
                    subject: 'You have a reply from the Niyama team',
                    html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
              <h2 style="color: #5A8A78; margin-bottom: 8px;">Niyama</h2>
              <p style="color: #1A1A1A; font-size: 16px;">Hi ${userName || 'there'},</p>
              <p style="color: #6B7280; font-size: 15px; line-height: 1.6;">
                The Niyama team has replied to your message. Open the app to read it and continue the conversation.
              </p>
              <div style="margin: 24px 0; padding: 16px; background: #F4F7F5; border-radius: 12px; border-left: 4px solid #5A8A78;">
                <p style="color: #6B7280; font-size: 13px; margin: 0;">Open Settings → Contact Us in the Niyama app to read the full reply.</p>
              </div>
              <p style="color: #9CA3AF; font-size: 13px;">— The Niyama Team</p>
            </div>
          `,
                }),
            })
        } catch (e) {
            console.log('Email notification failed:', e)
        }

        setReplyText('')
        await fetchUserMessages(userId)
        setSendingReply(false)
        fetchData()
    }

    async function resolveConversation(userId) {
        if (!window.confirm('Mark this conversation as resolved? The user\'s chat will clear after 24 hours.')) return
        setResolvingConversation(true)
        await supabase
            .from('contact_messages')
            .update({ resolved: true, resolved_at: new Date().toISOString(), resolved_by: 'admin' })
            .eq('user_id', userId)
        await fetchUserMessages(userId)
        setResolvingConversation(false)
        setMessage('Conversation marked as resolved')
        fetchData()
    }
    async function saveNote(userId) {
        if (!newNote.trim()) return
        setSavingNote(true)
        await supabase.from('admin_notes').insert({ user_id: userId, note: newNote.trim() })
        setNewNote('')
        await fetchAdminNotes(userId)
        setSavingNote(false)
    }

    async function saveNps() {
        if (!npsScore) return
        setSavingNps(true)
        await supabase.from('admin_adjustments').insert({ user_id: users[0]?.id, adjustment: parseInt(npsScore), reason: 'nps_score' })
        setSavedNps(parseInt(npsScore))
        setSavingNps(false)
        setNpsScore('')
    }

    async function adjustPoints() {
        if (!adjustUserId || !adjustAmount) return
        const amount = parseInt(adjustAmount)
        const user = users.find(u => u.id === adjustUserId)
        const newPoints = (user?.monthly_points || 0) + amount
        await supabase.from('profiles').update({ monthly_points: newPoints }).eq('id', adjustUserId)
        await supabase.from('admin_adjustments').insert({ user_id: adjustUserId, adjustment: amount, reason: adjustReason })
        setAdjustUserId(null); setAdjustAmount(''); setAdjustReason('')
        setMessage('Points adjusted')
        fetchData()
    }

    async function resetMonthlyData(userId) {
        if (!confirm('Reset this user\'s monthly data?')) return
        await supabase.from('profiles').update({ monthly_points: 0, successful_days: 0, consecutive_inactive_days: 0 }).eq('id', userId)
        await supabase.from('streaks').update({ current_streak: 0, streak_bonus_unlocked: false }).eq('user_id', userId)
        setMessage('Monthly data reset')
        fetchData()
    }
    async function resetDay(userId, date) {
        if (!date) return
        if (!confirm(`Reset habits for ${date}? This will delete that day's record and recalculate monthly totals.`)) return
        setResettingDay(true)

        // Delete the habit record for that date
        await supabase.from('habits').delete().eq('user_id', userId).eq('date', date)

        // Recalculate monthly points and successful days from remaining records
        const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            .toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })

        const { data: monthHabits } = await supabase
            .from('habits')
            .select('points_earned, day_successful')
            .eq('user_id', userId)
            .gte('date', currentMonthStart)

        const monthlyPoints = (monthHabits || []).reduce((sum, h) => sum + (h.points_earned || 0), 0)
        const successfulDays = (monthHabits || []).filter(h => h.day_successful).length

        // Recalculate all time stats
        const { data: allHabits } = await supabase
            .from('habits')
            .select('day_successful, wake_before_8, steps_over_5000, screen_under_2hrs, sleep_before_1030, active_heart_rate')
            .eq('user_id', userId)

        const overallSuccessfulDays = (allHabits || []).filter(h => h.day_successful).length
        const totalDaysLogged = (allHabits || []).length
        const totalHabitsCompleted = (allHabits || []).reduce((sum, h) =>
            sum + (h.wake_before_8 ? 1 : 0) + (h.steps_over_5000 ? 1 : 0) +
            (h.screen_under_2hrs ? 1 : 0) + (h.sleep_before_1030 ? 1 : 0) +
            (h.active_heart_rate ? 1 : 0), 0)

        await supabase.from('profiles').update({
            monthly_points: monthlyPoints,
            successful_days: successfulDays,
            overall_successful_days: overallSuccessfulDays,
            total_days_logged: totalDaysLogged,
            total_habits_completed: totalHabitsCompleted,
        }).eq('id', userId)

        setResetDayUserId(null)
        setResetDayDate('')
        setResettingDay(false)
        setMessage(`Day ${date} reset successfully — monthly totals recalculated`)
        fetchData()
    }
    async function changeTier(userId, tier) {
        await supabase.from('profiles').update({ tier }).eq('id', userId)
        fetchData()
    }

    async function sendMessageToUser() {
        if (!messageUserId || !messageText.trim()) return
        setSendingMessage(true)
        const user = users.find(u => u.id === messageUserId)
        await supabase.from('contact_messages').insert({ user_id: messageUserId, user_name: 'Niyama Admin', email: 'admin@niyama.app', message: `[Admin message to ${user?.full_name}]: ${messageText}` })
        setMessageUserId(null); setMessageText('')
        setMessage(`Message sent to ${user?.full_name}`)
        setSendingMessage(false)
    }

    async function saveRewardOverride(rewardId) {
        await supabase.from('rewards').update({ reward_value: parseFloat(rewardOverrideValue), manual_override: true }).eq('id', rewardId)
        setEditingReward(null); setRewardOverrideValue('')
        fetchData()
    }

    async function toggleRedeemed(rewardId, currentStatus) {
        await supabase.from('rewards').update({ redeemed: !currentStatus, redeemed_date: !currentStatus ? new Date().toISOString().split('T')[0] : null }).eq('id', rewardId)
        fetchData()
    }

    function getStreak(userId) { return streaks.find(s => s.user_id === userId) }
    function getUserRewards(userId) { return rewards.filter(r => r.user_id === userId) }
    function getCurrentMonthReward(userId) {
        const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
        return rewards.find(r => r.user_id === userId && r.month === currentMonth)
    }

    function getMinDays(tier) {
        return tier === 'plus' || tier === 'premium' ? 5 : 7
    }

    function calcReward(user) {
        const caps = { free: 5, plus: 10, premium: 20 }
        const streak = getStreak(user.id)
        if ((user.consecutive_inactive_days || 0) >= 5) return '0.00'
        if ((user.successful_days || 0) < getMinDays(user.tier)) return '0.00'
        if (streak?.streak_bonus_unlocked && user.tier === 'premium') return '25.00'
        return Math.min((user.monthly_points || 0) / 1000, caps[user.tier] || 5).toFixed(2)
    }

    function isFraudSuspect(user) {
        if ((user.total_days_logged || 0) < 14) return false
        return (user.overall_successful_days || 0) / (user.total_days_logged || 1) === 1
    }

    function getUserStatus(user) {
        const lastActive = user.last_active_date ? new Date(user.last_active_date) : null
        if (!lastActive) return 'inactive'
        const daysSince = Math.floor((new Date() - lastActive) / (1000 * 60 * 60 * 24))
        if (daysSince <= 1) return 'active'
        if (daysSince <= 7) return 'active'
        if (daysSince <= 30) return 'inactive'
        return 'churned'
    }

    function getStatusColor(status) {
        switch (status) {
            case 'active': return s.success
            case 'inactive': return s.warning
            case 'churned': return s.danger
            default: return s.muted
        }
    }

    function getAgeBracket(age) {
        if (!age) return 'Unknown'
        if (age < 18) return 'Under 18'
        if (age < 25) return '18-24'
        if (age < 35) return '25-34'
        if (age < 45) return '35-44'
        if (age < 55) return '45-54'
        return '55+'
    }
    function getUserLocalTime(timezone) {
        if (!timezone) return '—'
        try {
            return new Date().toLocaleTimeString('en-US', {
                timeZone: timezone,
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            })
        } catch (e) {
            return '—'
        }
    }

    function formatTimezone(timezone) {
        if (!timezone) return '—'
        return timezone.replace('America/', '').replace('_', ' ')
    }
    function calcRetention(days) {
        const cohortUsers = users.filter(u => {
            const joined = new Date(u.created_at)
            const now = new Date()
            const daysSinceJoin = Math.floor((now - joined) / (1000 * 60 * 60 * 24))
            return daysSinceJoin >= days
        })
        if (cohortUsers.length === 0) return { rate: 0, count: 0, total: 0 }
        const retained = cohortUsers.filter(u => {
            const joined = new Date(u.created_at)
            const targetDate = new Date(joined.getTime() + days * 24 * 60 * 60 * 1000)
            const lastActive = u.last_active_date ? new Date(u.last_active_date) : null
            return lastActive && lastActive >= targetDate
        })
        return { rate: Math.round((retained.length / cohortUsers.length) * 100), count: retained.length, total: cohortUsers.length }
    }

    function getHabitBreakdownForUser(userId, monthStart = null) {
        const userHabits = allHabits.filter(h => {
            if (h.user_id !== userId) return false
            if (monthStart) return h.date >= monthStart
            return true
        })
        return {
            wake: userHabits.filter(h => h.wake_before_8).length,
            steps: userHabits.filter(h => h.steps_over_5000).length,
            screen: userHabits.filter(h => h.screen_under_2hrs).length,
            sleep: userHabits.filter(h => h.sleep_before_1030).length,
            heart: userHabits.filter(h => h.active_heart_rate).length,
            total: userHabits.length,
            successful: userHabits.filter(h => h.day_successful).length,
        }
    }

    function getActivationData(user) {
        const userEvents = appEvents.filter(e => e.user_id === user.id)
        const joined = new Date(user.created_at)
        const day1 = new Date(joined); day1.setDate(day1.getDate() + 1)
        const day2 = new Date(joined); day2.setDate(day2.getDate() + 2)
        const day3 = new Date(joined); day3.setDate(day3.getDate() + 3)
        const userHabits = allHabits.filter(h => h.user_id === user.id).sort((a, b) => a.date.localeCompare(b.date))
        const day1Submit = userHabits.some(h => new Date(h.date) <= day1 && h.submitted)
        const day2Submit = userHabits.some(h => new Date(h.date) <= day2 && h.submitted)
        const day3Submit = userHabits.some(h => new Date(h.date) <= day3 && h.submitted)
        const pageVisits = {}
        userEvents.filter(e => e.event_type === 'page_visit').forEach(e => {
            const page = e.event_data?.page
            if (page) pageVisits[page] = (pageVisits[page] || 0) + 1
        })
        return { day1Submit, day2Submit, day3Submit, pageVisits }
    }

    function getTimeOfDayData() {
        const hourCounts = Array(24).fill(0)
        appEvents.filter(e => e.event_type === 'habit_submitted').forEach(e => {
            const hour = e.event_data?.hour
            if (hour !== undefined) hourCounts[hour]++
        })
        const buckets = { morning: 0, afternoon: 0, evening: 0, night: 0 }
        hourCounts.forEach((count, hour) => {
            if (hour >= 5 && hour < 12) buckets.morning += count
            else if (hour >= 12 && hour < 17) buckets.afternoon += count
            else if (hour >= 17 && hour < 22) buckets.evening += count
            else buckets.night += count
        })
        return buckets
    }

    function getFeatureAdoption() {
        const uniqueVisitors = {}
        appEvents.filter(e => e.event_type === 'page_visit').forEach(e => {
            const page = e.event_data?.page
            if (page) {
                if (!uniqueVisitors[page]) uniqueVisitors[page] = new Set()
                uniqueVisitors[page].add(e.user_id)
            }
        })
        const total = users.length || 1
        return {
            analytics: Math.round(((uniqueVisitors.analytics?.size || 0) / total) * 100),
            rewards: Math.round(((uniqueVisitors.rewards?.size || 0) / total) * 100),
            settings: Math.round(((uniqueVisitors.settings?.size || 0) / total) * 100),
        }
    }

    function getFilteredUsers() {
        return users.filter(u => {
            const query = searchQuery.toLowerCase()
            const matchesSearch = !query || (u.full_name || '').toLowerCase().includes(query) || (u.email || '').toLowerCase().includes(query)
            const matchesTier = filterTier === 'all' || u.tier === filterTier
            const matchesGender = filterGender === 'all' || u.gender === filterGender
            const matchesAge = filterAge === 'all' || getAgeBracket(u.age) === filterAge
            const matchesStatus = filterStatus === 'all' || getUserStatus(u) === filterStatus
            return matchesSearch && matchesTier && matchesGender && matchesAge && matchesStatus
        })
    }

    async function exportData() {
        const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/xlsx.mjs')
        const selectedUserData = users.filter(u => exportSelectedUsers.includes(u.id))
        const rows = selectedUserData.map((u, index) => {
            const streak = getStreak(u.id)
            const currentMonthReward = getCurrentMonthReward(u.id)
            const allUserRewards = getUserRewards(u.id)
            const totalRewardEarned = allUserRewards.reduce((sum, r) => sum + (r.reward_value || 0), 0)
            const totalRewardRedeemed = allUserRewards.filter(r => r.redeemed).reduce((sum, r) => sum + (r.reward_value || 0), 0)
            const totalPotential = allUserRewards.reduce((sum, r) => sum + (r.reward_potential || 0), 0)
            const monthStart = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`
            const allTimeHabits = getHabitBreakdownForUser(u.id)
            const monthlyHabits = getHabitBreakdownForUser(u.id, monthStart)
            const row = {}
            if (exportColumns.includes('profile')) {
                row['#'] = index + 1
                row['Name'] = u.full_name || ''
                row['Email'] = u.email || ''
                row['Gender'] = u.gender || ''
                row['Age'] = u.age || ''
                row['Age Bracket'] = getAgeBracket(u.age)
                row['Tier'] = u.tier === 'free' ? 'Basic' : u.tier || 'Basic'
                row['Joined'] = u.created_at ? u.created_at.split('T')[0] : ''
                row['Member Days'] = u.created_at ? Math.floor((new Date() - new Date(u.created_at)) / (1000 * 60 * 60 * 24)) : 0
                row['Is Minor'] = u.is_minor ? 'Yes' : 'No'
                row['Color Theme'] = u.color_theme || 'sage'
                row['Status'] = getUserStatus(u)
                row['Fraud Flag'] = isFraudSuspect(u) ? 'Yes' : 'No'
            }
            if (exportColumns.includes('activation')) {
                row['First Submission Date'] = u.first_submission_date || 'Not yet submitted'
                row['Days to First Submission'] = u.days_to_first_submission !== null && u.days_to_first_submission !== undefined ? u.days_to_first_submission : 'Not yet submitted'
                row['Onboarding Complete'] = u.onboarding_complete ? 'Yes' : 'No'
                row['Tutorial Seen'] = u.tutorial_seen ? 'Yes' : 'No'
            }
            if (exportColumns.includes('monthly')) {
                row['Monthly Points'] = u.monthly_points || 0
                row['Monthly Successful Days'] = u.successful_days || 0
                row['Monthly Reward Earned'] = currentMonthReward?.reward_value || calcReward(u)
                row['Monthly Reward Potential'] = currentMonthReward?.reward_potential || (u.monthly_points || 0) / 1000
                row['Monthly Points Left on Table'] = currentMonthReward?.points_left_on_table || 0
                row['Cap Utilisation %'] = currentMonthReward?.cap_utilisation || 0
                row['Monthly Reward Redeemed'] = currentMonthReward?.redeemed ? 'Yes' : 'No'
                row['Consecutive Inactive Days'] = u.consecutive_inactive_days || 0
                row['Last Active'] = u.last_active_date || ''
            }
            if (exportColumns.includes('alltime')) {
                row['Overall Successful Days'] = u.overall_successful_days || 0
                row['Total Days Logged'] = u.total_days_logged || 0
                row['Overall Success Rate %'] = u.total_days_logged > 0 ? Math.round((u.overall_successful_days / u.total_days_logged) * 100) : 0
                row['Total Habits Completed'] = u.total_habits_completed || 0
                row['Avg Habits Per Day'] = u.total_days_logged > 0 ? ((u.total_habits_completed || 0) / u.total_days_logged).toFixed(1) : 0
            }
            if (exportColumns.includes('habits')) {
                row['Wake (All Time)'] = allTimeHabits.wake
                row['Steps (All Time)'] = allTimeHabits.steps
                row['Screen Under 3hrs (All Time)'] = allTimeHabits.screen
                row['Sleep (All Time)'] = allTimeHabits.sleep
                row['Active Heart Rate (All Time)'] = allTimeHabits.heart
                row['Wake (This Month)'] = monthlyHabits.wake
                row['Steps (This Month)'] = monthlyHabits.steps
                row['Screen Under 3hrs (This Month)'] = monthlyHabits.screen
                row['Sleep (This Month)'] = monthlyHabits.sleep
                row['Active Heart Rate (This Month)'] = monthlyHabits.heart
            }
            if (exportColumns.includes('rewards')) {
                row['Total Reward Earned (All Time)'] = `$${totalRewardEarned.toFixed(2)}`
                row['Total Reward Redeemed (All Time)'] = `$${totalRewardRedeemed.toFixed(2)}`
                row['Total Potential (All Time)'] = `$${totalPotential.toFixed(2)}`
            }
            if (exportColumns.includes('streak')) {
                row['Current Streak'] = streak?.current_streak || 0
                row['Longest Streak'] = streak?.longest_streak || 0
                row['Streak Bonus Unlocked'] = streak?.streak_bonus_unlocked ? 'Yes' : 'No'
            }
            return row
        })
        const worksheet = XLSX.utils.json_to_sheet(rows)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Niyama Users')
        worksheet['!cols'] = Object.keys(rows[0] || {}).map(() => ({ wch: 20 }))
        XLSX.writeFile(workbook, `niyama-export-${new Date().toISOString().split('T')[0]}.xlsx`)
        setExportStep(0)
        setExportSelectedUsers([])
        setMessage(`Exported ${rows.length} users successfully`)
    }

    // ─── COMPUTED METRICS ───────────────────────────────────────────────────────

    const totalUsers = users.length
    const activeToday = users.filter(u => u.last_active_date === new Date().toISOString().split('T')[0]).length
    const thisMonthStart = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`
    const activeThisMonth = users.filter(u => u.last_active_date && u.last_active_date >= thisMonthStart).length
    const newThisMonth = users.filter(u => u.created_at && u.created_at >= thisMonthStart).length
    const freeUsers = users.filter(u => u.tier === 'free' || !u.tier).length
    const plusUsers = users.filter(u => u.tier === 'plus').length
    const premiumUsers = users.filter(u => u.tier === 'premium').length
    const paidUsers = plusUsers + premiumUsers
    const estimatedRevenue = (plusUsers * 4.99 + premiumUsers * 14.99).toFixed(2)
    const eligibleUsers = users.filter(u => (u.successful_days || 0) >= (u.tier === 'plus' || u.tier === 'premium' ? 5 : 7) && (u.consecutive_inactive_days || 0) < 5)
    const caps = { free: 5, plus: 10, premium: 20 }
    const totalRewardLiability = eligibleUsers.reduce((sum, u) => sum + Math.min((u.monthly_points || 0) / 1000, caps[u.tier] || 5), 0).toFixed(2)
    const contributionMargin = (parseFloat(estimatedRevenue) - parseFloat(totalRewardLiability)).toFixed(2)
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const churned = users.filter(u => u.last_active_date && new Date(u.last_active_date) < thirtyDaysAgo).length
    const churnRate = totalUsers > 0 ? Math.round((churned / totalUsers) * 100) : 0
    const conversionRate = totalUsers > 0 ? Math.round((paidUsers / totalUsers) * 100) : 0
    const totalLogged = allHabits.length
    const totalSuccessful = allHabits.filter(h => h.day_successful).length
    const habitCompletionRate = totalLogged > 0 ? Math.round((totalSuccessful / totalLogged) * 100) : 0
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
    const dailyActiveRate = totalUsers > 0 ? Math.round((users.filter(u => u.last_active_date && new Date(u.last_active_date) >= yesterday).length / totalUsers) * 100) : 0
    const genderData = { Male: 0, Female: 0, Other: 0, 'Prefer not to say': 0, Unknown: 0 }
    users.forEach(u => { const g = u.gender || 'Unknown'; genderData[g] = (genderData[g] || 0) + 1 })
    const ageData = { 'Under 18': 0, '18-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55+': 0, 'Unknown': 0 }
    users.forEach(u => { ageData[getAgeBracket(u.age)]++ })
    const activationFunnel = {
        signedUp: totalUsers,
        onboardingComplete: users.filter(u => u.onboarding_complete).length,
        tutorialSeen: users.filter(u => u.tutorial_seen).length,
        firstSubmission: users.filter(u => u.first_submission_date).length,
        activeDay7: calcRetention(7).count,
    }
    const habitBreakdownAll = {
        wake: allHabits.filter(h => h.wake_before_8).length,
        steps: allHabits.filter(h => h.steps_over_5000).length,
        screen: allHabits.filter(h => h.screen_under_2hrs).length,
        sleep: allHabits.filter(h => h.sleep_before_1030).length,
        heart: allHabits.filter(h => h.active_heart_rate).length,
    }
    const timeOfDay = getTimeOfDayData()
    const featureAdoption = getFeatureAdoption()
    const totalPotentialRewards = rewards.reduce((sum, r) => sum + (r.reward_potential || 0), 0).toFixed(2)
    const totalActualRewards = rewards.reduce((sum, r) => sum + (r.reward_value || 0), 0).toFixed(2)

    if (!authed) {
        return (
            <div style={{ minHeight: '100vh', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
                <div style={{ width: '100%', maxWidth: '360px', background: s.card, border: `1px solid ${s.cardBorder}`, borderRadius: '16px', padding: '32px' }}>
                    <h1 style={{ color: s.text, fontSize: '24px', fontWeight: '700', marginBottom: '6px' }}>Niyama Admin</h1>
                    <p style={{ color: s.muted, fontSize: '14px', marginBottom: '24px' }}>Enter your password to continue</p>
                    <input type="password" placeholder="Admin password" value={password}
                        onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}
                        style={{ ...inputStyle, marginBottom: '12px' }} />
                    {message && <p style={{ color: s.danger, fontSize: '13px', marginBottom: '12px' }}>{message}</p>}
                    <button onClick={handleLogin} style={{ ...btn(s.primary), width: '100%', padding: '12px', fontSize: '15px' }}>Enter</button>
                </div>
            </div>
        )
    }

    // ─── USER DETAIL VIEW ────────────────────────────────────────────────────────
    if (selectedUser) {
        const user = selectedUser
        const streak = getStreak(user.id)
        const userRewards = getUserRewards(user.id)
        const currentMonthReward = getCurrentMonthReward(user.id)
        const monthStart = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`
        const allTimeHabits = getHabitBreakdownForUser(user.id)
        const monthlyHabits = getHabitBreakdownForUser(user.id, monthStart)
        const activation = getActivationData(user)
        const totalRewardEarned = userRewards.reduce((sum, r) => sum + (r.reward_value || 0), 0)
        const totalRewardRedeemed = userRewards.filter(r => r.redeemed).reduce((sum, r) => sum + (r.reward_value || 0), 0)
        const totalPotential = userRewards.reduce((sum, r) => sum + (r.reward_potential || 0), 0)
        const totalLeftOnTable = userRewards.reduce((sum, r) => sum + (r.points_left_on_table || 0), 0)

        const Section = ({ title, children }) => (
            <div style={{ ...cardStyle, marginBottom: '12px' }}>
                <p style={{ fontSize: '11px', fontWeight: '600', color: s.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>{title}</p>
                {children}
            </div>
        )

        const Row = ({ label, value, color }) => (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', color: s.muted }}>{label}</span>
                <span style={{ fontSize: '13px', fontWeight: '500', color: color || s.text }}>{value}</span>
            </div>
        )

        return (
            <div style={{ minHeight: '100vh', background: s.bg, color: s.text, padding: '24px 16px 96px', maxWidth: '700px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <button onClick={() => { setSelectedUser(null); setAdminNotes([]) }} style={{ ...btn('#333', s.muted), padding: '8px 12px' }}>← Back</button>
                    <div>
                        <h1 style={{ fontSize: '20px', fontWeight: '700' }}>{user.full_name || 'Unknown user'}</h1>
                        <p style={{ fontSize: '13px', color: s.muted }}>{user.email}</p>
                    </div>
                    {isFraudSuspect(user) && (
                        <span style={{ background: '#450a0a', color: '#fca5a5', fontSize: '11px', padding: '3px 10px', borderRadius: '20px', marginLeft: 'auto' }}>⚠️ Fraud flag</span>
                    )}
                </div>

                {/* Profile */}
                <Section title="Profile">
                    <Row label="Name" value={user.full_name || '—'} />
                    <Row label="Email" value={user.email || '—'} />
                    <Row label="Gender" value={user.gender || '—'} />
                    <Row label="Age" value={user.age ? `${user.age} (${getAgeBracket(user.age)})` : '—'} />
                    <Row label="Tier" value={user.tier || 'free'} color={user.tier === 'premium' ? s.warning : user.tier === 'plus' ? s.info : s.muted} />
                    <Row label="Joined" value={user.created_at ? user.created_at.split('T')[0] : '—'} />
                    <Row label="Member days" value={user.created_at ? Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24)) : '—'} />
                    <Row label="Theme" value={user.color_theme || 'sage'} />
                    <Row label="Minor" value={user.is_minor ? 'Yes' : 'No'} />
                    <Row label="Status" value={getUserStatus(user)} color={getStatusColor(getUserStatus(user))} />
                    <Row label="Timezone" value={user.timezone ? formatTimezone(user.timezone) : '—'} />
                    <Row label="Local time" value={getUserLocalTime(user.timezone)} color='var(--theme-primary)' />
                    <div style={{ marginTop: '12px' }}>
                        <p style={{ fontSize: '12px', color: s.muted, marginBottom: '6px' }}>Change tier</p>
                        <select value={user.tier || 'free'} onChange={e => { changeTier(user.id, e.target.value); setSelectedUser({ ...user, tier: e.target.value }) }}
                            style={{ ...inputStyle, width: 'auto' }}>
                            <option value="free">Basic</option>
                            <option value="plus">Plus</option>
                            <option value="premium">Premium</option>
                        </select>
                    </div>
                </Section>

                {/* Activation */}
                <Section title="Activation">
                    <Row label="Onboarding complete" value={user.onboarding_complete ? '✓ Yes' : '✗ No'} color={user.onboarding_complete ? s.success : s.danger} />
                    <Row label="Tutorial seen" value={user.tutorial_seen ? '✓ Yes' : '✗ No'} color={user.tutorial_seen ? s.success : s.danger} />
                    <Row label="First submission date" value={user.first_submission_date || 'Not yet'} />
                    <Row label="Days to first submission" value={user.days_to_first_submission !== null && user.days_to_first_submission !== undefined ? `${user.days_to_first_submission} days` : '—'} />
                    <Row label="Submitted day 1" value={activation.day1Submit ? '✓ Yes' : '✗ No'} color={activation.day1Submit ? s.success : s.danger} />
                    <Row label="Submitted day 2" value={activation.day2Submit ? '✓ Yes' : '✗ No'} color={activation.day2Submit ? s.success : s.danger} />
                    <Row label="Submitted day 3" value={activation.day3Submit ? '✓ Yes' : '✗ No'} color={activation.day3Submit ? s.success : s.danger} />
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${s.cardBorder}` }}>
                        <p style={{ fontSize: '12px', color: s.muted, marginBottom: '8px' }}>Feature adoption</p>
                        {[
                            { label: 'Analytics', visits: activation.pageVisits.analytics || 0 },
                            { label: 'Rewards', visits: activation.pageVisits.rewards || 0 },
                            { label: 'Settings', visits: activation.pageVisits.settings || 0 },
                        ].map(item => (
                            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ fontSize: '13px', color: s.muted }}>{item.label} tab visits</span>
                                <span style={{ fontSize: '13px', color: s.text }}>{item.visits}</span>
                            </div>
                        ))}
                    </div>
                </Section>

                {/* This month */}
                <Section title="This month">
                    <Row label="Monthly points" value={user.monthly_points || 0} />
                    <Row label="Successful days" value={user.successful_days || 0} />
                    <Row label="Consecutive inactive days" value={user.consecutive_inactive_days || 0} color={(user.consecutive_inactive_days || 0) >= 5 ? s.danger : s.text} />
                    <Row label="Last active" value={user.last_active_date || 'Never'} />
                    <Row label="Wake (month)" value={`${monthlyHabits.wake} / ${monthlyHabits.total} days`} />
                    <Row label="Steps (month)" value={`${monthlyHabits.steps} / ${monthlyHabits.total} days`} />
                    <Row label="Screen under 3hrs (month)" value={`${monthlyHabits.screen} / ${monthlyHabits.total} days`} />
                    <Row label="Sleep (month)" value={`${monthlyHabits.sleep} / ${monthlyHabits.total} days`} />
                    <Row label="Active heart rate (month)" value={`${monthlyHabits.heart} / ${monthlyHabits.total} days`} />
                </Section>

                {/* All time */}
                <Section title="All time">
                    <Row label="Overall successful days" value={user.overall_successful_days || 0} />
                    <Row label="Total days logged" value={user.total_days_logged || 0} />
                    <Row label="Overall success rate" value={user.total_days_logged > 0 ? `${Math.round((user.overall_successful_days / user.total_days_logged) * 100)}%` : '0%'} />
                    <Row label="Total habits completed" value={user.total_habits_completed || 0} />
                    <Row label="Avg habits per day" value={user.total_days_logged > 0 ? ((user.total_habits_completed || 0) / user.total_days_logged).toFixed(1) : '0.0'} />
                    <Row label="Longest streak" value={`${streak?.longest_streak || 0} days`} />
                    <Row label="Wake (all time)" value={`${allTimeHabits.wake} days`} />
                    <Row label="Steps (all time)" value={`${allTimeHabits.steps} days`} />
                    <Row label="Screen under 3hrs (all time)" value={`${allTimeHabits.screen} days`} />
                    <Row label="Sleep (all time)" value={`${allTimeHabits.sleep} days`} />
                    <Row label="Active heart rate (all time)" value={`${allTimeHabits.heart} days`} />
                </Section>

                {/* Rewards */}
                <Section title="Rewards (Tremendous ready)">
                    <Row label="Current month reward (earned)" value={`$${currentMonthReward ? (currentMonthReward.manual_override ? currentMonthReward.manual_override_value : currentMonthReward.reward_value).toFixed(2) : calcReward(user)}`} color={s.success} />
                    <Row label="Current month potential (uncapped)" value={`$${currentMonthReward ? currentMonthReward.reward_potential.toFixed(2) : ((user.monthly_points || 0) / 1000).toFixed(2)}`} />
                    <Row label="Points left on table (month)" value={`$${currentMonthReward ? currentMonthReward.points_left_on_table.toFixed(2) : '0.00'}`} color={s.warning} />
                    <Row label="Cap utilisation (month)" value={`${currentMonthReward ? currentMonthReward.cap_utilisation : 0}%`} />
                    <Row label="Reward redeemed (month)" value={currentMonthReward?.redeemed ? `✓ Yes (${currentMonthReward.redeemed_date})` : '✗ Not yet'} color={currentMonthReward?.redeemed ? s.success : s.muted} />
                    <div style={{ borderTop: `1px solid ${s.cardBorder}`, paddingTop: '12px', marginTop: '4px' }}>
                        <Row label="Total reward earned (all time)" value={`$${totalRewardEarned.toFixed(2)}`} color={s.success} />
                        <Row label="Total reward redeemed (all time)" value={`$${totalRewardRedeemed.toFixed(2)}`} />
                        <Row label="Total potential (all time)" value={`$${totalPotential.toFixed(2)}`} />
                        <Row label="Total left on table (all time)" value={`$${totalLeftOnTable.toFixed(2)}`} color={s.warning} />
                    </div>

                    {/* Manual override */}
                    {editingReward === user.id ? (
                        <div style={{ marginTop: '12px', background: s.input, borderRadius: '8px', padding: '12px' }}>
                            <p style={{ fontSize: '12px', color: s.muted, marginBottom: '8px' }}>Override reward value for current month</p>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input type="number" step="0.01" placeholder="Override value e.g. 7.50" value={rewardOverrideValue}
                                    onChange={e => setRewardOverrideValue(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                                <button onClick={() => currentMonthReward && saveRewardOverride(currentMonthReward.id)} style={btn(s.primary)}>Save</button>
                                <button onClick={() => setEditingReward(null)} style={btn('#555', s.muted)}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            <button onClick={() => setEditingReward(user.id)} style={{ ...btn('#333', s.muted), flex: 1 }}>Override reward</button>
                            {currentMonthReward && (
                                <button onClick={() => toggleRedeemed(currentMonthReward.id, currentMonthReward.redeemed)}
                                    style={{ ...btn(currentMonthReward.redeemed ? '#333' : s.success, 'white'), flex: 1 }}>
                                    {currentMonthReward.redeemed ? 'Mark unredeemed' : 'Mark redeemed'}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Reward history */}
                    {userRewards.length > 0 && (
                        <div style={{ marginTop: '16px' }}>
                            <p style={{ fontSize: '12px', color: s.muted, marginBottom: '8px' }}>Reward history</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {userRewards.slice(0, 6).map(r => (
                                    <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', background: s.input, borderRadius: '6px', padding: '8px 10px' }}>
                                        <span style={{ fontSize: '12px', color: s.muted }}>{r.month}</span>
                                        <span style={{ fontSize: '12px', color: s.text }}>${(r.reward_value || 0).toFixed(2)} earned</span>
                                        <span style={{ fontSize: '12px', color: s.muted }}>/${(r.reward_potential || 0).toFixed(2)} potential</span>
                                        <span style={{ fontSize: '12px', color: r.redeemed ? s.success : s.muted }}>{r.redeemed ? '✓ Redeemed' : 'Pending'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Section>

                {/* Streak */}
                <Section title="Streak">
                    <Row label="Current streak" value={`${streak?.current_streak || 0} days 🔥`} />
                    <Row label="Longest streak" value={`${streak?.longest_streak || 0} days`} />
                    <Row label="25-day bonus unlocked" value={streak?.streak_bonus_unlocked ? '🏆 Yes' : 'No'} color={streak?.streak_bonus_unlocked ? s.warning : s.muted} />
                </Section>

                {/* Subscription — Stripe ready */}
                <Section title="Subscription (Stripe ready)">
                    <Row label="Current tier" value={user.tier || 'free'} />
                    <Row label="Subscription start" value={user.subscription_start_date || '— (Stripe pending)'} color={s.muted} />
                    <Row label="Upgrade date" value={user.subscription_upgrade_date || '— (Stripe pending)'} color={s.muted} />
                    <Row label="Cancellation date" value={user.cancellation_date || '—'} color={s.muted} />
                </Section>

                {/* Admin actions */}
                <Section title="Admin actions">
                    {adjustUserId === user.id ? (
                        <div>
                            <input type="number" placeholder="Points amount (e.g. 500 or -200)" value={adjustAmount}
                                onChange={e => setAdjustAmount(e.target.value)} style={{ ...inputStyle, marginBottom: '8px' }} />
                            <input type="text" placeholder="Reason (optional)" value={adjustReason}
                                onChange={e => setAdjustReason(e.target.value)} style={{ ...inputStyle, marginBottom: '10px' }} />
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={adjustPoints} style={{ ...btn(s.primary), flex: 1 }}>Save adjustment</button>
                                <button onClick={() => setAdjustUserId(null)} style={{ ...btn('#555', s.muted), flex: 1 }}>Cancel</button>
                            </div>
                        </div>
                    ) : messageUserId === user.id ? (
                        <div>
                            <textarea placeholder="Message to user..." value={messageText} onChange={e => setMessageText(e.target.value)}
                                style={{ ...inputStyle, minHeight: '80px', resize: 'vertical', marginBottom: '10px' }} />
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={sendMessageToUser} disabled={!messageText.trim() || sendingMessage}
                                    style={{ ...btn(s.primary), flex: 1, opacity: (!messageText.trim() || sendingMessage) ? 0.5 : 1 }}>
                                    {sendingMessage ? 'Sending...' : 'Send message'}
                                </button>
                                <button onClick={() => { setMessageUserId(null); setMessageText('') }} style={{ ...btn('#555', s.muted), flex: 1 }}>Cancel</button>
                            </div>
                        </div>
                    ) : resetDayUserId === user.id ? (
                        <div style={{ background: s.input, borderRadius: '8px', padding: '12px' }}>
                            <p style={{ fontSize: '12px', color: s.muted, marginBottom: '10px' }}>Select a date to reset. The habit record for that day will be deleted and monthly totals will be recalculated.</p>
                            <input type="date" value={resetDayDate}
                                onChange={e => setResetDayDate(e.target.value)}
                                max={new Date().toLocaleDateString('en-CA')}
                                style={{ ...inputStyle, marginBottom: '10px' }} />
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => resetDay(user.id, resetDayDate)}
                                    disabled={!resetDayDate || resettingDay}
                                    style={{ ...btn('#166534', '#86efac'), flex: 1, opacity: (!resetDayDate || resettingDay) ? 0.5 : 1 }}>
                                    {resettingDay ? 'Resetting...' : 'Confirm reset'}
                                </button>
                                <button onClick={() => { setResetDayUserId(null); setResetDayDate('') }}
                                    style={{ ...btn('#555', s.muted), flex: 1 }}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <button onClick={() => setAdjustUserId(user.id)} style={btn('#333', s.text)}>Adjust points</button>
                            <button onClick={() => setMessageUserId(user.id)} style={btn('#1e3a5f', '#93c5fd')}>Message user</button>
                            <button onClick={() => { setResetDayUserId(user.id); setResetDayDate(new Date().toLocaleDateString('en-CA')) }}
                                style={btn('#1a3a1a', '#86efac')}>Reset day</button>
                            <button onClick={() => resetMonthlyData(user.id)} style={btn('#450a0a', '#fca5a5')}>Reset month</button>
                        </div>
                    )}
                </Section>

                {/* Messages */}
                <Section title="Messages">
                    {loadingMessages ? (
                        <p style={{ fontSize: '13px', color: s.muted }}>Loading messages...</p>
                    ) : userMessages.length === 0 ? (
                        <p style={{ fontSize: '13px', color: s.muted, fontStyle: 'italic' }}>No messages from this user yet</p>
                    ) : (
                        <div>
                            {/* Conversation status */}
                            {userMessages[0]?.resolved && (
                                <div style={{ background: '#1a3a1a', border: '1px solid #166534', borderRadius: '8px', padding: '8px 12px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '12px', color: '#86efac' }}>✓ Resolved on {new Date(userMessages[0].resolved_at).toLocaleDateString()}</span>
                                    <span style={{ fontSize: '11px', color: '#4ade80' }}>Chat clears for user in 24hrs</span>
                                </div>
                            )}

                            {/* Message thread */}
                            <div style={{ background: '#333', borderRadius: '10px', padding: '12px', marginBottom: '12px', maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {userMessages.map((msg, i) => {
                                    const isAdmin = msg.sender === 'admin'
                                    return (
                                        <div key={msg.id || i} style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}>
                                            <div style={{ maxWidth: '80%' }}>
                                                <div style={{ padding: '8px 12px', borderRadius: isAdmin ? '12px 12px 4px 12px' : '12px 12px 12px 4px', fontSize: '13px', lineHeight: '1.5', background: isAdmin ? s.primary : '#444', color: 'white' }}>
                                                    {msg.message}
                                                </div>
                                                <p style={{ fontSize: '10px', color: s.dim, marginTop: '2px', textAlign: isAdmin ? 'right' : 'left' }}>
                                                    {isAdmin ? 'You · ' : `${user.full_name || 'User'} · `}
                                                    {new Date(msg.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Reply box — only if not resolved */}
                            {!userMessages[0]?.resolved && (
                                <div style={{ marginBottom: '10px' }}>
                                    <textarea placeholder="Type your reply..." value={replyText}
                                        onChange={e => setReplyText(e.target.value)}
                                        style={{ ...inputStyle, minHeight: '70px', resize: 'vertical', marginBottom: '8px' }} />
                                    <button onClick={() => sendAdminReply(user.id, user.email, user.full_name)}
                                        disabled={!replyText.trim() || sendingReply}
                                        style={{ ...btn(s.primary), opacity: (!replyText.trim() || sendingReply) ? 0.5 : 1 }}>
                                        {sendingReply ? 'Sending...' : 'Send reply'}
                                    </button>
                                </div>
                            )}

                            {/* Resolve button — only if not resolved */}
                            {!userMessages[0]?.resolved && (
                                <button onClick={() => resolveConversation(user.id)}
                                    disabled={resolvingConversation}
                                    style={{ ...btn('#166534', '#86efac'), width: '100%', padding: '10px', opacity: resolvingConversation ? 0.5 : 1 }}>
                                    {resolvingConversation ? 'Resolving...' : '✓ Mark as resolved'}
                                </button>
                            )}
                        </div>
                    )}
                </Section>

                {/* Notes */}
                <Section title="Admin notes">
                    <div style={{ marginBottom: '12px' }}>
                        <textarea placeholder="Add a note about this user..." value={newNote} onChange={e => setNewNote(e.target.value)}
                            style={{ ...inputStyle, minHeight: '70px', resize: 'vertical', marginBottom: '8px' }} />
                        <button onClick={() => saveNote(user.id)} disabled={!newNote.trim() || savingNote}
                            style={{ ...btn(s.primary), opacity: (!newNote.trim() || savingNote) ? 0.5 : 1 }}>
                            {savingNote ? 'Saving...' : 'Add note'}
                        </button>
                    </div>
                    {adminNotes.length === 0 ? (
                        <p style={{ fontSize: '13px', color: s.dim, fontStyle: 'italic' }}>No notes yet</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {adminNotes.map(note => (
                                <div key={note.id} style={{ background: s.input, borderRadius: '8px', padding: '10px 12px' }}>
                                    <p style={{ fontSize: '13px', color: s.text, marginBottom: '4px', lineHeight: '1.5' }}>{note.note}</p>
                                    <p style={{ fontSize: '11px', color: s.dim }}>{new Date(note.created_at).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>

            </div>
        )
    }

    // ─── MAIN ADMIN PANEL ────────────────────────────────────────────────────────
    const filteredUsers = getFilteredUsers()

    return (
        <div style={{ minHeight: '100vh', background: s.bg, color: s.text }}>

            {/* Top bar */}
            <div style={{ background: s.card, borderBottom: `1px solid ${s.cardBorder}`, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
                <div>
                    <h1 style={{ fontSize: '18px', fontWeight: '700' }}>Niyama Admin</h1>
                    <p style={{ fontSize: '12px', color: s.muted, marginTop: '2px' }}>{totalUsers} users total</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button onClick={fetchData} style={{ ...btn('#333', s.muted) }}>Refresh</button>
                    <button onClick={async () => { if (window.confirm('Sign out?')) await supabase.auth.signOut() }}
                        style={{ ...btn('#450a0a', '#fca5a5') }}>Sign out</button>
                </div>
            </div>

            {/* Tab navigation */}
            <div style={{ background: s.card, borderBottom: `1px solid ${s.cardBorder}`, padding: '0 24px', display: 'flex', gap: '0' }}>
                {[
                    { key: 'dashboard', label: '📊 Dashboard' },
                    { key: 'users', label: '👥 Users' },
                    { key: 'messages', label: unreadCount > 0 ? `💬 Messages (${unreadCount})` : '💬 Messages' },
                ].map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        style={{ padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: activeTab === tab.key ? '600' : '400', color: activeTab === tab.key ? s.primary : s.muted, borderBottom: activeTab === tab.key ? `2px solid ${s.primary}` : '2px solid transparent' }}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {message && (
                <div style={{ background: '#1e3a5f', padding: '10px 24px' }}>
                    <p style={{ fontSize: '13px', color: '#93c5fd' }}>{message}</p>
                </div>
            )}

            <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>

                {/* ─── DASHBOARD TAB ─────────────────────────────────────────────────── */}
                {activeTab === 'dashboard' && (
                    <div>

                        {/* Key numbers */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>                            {[
                            { label: 'Total users', value: totalUsers, color: s.text },
                            { label: 'Active today', value: activeToday, color: s.success },
                            { label: 'Active this month', value: activeThisMonth, color: s.success },
                            { label: 'New this month', value: newThisMonth, color: s.info },
                        ].map(stat => (
                            <div key={stat.label} style={{ background: s.card, border: `1px solid ${s.cardBorder}`, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                                <p style={{ fontSize: '11px', color: s.muted, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</p>
                                <p style={{ fontSize: '32px', fontWeight: '700', color: stat.color }}>{stat.value}</p>
                            </div>
                        ))}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

                            {/* Tier breakdown */}
                            <div style={cardStyle}>
                                <p style={{ fontSize: '11px', fontWeight: '600', color: s.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Tier breakdown</p>
                                {[
                                    { label: 'Basic', count: freeUsers, color: s.muted },
                                    { label: 'Plus', count: plusUsers, color: s.info },
                                    { label: 'Premium', count: premiumUsers, color: s.warning },
                                ].map(tier => (
                                    <div key={tier.label} style={{ marginBottom: '10px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '13px', color: s.text }}>{tier.label}</span>
                                            <span style={{ fontSize: '13px', color: tier.color, fontWeight: '500' }}>{tier.count} ({totalUsers > 0 ? Math.round((tier.count / totalUsers) * 100) : 0}%)</span>
                                        </div>
                                        <div style={{ background: '#333', borderRadius: '4px', height: '6px' }}>
                                            <div style={{ background: tier.color, borderRadius: '4px', height: '6px', width: `${totalUsers > 0 ? (tier.count / totalUsers) * 100 : 0}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Financial */}
                            <div style={cardStyle}>
                                <p style={{ fontSize: '11px', fontWeight: '600', color: s.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Financial summary</p>
                                {[
                                    { label: 'Est. monthly revenue', value: `$${estimatedRevenue}`, color: s.success },
                                    { label: 'Est. reward liability', value: `$${totalRewardLiability}`, color: '#fca5a5' },
                                    { label: 'Contribution margin', value: `$${contributionMargin}`, color: parseFloat(contributionMargin) >= 0 ? s.success : '#fca5a5' },
                                    { label: 'Eligible for rewards', value: eligibleUsers.length, color: s.text },
                                    { label: 'Total potential (all time)', value: `$${totalPotentialRewards}`, color: s.muted },
                                    { label: 'Total actual (all time)', value: `$${totalActualRewards}`, color: s.text },
                                ].map(item => (
                                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '13px', color: s.muted }}>{item.label}</span>
                                        <span style={{ fontSize: '13px', fontWeight: '500', color: item.color }}>{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

                            {/* Retention cohorts */}
                            <div style={cardStyle}>
                                <p style={{ fontSize: '11px', fontWeight: '600', color: s.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Retention cohorts</p>
                                {[7, 14, 30, 60, 90].map(days => {
                                    const r = calcRetention(days)
                                    const color = r.rate >= 60 ? s.success : r.rate >= 30 ? s.warning : s.danger
                                    return (
                                        <div key={days} style={{ marginBottom: '10px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '13px', color: s.text }}>Day {days}</span>
                                                <span style={{ fontSize: '13px', color, fontWeight: '500' }}>{r.rate}% ({r.count}/{r.total})</span>
                                            </div>
                                            <div style={{ background: '#333', borderRadius: '4px', height: '6px' }}>
                                                <div style={{ background: color, borderRadius: '4px', height: '6px', width: `${r.rate}%` }} />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Activation funnel */}
                            <div style={cardStyle}>
                                <p style={{ fontSize: '11px', fontWeight: '600', color: s.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Activation funnel</p>
                                {[
                                    { label: 'Signed up', value: activationFunnel.signedUp },
                                    { label: 'Completed onboarding', value: activationFunnel.onboardingComplete },
                                    { label: 'Completed tutorial', value: activationFunnel.tutorialSeen },
                                    { label: 'First habit submission', value: activationFunnel.firstSubmission },
                                    { label: 'Active at day 7', value: activationFunnel.activeDay7 },
                                ].map((step, i, arr) => {
                                    const pct = arr[0].value > 0 ? Math.round((step.value / arr[0].value) * 100) : 0
                                    return (
                                        <div key={step.label} style={{ marginBottom: '10px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '13px', color: s.text }}>{step.label}</span>
                                                <span style={{ fontSize: '13px', color: s.primary, fontWeight: '500' }}>{step.value} ({pct}%)</span>
                                            </div>
                                            <div style={{ background: '#333', borderRadius: '4px', height: '6px' }}>
                                                <div style={{ background: s.primary, borderRadius: '4px', height: '6px', width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

                            {/* Demographics — gender */}
                            <div style={cardStyle}>
                                <p style={{ fontSize: '11px', fontWeight: '600', color: s.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Gender distribution</p>
                                {Object.entries(genderData).filter(([_, v]) => v > 0).map(([gender, count]) => (
                                    <div key={gender} style={{ marginBottom: '10px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '13px', color: s.text }}>{gender}</span>
                                            <span style={{ fontSize: '13px', color: s.primary, fontWeight: '500' }}>{count} ({totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0}%)</span>
                                        </div>
                                        <div style={{ background: '#333', borderRadius: '4px', height: '6px' }}>
                                            <div style={{ background: s.primary, borderRadius: '4px', height: '6px', width: `${totalUsers > 0 ? (count / totalUsers) * 100 : 0}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Demographics — age */}
                            <div style={cardStyle}>
                                <p style={{ fontSize: '11px', fontWeight: '600', color: s.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Age distribution</p>
                                {Object.entries(ageData).filter(([_, v]) => v > 0).map(([bracket, count]) => (
                                    <div key={bracket} style={{ marginBottom: '10px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '13px', color: s.text }}>{bracket}</span>
                                            <span style={{ fontSize: '13px', color: s.secondary, fontWeight: '500' }}>{count} ({totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0}%)</span>
                                        </div>
                                        <div style={{ background: '#333', borderRadius: '4px', height: '6px' }}>
                                            <div style={{ background: s.secondary, borderRadius: '4px', height: '6px', width: `${totalUsers > 0 ? (count / totalUsers) * 100 : 0}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

                            {/* Habit engagement */}
                            <div style={cardStyle}>
                                <p style={{ fontSize: '11px', fontWeight: '600', color: s.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Habit engagement</p>
                                {[
                                    { label: '🌅 Wake before 7:30 AM', count: habitBreakdownAll.wake },
                                    { label: '👟 Steps 10,000+', count: habitBreakdownAll.steps },
                                    { label: '📵 Screen under 3hrs', count: habitBreakdownAll.screen },
                                    { label: '🌙 Sleep by 10:30 PM', count: habitBreakdownAll.sleep },
                                    { label: '❤️ 30 min active heart rate', count: habitBreakdownAll.heart },
                                ].map(habit => {
                                    const maxCount = Math.max(...Object.values(habitBreakdownAll)) || 1
                                    return (
                                        <div key={habit.label} style={{ marginBottom: '10px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '13px', color: s.text }}>{habit.label}</span>
                                                <span style={{ fontSize: '13px', color: s.primary, fontWeight: '500' }}>{habit.count} days</span>
                                            </div>
                                            <div style={{ background: '#333', borderRadius: '4px', height: '6px' }}>
                                                <div style={{ background: s.primary, borderRadius: '4px', height: '6px', width: `${(habit.count / maxCount) * 100}%` }} />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Time of day + feature adoption */}
                            <div style={cardStyle}>
                                <p style={{ fontSize: '11px', fontWeight: '600', color: s.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Submission time of day</p>
                                {[
                                    { label: 'Morning (5am-12pm)', value: timeOfDay.morning },
                                    { label: 'Afternoon (12pm-5pm)', value: timeOfDay.afternoon },
                                    { label: 'Evening (5pm-10pm)', value: timeOfDay.evening },
                                    { label: 'Night (10pm-5am)', value: timeOfDay.night },
                                ].map(item => {
                                    const total = Object.values(timeOfDay).reduce((a, b) => a + b, 0) || 1
                                    return (
                                        <div key={item.label} style={{ marginBottom: '10px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '13px', color: s.text }}>{item.label}</span>
                                                <span style={{ fontSize: '13px', color: s.info, fontWeight: '500' }}>{item.value} ({Math.round((item.value / total) * 100)}%)</span>
                                            </div>
                                            <div style={{ background: '#333', borderRadius: '4px', height: '6px' }}>
                                                <div style={{ background: s.info, borderRadius: '4px', height: '6px', width: `${(item.value / total) * 100}%` }} />
                                            </div>
                                        </div>
                                    )
                                })}
                                <p style={{ fontSize: '11px', fontWeight: '600', color: s.muted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '16px 0 12px' }}>Feature adoption</p>
                                {[
                                    { label: 'Analytics tab', value: featureAdoption.analytics },
                                    { label: 'Rewards tab', value: featureAdoption.rewards },
                                    { label: 'Settings tab', value: featureAdoption.settings },
                                ].map(item => (
                                    <div key={item.label} style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '13px', color: s.text }}>{item.label}</span>
                                        <span style={{ fontSize: '13px', color: s.warning, fontWeight: '500' }}>{item.value}% of users</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* KPI metrics */}
                        <div style={cardStyle}>
                            <p style={{ fontSize: '11px', fontWeight: '600', color: s.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>KPI metrics</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {[
                                    { label: 'Daily active rate', detail: `${activeToday} of ${totalUsers} active today`, value: dailyActiveRate, target: 60, higher: true },
                                    { label: 'Habit completion rate', detail: `${totalSuccessful} successful of ${totalLogged} logged`, value: habitCompletionRate, target: 50, higher: true },
                                    { label: 'Free to paid conversion', detail: `${paidUsers} paying of ${totalUsers} total`, value: conversionRate, target: 20, higher: true },
                                    { label: 'Monthly churn rate', detail: `${churned} inactive 30+ days`, value: churnRate, target: 5, higher: false },
                                ].map(m => {
                                    const good = m.higher ? m.value >= m.target : m.value <= m.target
                                    const mid = m.higher ? m.value >= m.target * 0.6 : m.value <= m.target * 2
                                    const color = good ? s.success : mid ? s.warning : s.danger
                                    return (
                                        <div key={m.label} style={{ background: '#333', borderRadius: '10px', padding: '14px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                <div>
                                                    <p style={{ fontSize: '14px', fontWeight: '500' }}>{m.label}</p>
                                                    <p style={{ fontSize: '11px', color: s.dim, marginTop: '2px' }}>{m.detail}</p>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <p style={{ fontSize: '20px', fontWeight: '700', color }}>{m.value}%</p>
                                                    <p style={{ fontSize: '11px', color: s.dim }}>target: {m.higher ? `${m.target}%+` : `under ${m.target}%`}</p>
                                                </div>
                                            </div>
                                            <div style={{ background: '#555', borderRadius: '4px', height: '6px' }}>
                                                <div style={{ background: color, borderRadius: '4px', height: '6px', width: `${Math.min(m.value, 100)}%` }} />
                                            </div>
                                        </div>
                                    )
                                })}
                                {/* NPS */}
                                <div style={{ background: '#333', borderRadius: '10px', padding: '14px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                        <div>
                                            <p style={{ fontSize: '14px', fontWeight: '500' }}>Net Promoter Score</p>
                                            <p style={{ fontSize: '11px', color: s.dim, marginTop: '2px' }}>Manually entered from feedback</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: '20px', fontWeight: '700', color: (savedNps || 0) >= 40 ? s.success : (savedNps || 0) >= 20 ? s.warning : s.danger }}>
                                                {savedNps !== null ? savedNps : '—'}
                                            </p>
                                            <p style={{ fontSize: '11px', color: s.dim }}>target: 40+</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input type="number" placeholder="Enter NPS (-100 to 100)" value={npsScore}
                                            onChange={e => setNpsScore(e.target.value)} min="-100" max="100" style={{ ...inputStyle, flex: 1 }} />
                                        <button onClick={saveNps} disabled={savingNps || !npsScore}
                                            style={{ ...btn(s.primary), opacity: (!npsScore || savingNps) ? 0.5 : 1 }}>
                                            {savingNps ? 'Saving...' : 'Save'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Monthly report */}
                        <div style={cardStyle}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <p style={{ fontSize: '11px', fontWeight: '600', color: s.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Monthly report — {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </p>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => setShowManualReport(!showManualReport)} style={btn('#333', s.muted)}>
                                        {showManualReport ? 'Hide narrative' : 'Add narrative'}
                                    </button>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                                {[
                                    { label: 'Total users', value: totalUsers },
                                    { label: 'Active this month', value: activeThisMonth },
                                    { label: 'Reward eligible', value: eligibleUsers.length },
                                    { label: 'Est. revenue', value: `$${estimatedRevenue}` },
                                    { label: 'Est. liability', value: `$${totalRewardLiability}` },
                                    { label: 'Habit completion', value: `${habitCompletionRate}%` },
                                ].map(stat => (
                                    <div key={stat.label} style={{ background: '#333', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                                        <p style={{ fontSize: '11px', color: s.muted, marginBottom: '4px' }}>{stat.label}</p>
                                        <p style={{ fontSize: '18px', fontWeight: '700' }}>{stat.value}</p>
                                    </div>
                                ))}
                            </div>
                            {showManualReport && (
                                <div style={{ marginBottom: '12px' }}>
                                    <p style={{ fontSize: '12px', color: s.muted, marginBottom: '6px' }}>Monthly narrative (for investor report)</p>
                                    <textarea placeholder="Write your monthly narrative here — key highlights, learnings, what changed this month..." value={monthlyReportNarrative}
                                        onChange={e => setMonthlyReportNarrative(e.target.value)}
                                        style={{ ...inputStyle, minHeight: '100px', resize: 'vertical', marginBottom: '8px' }} />
                                </div>
                            )}
                        </div>

                    </div>
                )}

                {/* ─── USERS TAB ─────────────────────────────────────────────────────── */}
                {activeTab === 'users' && (
                    <div>
                        {/* Search, filters and export controls */}
                        <div style={{ background: s.card, border: `1px solid ${s.cardBorder}`, borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                <input type="text" placeholder="Search by name or email..." value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{ ...inputStyle, flex: 1, fontSize: '14px' }} />
                                {!exportMode ? (
                                    <button onClick={() => setExportMode(true)} style={{ ...btn('#333', s.primary), flexShrink: 0 }}>
                                        ⬇️ Export
                                    </button>
                                ) : (
                                    <button onClick={() => { setExportMode(false); setExportSelectedUsers([]) }}
                                        style={{ ...btn('#450a0a', '#fca5a5'), flexShrink: 0 }}>
                                        Cancel
                                    </button>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                {[
                                    { label: 'Tier', value: filterTier, setter: setFilterTier, options: ['all', 'free', 'plus', 'premium'], labels: ['All Tiers', 'Basic', 'Plus', 'Premium'] },
                                    { label: 'Gender', value: filterGender, setter: setFilterGender, options: ['all', 'Male', 'Female', 'Other', 'Prefer not to say'] },
                                    { label: 'Age', value: filterAge, setter: setFilterAge, options: ['all', 'Under 18', '18-24', '25-34', '35-44', '45-54', '55+'] },
                                    { label: 'Status', value: filterStatus, setter: setFilterStatus, options: ['all', 'active', 'inactive', 'churned'] },
                                ].map(filter => (
                                    <div key={filter.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontSize: '12px', color: s.muted }}>{filter.label}:</span>
                                        <select value={filter.value} onChange={e => filter.setter(e.target.value)}
                                            style={{ ...inputStyle, width: 'auto', padding: '6px 10px', fontSize: '12px' }}>
                                            {filter.options.map((opt, i) => (
                                                <option key={opt} value={opt}>{filter.labels ? filter.labels[i] : opt === 'all' ? `All ${filter.label}s` : opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                                {exportMode && (
                                    <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
                                        <button onClick={() => setExportSelectedUsers(filteredUsers.map(u => u.id))}
                                            style={btn('#333', s.text)}>Select all</button>
                                        <button onClick={() => setExportSelectedUsers([])}
                                            style={btn('#333', s.muted)}>Deselect all</button>
                                    </div>
                                )}
                                {!exportMode && (
                                    <span style={{ fontSize: '12px', color: s.muted, marginLeft: 'auto' }}>
                                        {filteredUsers.length} of {totalUsers} users
                                    </span>
                                )}
                            </div>
                        </div>
                        {/* Users table */}
                        {loading ? (
                            <p style={{ color: s.muted }}>Loading...</p>
                        ) : (
                            <div style={{ background: s.card, border: `1px solid ${s.cardBorder}`, borderRadius: '12px', overflow: 'hidden' }}>
                                {/* Table header */}
                                <div style={{ display: 'grid', gridTemplateColumns: exportMode ? '40px 40px 1fr 80px 60px 80px 110px 100px' : '40px 1fr 80px 60px 80px 110px 100px', gap: '12px', padding: '12px 16px', borderBottom: `1px solid ${s.cardBorder}`, background: '#161d29' }}>
                                    {[...(exportMode ? ['☑'] : []), '#', 'Name', 'Gender', 'Age', 'Tier', 'Local Time', 'Status'].map(h => (
                                        <p key={h} style={{ fontSize: '11px', fontWeight: '600', color: s.muted, textTransform: 'uppercase', letterSpacing: '0.05em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h}</p>
                                    ))}
                                </div>

                                {filteredUsers.length === 0 ? (
                                    <div style={{ padding: '32px', textAlign: 'center' }}>
                                        <p style={{ color: s.muted }}>No users match your filters</p>
                                    </div>
                                ) : (
                                    filteredUsers.map((user, index) => {
                                        const status = getUserStatus(user)
                                        const fraud = isFraudSuspect(user)
                                        return (
                                            <div key={user.id}
                                                onClick={async () => {
                                                    if (exportMode) {
                                                        setExportSelectedUsers(prev => prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id])
                                                    } else {
                                                        setSelectedUser(user)
                                                        await fetchAdminNotes(user.id)
                                                        await fetchUserMessages(user.id)
                                                    }
                                                }}
                                                style={{ display: 'grid', gridTemplateColumns: exportMode ? '40px 40px 1fr 80px 60px 80px 110px 100px' : '40px 1fr 80px 60px 80px 110px 100px', gap: '12px', gap: '0', padding: '14px 16px', borderBottom: `1px solid ${s.cardBorder}`, cursor: 'pointer', background: exportSelectedUsers.includes(user.id) ? '#1e3a2f' : fraud ? '#1a0a0a' : 'transparent', transition: 'background 0.15s' }}
                                                onMouseEnter={e => e.currentTarget.style.background = exportSelectedUsers.includes(user.id) ? '#1e3a2f' : fraud ? '#2a0a0a' : '#252f3f'}
                                                onMouseLeave={e => e.currentTarget.style.background = exportSelectedUsers.includes(user.id) ? '#1e3a2f' : fraud ? '#1a0a0a' : 'transparent'}>
                                                {exportMode && (
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                        <input type="checkbox" checked={exportSelectedUsers.includes(user.id)}
                                                            onChange={() => { }} style={{ cursor: 'pointer' }} />
                                                    </div>
                                                )}
                                                <p style={{ fontSize: '13px', color: s.muted }}>{index + 1}</p>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <p style={{ fontSize: '13px', fontWeight: '500' }}>{user.full_name || 'No name'}</p>
                                                        {userMessages.some(m => m.user_id === user.id && !m.read_by_admin && m.sender === 'user') && (
                                                            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: s.danger, flexShrink: 0 }} />
                                                        )}
                                                    </div>
                                                    <p style={{ fontSize: '11px', color: s.muted }}>{user.email || ''}</p>
                                                    {fraud && <span style={{ fontSize: '10px', color: '#fca5a5' }}>⚠️ Fraud flag</span>}
                                                </div>
                                                <p style={{ fontSize: '13px', color: s.muted }}>{user.gender || '—'}</p>
                                                <p style={{ fontSize: '13px', color: s.muted }}>{user.age || '—'}</p>
                                                <span style={{ fontSize: '11px', fontWeight: '500', color: user.tier === 'premium' ? s.warning : user.tier === 'plus' ? s.info : s.muted, textTransform: 'capitalize' }}>{user.tier === 'free' ? 'Basic' : user.tier || 'Basic'}</span>
                                                <div>
                                                    <p style={{ fontSize: '12px', color: s.primary, fontWeight: '500' }}>{getUserLocalTime(user.timezone)}</p>
                                                    <p style={{ fontSize: '10px', color: s.muted }}>{user.timezone ? formatTimezone(user.timezone) : '—'}</p>
                                                </div>
                                                <span style={{ fontSize: '11px', fontWeight: '500', color: getStatusColor(status), textTransform: 'capitalize' }}>{status}</span>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ─── MESSAGES TAB ──────────────────────────────────────────────────── */}
                {activeTab === 'messages' && (
                    <div>
                        {unreadCount === 0 && (
                            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                                <p style={{ fontSize: '32px', marginBottom: '12px' }}>💬</p>
                                <p style={{ fontSize: '16px', fontWeight: '600', color: s.text, marginBottom: '6px' }}>No unread messages</p>
                                <p style={{ fontSize: '14px', color: s.muted }}>All conversations are up to date</p>
                            </div>
                        )}
                        {users.filter(u => {
                            const msgs = userMessages.filter(m => m.user_id === u.id)
                            return msgs.some(m => !m.read_by_admin && m.sender === 'user')
                        }).length === 0 && unreadCount > 0 && (
                                <p style={{ color: s.muted, fontSize: '14px' }}>Loading conversations...</p>
                            )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {users.map(user => {
                                const hasUnread = userMessages.some(m => m.user_id === user.id && !m.read_by_admin && m.sender === 'user')
                                const lastMessage = userMessages.filter(m => m.user_id === user.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
                                if (!lastMessage) return null
                                return (
                                    <div key={user.id}
                                        onClick={async () => { setSelectedUser(user); await fetchAdminNotes(user.id); await fetchUserMessages(user.id); setActiveTab('users') }}
                                        style={{ background: s.card, border: `1px solid ${hasUnread ? s.danger : s.cardBorder}`, borderRadius: '12px', padding: '16px', cursor: 'pointer', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: hasUnread ? '#450a0a' : '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', color: hasUnread ? '#fca5a5' : s.muted, flexShrink: 0 }}>
                                            {user.full_name?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                <p style={{ fontSize: '14px', fontWeight: '600', color: s.text }}>{user.full_name || 'Unknown'}</p>
                                                <p style={{ fontSize: '11px', color: s.muted }}>{new Date(lastMessage.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <p style={{ fontSize: '13px', color: hasUnread ? '#fca5a5' : s.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {lastMessage.sender === 'admin' ? 'You: ' : ''}{lastMessage.message}
                                            </p>
                                            {lastMessage.resolved && (
                                                <span style={{ fontSize: '11px', color: '#86efac', marginTop: '4px', display: 'inline-block' }}>✓ Resolved</span>
                                            )}
                                        </div>
                                        {hasUnread && (
                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.danger, flexShrink: 0, marginTop: '4px' }} />
                                        )}
                                    </div>
                                )
                            }).filter(Boolean)}
                        </div>
                    </div>
                )}
                {/* Column picker modal */}
                {showColumnPicker && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                        <div style={{ background: s.card, border: `1px solid ${s.cardBorder}`, borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '480px' }}>
                            <p style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>Choose data columns</p>
                            <p style={{ fontSize: '13px', color: s.muted, marginBottom: '16px' }}>Select which data to include in your export</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                                {[
                                    { key: 'profile', label: 'Profile and demographics', desc: 'Name, email, gender, age, tier, joined, theme' },
                                    { key: 'activation', label: 'Activation data', desc: 'First submission, days to first submit, onboarding, tutorial' },
                                    { key: 'monthly', label: 'Monthly stats', desc: 'Points, successful days, reward earned, cap utilisation' },
                                    { key: 'alltime', label: 'All time stats', desc: 'Overall successful days, total logged, success rate' },
                                    { key: 'habits', label: 'Habit breakdown', desc: 'Per-habit completion for wake, steps, screen, sleep' },
                                    { key: 'rewards', label: 'Rewards', desc: 'Earned, potential, redeemed, left on table' },
                                    { key: 'streak', label: 'Streak data', desc: 'Current streak, longest streak, bonus status' },
                                ].map(col => (
                                    <label key={col.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px', background: exportColumns.includes(col.key) ? '#1e3a2f' : '#333', borderRadius: '8px', cursor: 'pointer', border: `1px solid ${exportColumns.includes(col.key) ? s.primary : s.cardBorder}` }}>
                                        <input type="checkbox" checked={exportColumns.includes(col.key)} style={{ marginTop: '2px' }}
                                            onChange={e => setExportColumns(prev => e.target.checked ? [...prev, col.key] : prev.filter(c => c !== col.key))} />
                                        <div>
                                            <p style={{ fontSize: '13px', fontWeight: '500', color: s.text }}>{col.label}</p>
                                            <p style={{ fontSize: '11px', color: s.muted, marginTop: '2px' }}>{col.desc}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => setShowColumnPicker(false)} style={{ ...btn('#450a0a', '#fca5a5'), flex: 1 }}>Cancel</button>
                                <button onClick={async () => { setShowColumnPicker(false); await exportData() }}
                                    disabled={exportColumns.length === 0}
                                    style={{ ...btn(s.primary), flex: 2, fontWeight: '600', opacity: exportColumns.length === 0 ? 0.5 : 1 }}>
                                    ⬇️ Download {exportSelectedUsers.length} users
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Floating export action bar */}
                {exportMode && exportSelectedUsers.length > 0 && (
                    <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: s.primary, borderRadius: '12px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '16px', zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.4)', whiteSpace: 'nowrap' }}>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>
                            {exportSelectedUsers.length} user{exportSelectedUsers.length !== 1 ? 's' : ''} selected
                        </p>
                        <button onClick={() => setShowColumnPicker(true)}
                            style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                            ⬇️ Export
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}