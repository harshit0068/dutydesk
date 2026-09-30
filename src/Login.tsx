import { useState } from 'react'
import { useAuth } from './lib/authContext'

export default function Login() {
const { signInWithGoogle } = useAuth()
const [busy, setBusy] = useState(false)
const [error, setError] = useState('')

async function handleClick() {
setBusy(true)
setError('')
try {
await signInWithGoogle()
} catch (e) {
setError(e instanceof Error ? e.message : String(e))
setBusy(false)
}
}

return (
<div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
<div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow">
<h1 className="text-3xl font-bold text-indigo-600">DutyDesk</h1>
<p className="mt-2 text-slate-500">Invigilator duty allocation for exam cells and faculty</p>



    <button
      onClick={handleClick}
      disabled={busy}
      className="mt-8 w-full rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
    >
      {busy ? 'Redirecting to Google...' : 'Continue with Google'}
    </button>

    {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

    <p className="mt-6 text-xs text-slate-400">
      Exam cell admins manage the duty chart. Faculty see only their own duties.
    </p>
  </div>
</div>
)
}