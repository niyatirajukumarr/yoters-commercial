// Jumps to whatever search box the current page owns — scrolls it into view
// and drops the cursor in it, the way tapping a quoted message scrolls you to
// the original. Pages opt in by putting `data-app-search` on their input, so
// the tab bar doesn't need to know which page it's on.
export function focusPageSearch(): boolean {
  if (typeof document === 'undefined') return false
  const el = document.querySelector<HTMLInputElement>('[data-app-search]')
  if (!el) return false

  // Only scroll if it isn't already on screen — some search boxes live in a
  // sticky header, and centring one that's already visible yanks the page
  // for no reason.
  const rect = el.getBoundingClientRect()
  const alreadyVisible = rect.top >= 0 && rect.bottom <= (window.innerHeight || 0)
  if (!alreadyVisible) el.scrollIntoView({ behavior: 'smooth', block: 'center' })

  // preventScroll so focusing doesn't fight the smooth scroll with an
  // instant jump of its own.
  el.focus({ preventScroll: true })
  return true
}
