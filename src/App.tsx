import { Routes } from '@generouted/react-router'
import { useEffect } from 'react'
import { initSecurity } from '@/lib/utils/security'



import { useAuthStore } from '@/store/authStore'

export default function App() {
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    // Initialize security measures
    // initSecurity now has its own internal check for isAdminUser()
    initSecurity({
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
      aggressiveDetection: true,
    })
  }, [user?.is_staff])

  return <Routes />
}