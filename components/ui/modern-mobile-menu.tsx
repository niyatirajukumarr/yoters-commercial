'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import './modern-mobile-menu.css'

type IconComponentType = React.ElementType<{ className?: string }>

export interface InteractiveMenuItem {
  label: string
  icon: IconComponentType
  /** Run when this tab is picked (navigate, switch in-page tab, focus search…). */
  onSelect?: () => void
}

export interface InteractiveMenuProps {
  items?: InteractiveMenuItem[]
  accentColor?: string
  /** Controlled active tab. Omit to let the menu track it internally. */
  activeIndex?: number
  onIndexChange?: (index: number) => void
}

const defaultAccentColor = 'var(--accent, #E8334A)'

const InteractiveMenu: React.FC<InteractiveMenuProps> = ({
  items,
  accentColor,
  activeIndex: controlledIndex,
  onIndexChange,
}) => {
  const finalItems = useMemo(() => {
    const isValid = items && Array.isArray(items) && items.length >= 2 && items.length <= 5
    if (!isValid) {
      console.warn("InteractiveMenu: 'items' prop is invalid or missing.", items)
      return []
    }
    return items
  }, [items])

  const [internalIndex, setInternalIndex] = useState(0)
  // Controlled when the caller passes activeIndex (so the highlight can follow
  // the route/tab rather than only what was last tapped here).
  const isControlled = typeof controlledIndex === 'number'
  const activeIndex = isControlled ? controlledIndex! : internalIndex

  useEffect(() => {
    if (!isControlled && internalIndex >= finalItems.length) setInternalIndex(0)
  }, [finalItems, internalIndex, isControlled])

  const textRefs = useRef<(HTMLElement | null)[]>([])
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const setLineWidth = () => {
      const activeItemElement = itemRefs.current[activeIndex]
      const activeTextElement = textRefs.current[activeIndex]
      if (activeItemElement && activeTextElement) {
        // scrollWidth, not offsetWidth: the label is width-clamped while
        // collapsed, so offsetWidth would measure 0 for a tab being opened.
        const textWidth = activeTextElement.scrollWidth
        activeItemElement.style.setProperty('--lineWidth', `${textWidth}px`)
      }
    }

    setLineWidth()
    window.addEventListener('resize', setLineWidth)
    return () => window.removeEventListener('resize', setLineWidth)
  }, [activeIndex, finalItems])

  const handleItemClick = (index: number) => {
    if (!isControlled) setInternalIndex(index)
    onIndexChange?.(index)
    finalItems[index]?.onSelect?.()
  }

  const navStyle = useMemo(
    () => ({ '--component-active-color': accentColor || defaultAccentColor } as React.CSSProperties),
    [accentColor]
  )

  if (!finalItems.length) return null

  return (
    <nav className="menu" role="navigation" style={navStyle}>
      {finalItems.map((item, index) => {
        const isActive = index === activeIndex
        const IconComponent = item.icon
        return (
          <button
            key={item.label}
            type="button"
            aria-current={isActive ? 'page' : undefined}
            aria-label={item.label}
            className={`menu__item ${isActive ? 'active' : ''}`}
            onClick={() => handleItemClick(index)}
            ref={el => { itemRefs.current[index] = el }}
          >
            <div className="menu__icon">
              <IconComponent className="icon" />
            </div>
            <strong
              className={`menu__text ${isActive ? 'active' : ''}`}
              ref={el => { textRefs.current[index] = el }}
            >
              {item.label}
            </strong>
          </button>
        )
      })}
    </nav>
  )
}

export { InteractiveMenu }
