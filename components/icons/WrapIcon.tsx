import { forwardRef, type SVGProps } from 'react'

export interface WrapIconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  size?: number | string
  strokeWidth?: number | string
}

// A roll in a paper cone, filling spilling over the top. Hand-drawn because
// lucide has no wrap/roll/burrito glyph; the props match a lucide icon
// (size / color / strokeWidth) so it drops straight into categoryIcon().
//
// Deliberately coarse: at 24px with a 1.6 stroke, anything under ~3 units
// wide fills in solid, so this is two big scallops rather than the four or
// five a larger drawing would use.
export const WrapIcon = forwardRef<SVGSVGElement, WrapIconProps>(function WrapIcon(
  { size = 24, color = 'currentColor', strokeWidth = 2, ...props },
  ref,
) {
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* filling bulging over the rim */}
      <path d="M6 10.5c-2-3.4.9-6.9 4-5.3 1-3.4 5.6-3.2 6.4.3 2.6-.6 4 2.6 1.6 5" />
      {/* the paper cone */}
      <path d="M6 10.5 8.6 20.8c.2.7.8 1.2 1.5 1.2h3.8c.7 0 1.3-.5 1.5-1.2L18 10.5" />
      {/* where the paper laps over itself */}
      <path d="M6.9 14.6c2 2 2.9 4.6 2.7 7.4" />
      {/* seasoning — solid dots, rings close up at this size */}
      <circle cx="14.2" cy="14.6" r=".75" fill={color} stroke="none" />
      <circle cx="12.6" cy="18.2" r=".75" fill={color} stroke="none" />
    </svg>
  )
})
