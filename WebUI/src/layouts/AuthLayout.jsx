import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center p-page bg-background">
      <div className="w-full max-w-md p-8 bg-surface rounded-card shadow-xl">
        <Outlet />
      </div>
    </div>
  )
}