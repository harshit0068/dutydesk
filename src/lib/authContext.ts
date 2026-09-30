import { createContext, useContext } from 'react'

export type Role = 'admin' | 'faculty' | 'none'

export type AuthState = {
loading: boolean
email: string | null
role: Role
facultyId: number | null
signInWithGoogle: () => Promise<void>
signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
const ctx = useContext(AuthContext)
if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
return ctx
}