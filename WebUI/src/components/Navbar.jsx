import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="bg-surface border-b border-border">
      <div className="mx-auto max-w-5xl px-4 md:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-primary">
          <span className="grid place-items-center size-8 rounded-lg bg-primary text-white text-sm">DD</span>
          DormDash
        </Link>
        <div className="flex gap-6 text-sm text-body">
          <Link to="/" className="hover:text-primary">Home</Link>
          <Link to="/login" className="hover:text-primary">Log in</Link>
        </div>
      </div>
    </nav>
  )
}