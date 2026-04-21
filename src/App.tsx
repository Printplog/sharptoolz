import { Routes } from '@generouted/react-router'
import { useEffect } from 'react'
import { initSecurity } from '@/lib/utils/security'
import { useAuthStore } from '@/store/authStore'
import { isAdmin } from '@/lib/constants/roles'
import { usePresence } from '@/hooks/usePresence'

export default function App() {
  usePresence()

  useEffect(() => {
    // Capture referral source from URL and persist it
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('referred_by', ref);
      // Clean up URL parameter to keep it clean (optional)
      // window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const user = useAuthStore((state) => state.user)
  const isAdminOnlyUser = isAdmin(user?.role)

  useEffect(() => {
    if (isAdminOnlyUser) {
      return
    }

    return initSecurity({
      disableRightClick: true,
      disableTextSelection: true,
      disableDevToolsShortcuts: true,
      detectDevTools: true,
      disableConsole: true,
      detectDevToolsByDimensions: true,
      clearConsolePeriodically: true,
      disableDragAndDrop: true,
      disableCopyPaste: true,
      detectDebugger: true,
      disablePrintScreen: true,
      aggressiveDetection: true
    })
  }, [isAdminOnlyUser])

  return (
    <>
      <Routes />
    </>
  )
}
