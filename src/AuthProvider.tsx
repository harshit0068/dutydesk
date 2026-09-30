import { useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { AuthContext, type Role } from './lib/authContext.ts'

export default function AuthProvider({ children }: { children: ReactNode }) {
const [session, setSession] = useState<Session | null>(null)
const [sessionLoading, setSessionLoading] = useState(true)
const [role, setRole] = useState<Role>('none')
const [facultyId, setFacultyId] = useState<number | null>(null)
const [resolvedFor, setResolvedFor] = useState<string | null>(null)

const email = session?.user.email?.toLowerCase() ?? null

useEffect(() => {
supabase.auth.getSession().then(({ data }) => {
setSession(data.session)
setSessionLoading(false)
})
const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
setSession(next)
})
return () => sub.subscription.unsubscribe()
}, [])

useEffect(() => {
if (!email) return
const currentEmail = email
let cancelled = false



async function resolve() {
  let nextRole: Role = 'none'
  let nextFacultyId: number | null = null

  const admin = await supabase
    .from('admins')
    .select('email')
    .eq('email', currentEmail)
    .maybeSingle()

  if (admin.data) {
    nextRole = 'admin'
  } else {
    const person = await supabase
      .from('faculty')
      .select('id')
      .eq('email', currentEmail)
      .maybeSingle()
    if (person.data) {
      nextRole = 'faculty'
      nextFacultyId = person.data.id as number
    }
  }

  if (cancelled) return
  setRole(nextRole)
  setFacultyId(nextFacultyId)
  setResolvedFor(currentEmail)
}

resolve()
return () => {
  cancelled = true
}
}, [email])

async function signInWithGoogle() {
const { error } = await supabase.auth.signInWithOAuth({
provider: 'google',
options: { redirectTo: window.location.origin },
})
if (error) throw error
}

async function signOut() {
await supabase.auth.signOut()
}

const loading = sessionLoading || (email !== null && resolvedFor !== email)

return (
<AuthContext.Provider
value={{
loading,
email,
role: email ? role : 'none',
facultyId: email ? facultyId : null,
signInWithGoogle,
signOut,
}}
>
{children}
</AuthContext.Provider>
)
}