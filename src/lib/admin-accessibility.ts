"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Hook to trap focus inside a modal/dialog/drawer, handle Escape key,
 * and return focus to the invoking element upon close.
 */
export function useDialogFocusTrap(
  isOpen: boolean,
  onClose: () => void,
  containerRef: React.RefObject<HTMLElement | null>
) {
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // 1. Remember the currently focused element
    previousActiveElementRef.current = document.activeElement as HTMLElement | null;

    const container = containerRef.current;
    if (!container) return;

    // 2. Focus the first focusable element inside the container, or the container itself
    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    
    const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelector);
    if (focusableElements.length > 0) {
      focusableElements[0]?.focus();
    } else {
      container.focus();
    }

    // 3. Handle Tab trapping and Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab") {
        const currentFocusables = Array.from(
          container.querySelectorAll<HTMLElement>(focusableSelector)
        ).filter((el) => el.offsetParent !== null); // only visible elements

        if (currentFocusables.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = currentFocusables[0];
        const lastElement = currentFocusables[currentFocusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || document.activeElement === container) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      // 4. Return focus to invoking element upon close
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === "function") {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, onClose, containerRef]);
}

/**
 * Detects whether the user prefers reduced motion.
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handler);
    } else {
      mediaQuery.addListener(handler);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handler);
      } else {
        mediaQuery.removeListener(handler);
      }
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Returns inline style or className for a staggered entrance animation,
 * strictly capped at 30ms per row and disabled under prefers-reduced-motion.
 */
export function getStaggerDelayStyle(
  index: number,
  maxDelayMs: number = 240,
  prefersReducedMotion: boolean = false
): React.CSSProperties {
  if (prefersReducedMotion) {
    return {};
  }
  const delayMs = Math.min(index * 25, maxDelayMs);
  return {
    animationDelay: `${delayMs}ms`,
  };
}
