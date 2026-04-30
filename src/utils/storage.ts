import { useCallback, useEffect, useState } from 'react';

export function useLocalStorage<T>(key: string, initial: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initial;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore quota/storage errors */
    }
  }, [key, value]);

  const set = useCallback((next: T | ((prev: T) => T)) => {
    setValue((current) => (typeof next === 'function' ? (next as (prev: T) => T)(current) : next));
  }, []);

  return [value, set];
}

export function useBookmarks(): {
  bookmarks: Set<string>;
  toggle: (id: string) => void;
  isBookmarked: (id: string) => boolean;
} {
  const [list, setList] = useLocalStorage<string[]>('gmt:bookmarks', []);
  const toggle = useCallback(
    (id: string) => {
      setList((current) => {
        const set = new Set(current);
        if (set.has(id)) set.delete(id);
        else set.add(id);
        return Array.from(set);
      });
    },
    [setList],
  );
  return {
    bookmarks: new Set(list),
    toggle,
    isBookmarked: (id: string) => list.includes(id),
  };
}

export function useRecent(key: string, max = 8): { recent: string[]; push: (id: string) => void } {
  const [list, setList] = useLocalStorage<string[]>(key, []);
  const push = useCallback(
    (id: string) => {
      setList((current) => {
        const filtered = current.filter((entry) => entry !== id);
        return [id, ...filtered].slice(0, max);
      });
    },
    [setList, max],
  );
  return { recent: list, push };
}
