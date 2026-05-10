import { useEffect, useRef } from 'preact/hooks';

export function useSpatialNav() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current) return;
      
      const focusables = Array.from(
        containerRef.current.querySelectorAll('.focusable')
      ) as HTMLElement[];
      
      if (focusables.length === 0) return;

      const currentIndex = focusables.findIndex(el => el === document.activeElement);
      
      let nextIndex = currentIndex;

      switch (e.key) {
        case 'ArrowRight':
          nextIndex = (currentIndex + 1) % focusables.length;
          e.preventDefault();
          break;
        case 'ArrowLeft':
          nextIndex = (currentIndex - 1 + focusables.length) % focusables.length;
          e.preventDefault();
          break;
        // Basic implementation for left/right navigation
        // A full TV-first nav would use a 2D spatial map
      }

      if (nextIndex !== currentIndex) {
        focusables[nextIndex]?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return containerRef;
}
