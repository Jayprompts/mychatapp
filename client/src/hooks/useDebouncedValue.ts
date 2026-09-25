import { useEffect, useState } from 'react';

// Returns `value`, but only after it has stopped changing for `delay` ms (e.g. search-as-you-type).
export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
