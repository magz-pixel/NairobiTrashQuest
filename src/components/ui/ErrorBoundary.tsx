import { Component, type ErrorInfo, type ReactNode } from 'react'
import { isStaleBuildError, reloadForNewBuild } from '../../lib/staleBuild'

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
    // Old build asking for files from before the latest deploy: quietly load the new one.
    if (isStaleBuildError(error) && reloadForNewBuild()) return
    console.error('App error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      if (isStaleBuildError(this.state.error)) {
        return (
          <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--bg-app)] p-6 text-sm font-semibold text-[var(--text-muted)]">
            Updating to the latest version…
          </div>
        )
      }
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
