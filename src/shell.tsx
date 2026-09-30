import { useState } from 'react'
import App from './App'
import FacultyView from './FacultyView'
import Dashboard from './Dashboard'
import Manage from './Manage'
import Login from './Login'
import { useAuth } from './lib/authContext'

type Tab = 'admin' | 'faculty' | 'dashboard' | 'manage'

export default function Shell() {
const { loading, email, role, facultyId, signOut } = useAuth()
const [tab, setTab] = useState<Tab>('admin')

function tabClass(name: Tab) {
return (
'rounded-full px-5 py-1.5 text-sm font-semibold ' +
(tab === name
? 'bg-indigo-600 text-white'
: 'bg-slate-100 text-slate-600 hover:bg-slate-200')
)
}

if (loading) {
return (
<div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
Loading...
</div>
)
}

if (!email) return <Login />

if (role === 'none') {
return (
<div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
<div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow">
<h1 className="text-2xl font-bold text-slate-800">No access</h1>
<p className="mt-3 text-slate-500">
{email} is not registered as an exam cell admin or as a faculty member. Ask the
exam cell to add your email.
</p>
<button onClick={signOut} className="mt-6 rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow hover:bg-indigo-700" >
Sign out
</button>
</div>
</div>
)
}

return (
<div>
<nav className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-6 py-3">
<span className="mr-4 text-lg font-bold text-indigo-600">DutyDesk</span>
{role === 'admin' && (
<>
<button onClick={() => setTab('admin')} className={tabClass('admin')}>
Admin
</button>
<button onClick={() => setTab('faculty')} className={tabClass('faculty')}>
Faculty view
</button>
<button onClick={() => setTab('dashboard')} className={tabClass('dashboard')}>
Dashboard
</button>
<button onClick={() => setTab('manage')} className={tabClass('manage')}>
Manage data
</button>
</>
)}
{role === 'faculty' && (
<span className="rounded-full bg-indigo-600 px-5 py-1.5 text-sm font-semibold text-white">
My duties
</span>
)}
<div className="ml-auto flex items-center gap-3">
<span className="text-xs text-slate-500">
{email} ({role})
</span>
<button onClick={signOut} className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow hover:bg-slate-100" >
Sign out
</button>
</div>
</nav>



  {role === 'admin' && tab === 'admin' && <App />}
  {role === 'admin' && tab === 'faculty' && <FacultyView />}
  {role === 'admin' && tab === 'dashboard' && <Dashboard />}
  {role === 'admin' && tab === 'manage' && <Manage />}
  {role === 'faculty' && facultyId !== null && <FacultyView lockedFacultyId={facultyId} />}
</div>
)
}