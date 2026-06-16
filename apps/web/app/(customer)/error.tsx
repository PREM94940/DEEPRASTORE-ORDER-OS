'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Customer Area Error:', error);
  }, [error]);

  return (
    <div className="flex h-[80vh] w-full items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 shadow-lg rounded-xl p-6 text-center border border-zinc-200 dark:border-zinc-800">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Oops! Something went wrong</h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          We encountered an unexpected error while processing your request. Please try again.
        </p>
        <button
          onClick={() => reset()}
          className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
