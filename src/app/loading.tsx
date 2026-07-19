'use client';

import React from 'react';
import { LogoLoader } from '@/components/ui/LogoLoader';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] bg-background-light dark:bg-background-dark flex flex-col items-center justify-center gap-4">
      <LogoLoader size={60} />
      <span className="text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark animate-pulse select-none">
        Loading...
      </span>
    </div>
  );
}
