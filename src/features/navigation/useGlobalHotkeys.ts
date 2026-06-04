import { useEffect } from 'react';
import type { RefObject } from 'react';

type View = 'formulas' | 'problems' | 'reference';

type Params = {
  setView: (view: View) => void;
  setQuery: (value: string) => void;
  goBack?: () => void;
  hasQuery?: boolean;
  searchInputRef: RefObject<HTMLInputElement | null>;
};

export function useGlobalHotkeys({ setView, setQuery, goBack, hasQuery, searchInputRef }: Params) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const searchInput = searchInputRef.current;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInput?.focus();
        searchInput?.select();
      } else if (event.key === 'Escape' && (document.activeElement === searchInput || hasQuery)) {
        event.preventDefault();
        setQuery('');
      } else if ((event.altKey && event.key === 'ArrowLeft') || (event.metaKey && event.key === '[')) {
        event.preventDefault();
        goBack?.();
      } else if (event.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        event.preventDefault();
        searchInput?.focus();
      } else if (event.altKey && /^[1-3]$/.test(event.key)) {
        const tabOrder: View[] = ['formulas', 'problems', 'reference'];
        const idx = Number(event.key) - 1;
        if (tabOrder[idx]) {
          event.preventDefault();
          setView(tabOrder[idx]);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goBack, hasQuery, setQuery, setView, searchInputRef]);
}
