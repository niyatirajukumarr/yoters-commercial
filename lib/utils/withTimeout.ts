// Supabase calls use the browser's `fetch` under the hood, which has no
// built-in timeout — on a flaky connection a stalled request hangs
// indefinitely rather than rejecting, leaving any `loading` state that
// depends on it stuck forever. Race every such call against a timeout so
// failures are always visible instead of an infinite spinner.
// Accepts PromiseLike (not just Promise) so Supabase's thenable query
// builders — which are not actual Promise instances — can be passed directly.
export function withTimeout<T>(promise: PromiseLike<T>, ms = 8000, message = 'Request timed out'): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ])
}
