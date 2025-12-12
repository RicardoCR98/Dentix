// src/hooks/useScrollVisibility.ts
import { useState, useEffect, RefObject } from "react";

interface UseScrollVisibilityOptions {
  /** Element to observe (if not provided, observes window scroll) */
  targetRef?: RefObject<HTMLElement>;
  /** Threshold in pixels - FAB appears after scrolling this many pixels */
  threshold?: number;
  /** Root margin for IntersectionObserver (e.g., "0px 0px -100px 0px") */
  rootMargin?: string;
}

/**
 * Hook to detect when a target element has scrolled out of view
 * Returns true when the element is no longer visible (FAB should appear)
 *
 * @example
 * // Option 1: Using IntersectionObserver with a ref
 * const quickActionsRef = useRef<HTMLElement>(null);
 * const showFAB = useScrollVisibility({ targetRef: quickActionsRef });
 *
 * @example
 * // Option 2: Using scroll position threshold
 * const showFAB = useScrollVisibility({ threshold: 300 });
 */
export function useScrollVisibility(options: UseScrollVisibilityOptions = {}) {
  const { targetRef, threshold = 200, rootMargin = "0px" } = options;
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    // If targetRef is provided, use IntersectionObserver
    if (targetRef?.current) {
      const target = targetRef.current;

      const observer = new IntersectionObserver(
        ([entry]) => {
          // When target is NOT intersecting (scrolled out of view), FAB should appear
          setIsHidden(!entry.isIntersecting);
        },
        {
          root: null, // viewport
          rootMargin,
          threshold: 0, // Trigger as soon as any part leaves viewport
        },
      );

      observer.observe(target);

      return () => {
        observer.disconnect();
      };
    }

    // Otherwise, use scroll position with threshold
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY || document.documentElement.scrollTop;
          setIsHidden(scrollY > threshold);
          ticking = false;
        });
        ticking = true;
      }
    };

    // Initial check
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [targetRef, threshold, rootMargin]);

  return isHidden;
}
