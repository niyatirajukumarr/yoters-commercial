// Shared Framer Motion variants — keep in sync with the patterns in app/page.tsx
// so scroll-reveal and hover behavior feels consistent across the whole app.

export const transitionEase = [0.22, 1, 0.36, 1] as const

export const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: transitionEase } },
}

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.45, ease: transitionEase } },
}

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: transitionEase } },
}

export const slideLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.55, ease: transitionEase } },
}

export const slideRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.55, ease: transitionEase } },
}

// Wrap a list/grid container with this, then each child with `fadeUp`/`scaleIn`
// (or `staggerItem`) to get a staggered reveal.
export const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

export const staggerFast = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}

export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: transitionEase } },
}

// Default viewport config for scroll-triggered reveals — fires once, slightly
// before the element is fully in view.
export const viewportOnce = { once: true, margin: '-60px' } as const

// Drop onto any clickable card/row for a consistent hover + tap response.
export const hoverLift = {
  whileHover: { y: -4, scale: 1.01, transition: { duration: 0.25, ease: transitionEase } },
  whileTap: { scale: 0.98 },
}

export const hoverScale = {
  whileHover: { scale: 1.03, transition: { duration: 0.2 } },
  whileTap: { scale: 0.97 },
}
