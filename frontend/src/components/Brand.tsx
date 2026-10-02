export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand${compact ? ' brand--compact' : ''}`} aria-label="Gridstone">
      <span className="brand__mark" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </span>
      <span className="brand__wordmark">Gridstone</span>
    </div>
  )
}
