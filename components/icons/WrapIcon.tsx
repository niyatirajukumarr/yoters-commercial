import { forwardRef, type SVGProps } from 'react'

export interface WrapIconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  size?: number | string
  strokeWidth?: number | string
}

// A rolled wrap on the diagonal: one end folded shut, the other open with the
// filling spilling out, and two seams where the flatbread laps over itself.
// Hand-drawn because lucide has no roll/wrap/burrito glyph; the props match a
// lucide icon (size / color / strokeWidth) so it drops into categoryIcon().
//
// Drawn flat and rotated as a group rather than doing the trig by hand. The
// earlier upright version — a tapered sleeve with a fluffy top — read as a
// popcorn tub, and a symmetric capsule read as a bandage; the open filled end
// is what makes it a wrap. Geometry is sized so the rotated shape fills about
// as much of the 24px box as the lucide icons it sits beside.
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
      <g transform="rotate(-40 12 12)">
        {/* the roll, folded shut at the near end */}
        <path d="M18.8 8.4H6.6a3.6 3.6 0 0 0 0 7.2h12.2" />
        {/* filling at the open end */}
        <path d="M18.8 15.6c2.4.8 4.4-.9 3.7-2.7 1.6-.9 1.3-3-.5-3.4.4-1.8-1.6-2.9-3.2-1.1" />
        {/* seams where the flatbread laps over */}
        <path d="M11.6 8.6 9.9 15.4" />
        <path d="M15.8 8.5 14.1 15.5" />
      </g>
    </svg>
  )
})
