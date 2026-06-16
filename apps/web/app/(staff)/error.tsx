'use client';

import { useEffect } from 'react';
import { logSystemAlert } from './actions/monitoring';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Staff Area Error:', error);
    logSystemAlert('ERROR', 'WEB', error.message, { stack: error.stack, digest: error.digest }).catch(console.error);
  }, [error]);

  return (
    <div className="flex h-[80vh] w-full items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 shadow-lg rounded-xl p-6 text-center border border-zinc-200 dark:border-zinc-800">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong!</h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          An error occurred in the staff portal. Our technical team has been notified.
        </p>
        <button
          onClick={() => reset()}
          className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-md font-medium hover:opacity-90 transition-opacity"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
