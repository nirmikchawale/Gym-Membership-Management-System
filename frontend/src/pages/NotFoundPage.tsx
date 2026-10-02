import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="not-found">
      <p className="page-eyebrow">404 / Off the floor plan</p>
      <h1>This route isn’t part of Gridstone.</h1>
      <p>Return to the operations workspace and continue from a known surface.</p>
      <Link className="text-link" to="/">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to overview
      </Link>
    </section>
  )
}
