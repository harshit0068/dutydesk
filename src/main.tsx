import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Shell from './shell.tsx'
import AuthProvider from './AuthProvider.tsx'

createRoot(document.getElementById('root')!).render(
<StrictMode>
<AuthProvider>
<Shell />
</AuthProvider>
</StrictMode>,
)