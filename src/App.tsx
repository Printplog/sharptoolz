import { Routes } from '@generouted/react-router'
import { useEffect } from 'react'
import { initSecurity } from '@/lib/utils/security'

export default function App() {
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
      aggressiveDetection: true, // Most important - detects DevTools via browser menu
    })
  }, [])

  return <Routes />
}