import { StrictMode, Component, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Top-level error boundary — prevents blank page on any uncaught runtime error
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', background: '#080e1e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ textAlign: 'center', color: '#94a3b8' }}>
            <svg width="48" height="48" viewBox="0 0 40 40" fill="none" style={{ margin: '0 auto 1rem' }}>
              <rect width="40" height="40" rx="9" fill="#1a56db" />
              <path d="M9 12L20 29L31 12" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>VENTORY</p>
            <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>Something went wrong loading the app.</p>
            <button
              onClick={() => { try { sessionStorage.clear(); localStorage.clear(); } catch {} window.location.reload(); }}
              style={{ background: '#1a56db', color: '#fff', border: 'none', borderRadius: '0.75rem', padding: '0.75rem 1.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
