import { Component, type ErrorInfo, type ReactNode } from 'react'
import { reportClientError } from '../../lib/monitoring'

interface Props {
  children: ReactNode
  /** What to show if this section fails. Receives a retry callback. */
  fallback: (retry: () => void) => ReactNode
  name: string
}

/**
 * Contains a failure to one part of the page (e.g. the hub map). Without it, any error in a
 * lazily loaded section replaces the whole site with "Something went wrong".
 */
export class SectionBoundary extends Component<Props, { failed: boolean; attempt: number }> {
  state = { failed: false, attempt: 0 }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportClientError(error, { source: `SectionBoundary:${this.props.name}`, componentStack: info.componentStack ?? undefined })
  }

  retry = () => this.setState((s) => ({ failed: false, attempt: s.attempt + 1 }))

  render() {
    if (this.state.failed) return this.props.fallback(this.retry)
    return <div key={this.state.attempt} className="contents">{this.props.children}</div>
  }
}
