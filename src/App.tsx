import { Routes } from '@generouted/react-router'
import { useEffect } from 'react'
import { initSecurity } from '@/lib/utils/security'
import { useAuthStore } from '@/store/authStore'
import useSettingsStore from '@/store/settingsStore'

export default function App() {
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    // Initialize security measures
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

  // Fetch site settings (and cache_version) on mount
  const fetchSettings = useSettingsStore(state => state.fetchSettings)
  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return (
    <>
      <Routes />
    </>
  )
}