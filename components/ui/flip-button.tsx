'use client';

import * as React from 'react';
import {
  type HTMLMotionProps,
  type Transition,
  type Variant,
  motion,
} from 'framer-motion';

import { cn } from '@/lib/utils';

type FlipDirection = 'top' | 'bottom' | 'left' | 'right';

interface FlipButtonProps extends HTMLMotionProps<'button'> {
  frontText: string;
  backText: string;
  transition?: Transition;
  frontClassName?: string;
  backClassName?: string;
  from?: FlipDirection;
  /**
   * Drive the flip from state instead of hover. Needed on touch, where there
   * is no hover to flip on — pass the current value and the button flips when
   * it changes. Leave undefined for the original hover behaviour.
   */
  flipped?: boolean;
  /** Optional mark shown before each label. */
  frontIcon?: React.ReactNode;
  backIcon?: React.ReactNode;
}

const defaultSpanClassName =
  'absolute inset-0 flex items-center justify-center gap-1.5 rounded-lg whitespace-nowrap';

const FlipButton = React.forwardRef<HTMLButtonElement, FlipButtonProps>(
  (
    {
      frontText,
      backText,
      transition = { type: 'spring', stiffness: 280, damping: 20 },
      className,
      frontClassName,
      backClassName,
      from = 'top',
      flipped,
      frontIcon,
      backIcon,
      style,
      ...props
    },
    ref,
  ) => {
    const isVertical = from === 'top' || from === 'bottom';
    const rotateAxis = isVertical ? 'rotateX' : 'rotateY';

    const frontOffset = from === 'top' || from === 'left' ? '50%' : '-50%';
    const backOffset = from === 'top' || from === 'left' ? '-50%' : '50%';

    const buildVariant = (
      opacity: number,
      rotation: number,
      offset: string | null = null,
    ): Variant => ({
      opacity,
      [rotateAxis]: rotation,
      ...(isVertical && offset !== null ? { y: offset } : {}),
      ...(!isVertical && offset !== null ? { x: offset } : {}),
    });

    const frontVariants = {
      initial: buildVariant(1, 0, '0%'),
      hover: buildVariant(0, 90, frontOffset),
    };

    const backVariants = {
      initial: buildVariant(0, 90, backOffset),
      hover: buildVariant(1, 0, '0%'),
    };

    const controlled = flipped !== undefined;

    return (
      <motion.button
        ref={ref}
        initial="initial"
        {...(controlled
          ? { animate: flipped ? 'hover' : 'initial' }
          : { whileHover: 'hover' })}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'relative inline-block h-10 text-sm font-medium cursor-pointer perspective-[1000px] focus:outline-none',
          className,
        )}
        // Inline rather than utility classes. This app's globals.css has an
        // unlayered `* { margin: 0; padding: 0 }` reset, and unlayered CSS
        // beats @layer'd CSS in the cascade whatever the specificity — so
        // Tailwind's px-*/py-* utilities compute to 0 here. Perspective is
        // inline for the same belt-and-braces reason: the 3D depth is the
        // whole effect.
        style={{ perspective: 1000, padding: '0 14px', ...style }}
        {...props}
      >
        <motion.span
          variants={frontVariants}
          transition={transition}
          className={cn(
            defaultSpanClassName,
            'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-white',
            frontClassName,
          )}
        >
          {frontIcon}
          {frontText}
        </motion.span>
        <motion.span
          variants={backVariants}
          transition={transition}
          className={cn(
            defaultSpanClassName,
            'bg-neutral-800 text-white dark:bg-white dark:text-neutral-800',
            backClassName,
          )}
        >
          {backIcon}
          {backText}
        </motion.span>
        {/* Both faces are absolutely positioned, so this invisible copy is what
            gives the button its size. Size to the longer label — and to a mark
            if either face has one — or the wider face gets clipped, as "Veg"
            front against "Non-veg" back would. */}
        <span className="invisible inline-flex items-center gap-1.5">
          {frontIcon ?? backIcon}
          {frontText.length >= backText.length ? frontText : backText}
        </span>
      </motion.button>
    );
  },
);

FlipButton.displayName = 'FlipButton';

export { FlipButton, type FlipButtonProps, type FlipDirection };
