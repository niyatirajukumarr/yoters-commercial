// Jumps to whatever search box the current page owns — scrolls it into view
// and drops the cursor in it, the way tapping a quoted message scrolls you to
// the original. Pages opt in by putting `data-app-search` on their input, so
// the tab bar doesn't need to know which page it's on.
export function focusPageSearch(): boolean {
  if (typeof document === 'undefined') return false
  const el = document.querySelector<HTMLInputElement>('[data-app-search]')
  if (!el) return false

  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  // preventScroll so focusing doesn't fight the smooth scroll with an
  // instant jump of its own.
  el.focus({ preventScroll: true })
  return true
}
