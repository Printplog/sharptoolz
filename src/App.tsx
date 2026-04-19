import { Routes } from '@generouted/react-router'
import { useEffect } from 'react'
import { initSecurity } from '@/lib/utils/security'
import { useAuthStore } from '@/store/authStore'
import { isAdmin } from '@/lib/constants/roles'

export default function App() {
  const user = useAuthStore((state) => state.user)
  const isAdminOnlyUser = isAdmin(user?.role)

  useEffect(() => {
    // Disabled security restrictions due to false positives
    return () => {};
    /*
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
      aggressiveDetection: true,
    })
    */
  }, [isAdminOnlyUser])

  return (
    <>
      <Routes />
    </>
  )
}
