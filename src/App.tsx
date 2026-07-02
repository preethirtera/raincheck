import './App.css'

// Phase 0 shell: brand, an empty load meter, and a stubbed primary action.
// The real commitment inbox and yes-budget arrive in Phase 1.
function App() {
  return (
    <main className="shell">
      <header className="masthead">
        <h1 className="wordmark">
          Rain<span className="wordmark-neon">Check</span>
        </h1>
        <p className="tagline">Pause before you say yes.</p>
      </header>

      <section className="budget" aria-label="Weekly yes-budget">
        <div className="budget-row">
          <span className="budget-label">This week's yes-budget</span>
          <span className="budget-value">0% spent</span>
        </div>
        <div
          className="meter"
          role="meter"
          aria-valuenow={0}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Yes-budget spent"
        >
          <div className="meter-fill" style={{ width: '0%' }} />
        </div>
        <p className="budget-hint">
          Your week is wide open. Set a budget once Phase&nbsp;1 lands.
        </p>
      </section>

      <button className="add-ask" type="button" disabled>
        + Add an ask
      </button>

      <footer className="phase-note">
        <span className="phase-chip">PHASE 0</span> identity &amp; shell — the
        budget, pause timer, and decline scripts arrive in Phase&nbsp;1
      </footer>
    </main>
  )
}

export default App
