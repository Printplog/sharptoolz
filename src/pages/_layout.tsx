import { Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div>
      <h1 className=" bg-black">Hello</h1>
      <main>
        hey
        <Outlet />
      </main>
    </div>
  )
}