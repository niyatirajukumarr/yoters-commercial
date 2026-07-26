'use client'

import { useEffect, useRef } from 'react'

// Small 2D penguin whose head tilts and eyes track the cursor, mouse-move
// driven via refs (not React state) so it doesn't re-render on every pixel.
export default function PenguinFace({ size = 64 }: { size?: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const headRef = useRef<SVGGElement>(null)
  const leftPupilRef = useRef<SVGCircleElement>(null)
  const rightPupilRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    function handleMove(e: MouseEvent) {
      const container = containerRef.current
      const head = headRef.current
      const leftPupil = leftPupilRef.current
      const rightPupil = rightPupilRef.current
      if (!container || !head || !leftPupil || !rightPupil) return

      const rect = container.getBoundingClientRect()
      const dx = e.clientX - (rect.left + rect.width / 2)
      const dy = e.clientY - (rect.top + rect.height / 2)

      const rotate = Math.max(-10, Math.min(10, dx / 40))
      const lift = Math.max(-3, Math.min(3, dy / 80))
      head.style.transform = `rotate(${rotate}deg) translateY(${lift}px)`

      const angle = Math.atan2(dy, dx)
      const px = Math.cos(angle) * 2.2
      const py = Math.sin(angle) * 2.2
      leftPupil.setAttribute('cx', String(21 + px))
      leftPupil.setAttribute('cy', String(25 + py))
      rightPupil.setAttribute('cx', String(39 + px))
      rightPupil.setAttribute('cy', String(25 + py))
    }

    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])

  return (
    <div ref={containerRef} style={{ width: size, height: size * 1.09, margin: '0 auto 10px' }} aria-hidden="true">
      <svg width={size} height={size * 1.09} viewBox="0 0 60 66">
        <g ref={headRef} style={{ transformOrigin: '30px 38px', transition: 'transform 0.12s ease-out' }}>
          <ellipse cx="9" cy="40" rx="6" ry="15" transform="rotate(-18 9 40)" fill="#161a22" />
          <ellipse cx="51" cy="40" rx="6" ry="15" transform="rotate(18 51 40)" fill="#161a22" />
          <ellipse cx="22" cy="64" rx="6" ry="2.6" fill="#ff8a3d" />
          <ellipse cx="38" cy="64" rx="6" ry="2.6" fill="#ff8a3d" />
          <path d="M30 3 C14 3 6 19 6 37 C6 54 16 63 30 63 C44 63 54 54 54 37 C54 19 46 3 30 3 Z" fill="#161a22" />
          <path d="M30 21 C21 21 16 33 16 44 C16 55 22 60 30 60 C38 60 44 55 44 44 C44 33 39 21 30 21 Z" fill="#ffffff" />
          <circle cx="21" cy="24" r="6" fill="#ffffff" />
          <circle cx="39" cy="24" r="6" fill="#ffffff" />
          <circle ref={leftPupilRef} cx="21" cy="25" r="2.6" fill="#161a22" />
          <circle ref={rightPupilRef} cx="39" cy="25" r="2.6" fill="#161a22" />
          <path d="M25.5 32 L30 37.5 L34.5 32 L30 28.5 Z" fill="#ff8a3d" />
        </g>
      </svg>
    </div>
  )
}
