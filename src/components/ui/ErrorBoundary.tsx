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
        <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-[var(--bg-app)] p-6 text-center">
          <p className="text-lg font-semibold text-[var(--text-primary)]">Something went wrong</p>
          <p className="max-w-sm text-sm text-[var(--text-muted)]">{this.state.error.message}</p>
          <button
            type="button"
            className="rounded-lg border border-[var(--brand-teal)] bg-[var(--brand-teal)] px-4 py-2 text-sm font-semibold text-white"
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
