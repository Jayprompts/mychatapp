import { useEffect, useState } from 'react';

type Health = { status: string; db: string; uptime: number };

export default function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((json) => setHealth(json.data))
      .catch(() => setError('API unreachable'));
  }, []);

  return (
    <main className="min-h-screen grid place-items-center bg-bg p-4">
      <div className="w-full max-w-sm rounded-xl bg-card p-8 text-center shadow-card">
        <h1 className="gradient-brand-text text-[28px] font-bold">Grove</h1>
        <p className="mt-1 text-text-secondary">Phase 0 — wiring check</p>

        <div className="mt-6 space-y-1 text-[15px]">
          {error && <p className="text-error">{error}</p>}
          {!error && !health && <p className="text-text-secondary">Checking…</p>}
          {health && (
            <>
              <p>API: <strong className="text-success">{health.status}</strong></p>
              <p>Database: <strong>{health.db}</strong></p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
