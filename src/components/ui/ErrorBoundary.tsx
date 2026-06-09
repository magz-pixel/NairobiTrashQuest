import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-[var(--bg-deep)] p-6 text-center">
          <p className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--neon-clean)]">
            Something went wrong
          </p>
          <p className="max-w-sm text-sm text-white/60">{this.state.error.message}</p>
          <button
            type="button"
            className="rounded-lg border border-[var(--neon-clean)]/40 bg-[var(--neon-clean)]/10 px-4 py-2 text-sm font-semibold text-[var(--neon-clean)]"
            onClick={() => window.location.reload()}
          >
            Reload app
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
