'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * Props for {@link ErrorBoundary}.
 *
 * @property children - The subtree to guard. A render/lifecycle error thrown by
 *   any descendant is caught here and replaced with {@link fallback}.
 * @property fallback - Render prop for the degraded state. Receives a `retry`
 *   callback that clears the caught error and re-mounts `children`, letting the
 *   subtree re-attempt its work (Req 12.2). When omitted, a minimal default
 *   fallback with a retry button is shown.
 * @property onError - Optional side-effect hook invoked once per caught error,
 *   intended for server-side logging only. Avoid `console.log` here (rule R11 /
 *   Req 13.4); `console.error` is acceptable but keep it minimal.
 */
export interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (retry: () => void) => ReactNode
  onError?: (error: Error, info: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
}

/**
 * Generic, reusable React error boundary.
 *
 * React error boundaries must be class components — `getDerivedStateFromError`
 * and `componentDidCatch` have no function-component equivalent — so this is the
 * one class component the feature ships. It isolates a subtree: a thrown render
 * error is contained here and degraded to a retry/fallback state instead of
 * propagating up and unmounting the host page (Req 12.2). Wrap only the region
 * that may fail (e.g. the lazily-loaded map) so the rest of the page is
 * unaffected — unlike a route-level `error.tsx`, which would catch the whole
 * route.
 *
 * @param props - see {@link ErrorBoundaryProps}.
 * @returns the guarded `children`, or the fallback UI once an error is caught.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  /**
   * React lifecycle: derives error state from a thrown error so the next render
   * shows the fallback instead of crashing.
   *
   * @returns state marking the boundary as errored.
   */
  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  /**
   * React lifecycle: forwards the caught error to the optional {@link
   * ErrorBoundaryProps.onError} handler for server-side logging.
   *
   * @param error - the thrown error.
   * @param info - React component stack for the error.
   */
  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info)
  }

  /** Clears the caught error and re-mounts `children`, enabling retry (Req 12.2). */
  private readonly retry = (): void => {
    this.setState({ hasError: false })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback(this.retry)
      return (
        <div role="alert" style={{ padding: 16, textAlign: 'center', color: 'var(--muted)' }}>
          <p style={{ margin: '0 0 12px' }}>Something went wrong.</p>
          <button
            type="button"
            onClick={this.retry}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
