// src/components/ScrollToTop.tsx
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // 1. Scroll the window
    window.scrollTo(0, 0)
    
    // 2. Also scroll document elements (standard fallback)
    document.documentElement.scrollTo(0, 0)
    document.body.scrollTo(0, 0)

    // 3. Handle cases where the layout uses a scrollable div (like Admin)
    // We search for elements that might be the main scroll container
    const mainContainers = document.querySelectorAll('main, .overflow-auto, .overflow-y-auto')
    mainContainers.forEach(el => {
      el.scrollTo(0, 0)
    })

    // 4. One more time after a tiny delay to catch any late-rendering content
    const timer = setTimeout(() => {
      window.scrollTo(0, 0)
      mainContainers.forEach(el => el.scrollTo(0, 0))
    }, 10)

    return () => clearTimeout(timer)
  }, [pathname])

  return null
}
