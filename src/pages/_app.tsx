// pages/_layout.tsx
import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'

export default function MainLayout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathname])

  return <Outlet />
}
