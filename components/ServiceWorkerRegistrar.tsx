'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export default function ServiceWorkerRegistrar() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ('serviceWorker' in navigator) {
      const registerWorker = () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .catch((err) => console.error('Service worker registration failed:', err));
      };

      if (document.readyState === 'complete') {
        registerWorker();
      } else {
        window.addEventListener('load', registerWorker, { once: true });
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-40 inline-flex items-center gap-2 rounded-full bg-gray-900/95 text-white px-3.5 py-2 text-xs font-extrabold shadow-lg border border-amber-300/30"
    >
      <WifiOff className="w-3.5 h-3.5 text-glovo-yellow shrink-0" />
      <span>Offline Mode • All 36 Meals Ready</span>
    </div>
  );
}