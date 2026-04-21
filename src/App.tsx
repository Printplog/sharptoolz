import { Routes } from '@generouted/react-router'
import { useEffect } from 'react'
import { initSecurity } from '@/lib/utils/security'
import { useAuthStore } from '@/store/authStore'
import { isAdmin } from '@/lib/constants/roles'
import { usePresence } from '@/hooks/usePresence'
import { sourceTracker } from '@/lib/utils/sourceTracker'

export default function App() {
  usePresence()

  useEffect(() => {
    sourceTracker.captureSource()
  }, [])

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
