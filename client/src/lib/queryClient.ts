import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Retry network/server errors (up to 2x), never 4xx — those won't fix themselves.
      retry: (failureCount, err) => {
        if (err instanceof ApiError && err.status >= 400 && err.status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});
