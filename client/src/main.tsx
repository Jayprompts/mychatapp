import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { router } from '@/app/router';
import { Toaster } from '@/components/ui/Toaster';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster /> {/* app-wide, so a toast survives moving between the app and the sign-in screens */}
    </QueryClientProvider>
  </StrictMode>,
);
