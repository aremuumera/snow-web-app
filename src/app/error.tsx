'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Home, RefreshCw } from 'lucide-react';
import { app_config } from '@/utils/config';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="fixed inset-0 z-[9999] bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        <div className="text-6xl font-bold text-primary-500 mb-4">Oops!</div>
        <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
          Something went wrong
        </h2>
        <p className="text-text-secondary-light dark:text-text-secondary-dark mb-8 leading-relaxed">
          We hit an unexpected error. Please try again or head back home.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={reset}
            className="bg-primary-500 text-white px-6 py-3 rounded-full flex items-center gap-2 hover:bg-primary-600 active:scale-95 transition-all text-sm font-primary-bold cursor-pointer"
          >
            <RefreshCw size={16} className="animate-spin" style={{ animationDuration: '3s' }} />
            Try Again
          </button>
          <Link
            href="/"
            className="border border-border-light dark:border-border-dark text-text-primary-light dark:text-text-primary-dark px-6 py-3 rounded-full flex items-center gap-2 hover:bg-light-100 dark:hover:bg-dark-800 active:scale-95 transition-all text-sm font-primary-bold"
          >
            <Home size={16} />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
