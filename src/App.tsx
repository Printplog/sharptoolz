import { Routes } from '@generouted/react-router'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { isAdmin } from '@/lib/constants/roles'

export default function App() {
  const user = useAuthStore((state) => state.user)
  const isAdminOnlyUser = isAdmin(user?.role)

  useEffect(() => {
    // Security restrictions disabled
  }, [isAdminOnlyUser])

  return (
    <>
      <Routes />
    </>
  )
}
