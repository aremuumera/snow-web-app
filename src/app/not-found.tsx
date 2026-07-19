'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';
import { app_config } from '@/utils/config';

export default function NotFound() {
  return (
    <div className="fixed inset-0 z-[9999] bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        <div className="text-7xl font-bold text-primary-500 mb-4">404</div>
        <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
          Page Not Found
        </h2>
        <p className="text-text-secondary-light dark:text-text-secondary-dark mb-8 leading-relaxed">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="flex justify-center">
          <Link
            href="/"
            className="bg-primary-500 text-white px-6 py-3 rounded-full flex items-center gap-2 hover:bg-primary-600 active:scale-95 transition-all text-sm font-primary-bold"
          >
            <Home size={16} />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
