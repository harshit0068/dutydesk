import { useState } from 'react'
import { useAuth } from './lib/authContext'

const features = [
  { title: 'One-click duty chart', text: 'Generate a balanced invigilation chart for the whole exam.' },
  { title: 'Fair and clash-free', text: 'Workload is spread evenly across faculty.' },
  { title: 'Your duties, instantly', text: 'Faculty see only their own duties, always up to date.' },
]

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

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
    <div className="flex min-h-screen">
      {/* Brand panel (hidden on phones) */}
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-700 p-12 text-white lg:flex">
        <div className="text-2xl font-bold tracking-tight">DutyDesk</div>

        <div>
          <h2 className="text-4xl font-bold leading-tight">
            Exam duties,
            <br />
            sorted in one click.
          </h2>
          <ul className="mt-10 space-y-6">
            {features.map((f) => (
              <li key={f.title} className="flex gap-4">
                <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-400/30 text-sm">
                  ✓
                </span>
                <div>
                  <p className="font-semibold">{f.title}</p>
                  <p className="text-sm text-indigo-200">{f.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-indigo-300">Vision2Web 2026 · SRMIST KTR</p>
      </div>

      {/* Sign-in panel */}
      <div className="flex w-full items-center justify-center bg-slate-50 p-6 lg:w-1/2">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200 sm:p-10">
          <div className="mb-8 lg:hidden">
            <h1 className="text-3xl font-bold text-indigo-600">DutyDesk</h1>
          </div>

          <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
          <p className="mt-2 text-slate-500">
            Sign in to manage or view invigilator duties.
          </p>

          <button
            onClick={handleClick}
            disabled={busy}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
                Redirecting to Google...
              </>
            ) : (
              <>
                <GoogleLogo />
                Continue with Google
              </>
            )}
          </button>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          )}

          <div className="mt-8 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
            <p>
              <span className="font-semibold text-slate-700">Exam cell admins</span> manage the duty chart.
            </p>
            <p className="mt-1">
              <span className="font-semibold text-slate-700">Faculty</span> see only their own duties.
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            Only approved accounts can access DutyDesk.
          </p>
        </div>
      </div>
    </div>
  )
}