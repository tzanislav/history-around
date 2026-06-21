import './ConsoleOverlay.css'

export type ConsoleEntry = {
  id: number
  level: 'log' | 'info' | 'warn' | 'error'
  source: 'app' | 'unity'
  message: string
  time: string
}

type ConsoleOverlayProps = {
  entries: ConsoleEntry[]
  isVisible: boolean
  onHide: () => void
  onClear: () => void
}

function ConsoleOverlay({ entries, isVisible, onHide, onClear }: ConsoleOverlayProps) {
  if (!isVisible) {
    return null
  }

  return (
    <aside className="console-overlay" role="dialog" aria-label="Runtime console output">
      <header className="console-overlay__header">
        <h2>Console Output</h2>
        <div className="console-overlay__actions">
          <button type="button" onClick={onClear}>Clear</button>
          <button type="button" onClick={onHide}>Hide</button>
        </div>
      </header>

      <div className="console-overlay__body">
        {entries.length === 0 ? (
          <p className="console-overlay__empty">No messages yet.</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className={`console-overlay__line console-overlay__line--${entry.level}`}>
              <span className="console-overlay__meta">[{entry.time}] {entry.source}</span>
              <span>{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </aside>
  )
}

export default ConsoleOverlay
