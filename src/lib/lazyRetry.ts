import { lazy, type ComponentType } from 'react'

/**
 * React.lazy that retries a failed chunk download once (patchy mobile data drops requests).
 * If it still fails, the error goes to the nearest SectionBoundary instead of the whole app.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- same constraint as React.lazy
export function lazyRetry<T extends ComponentType<any>>(load: () => Promise<{ default: T }>) {
  return lazy<T>(() =>
    load().catch(
      () =>
        new Promise<{ default: T }>((resolve, reject) => {
          window.setTimeout(() => load().then(resolve, reject), 1500)
        }),
    ),
  )
}
