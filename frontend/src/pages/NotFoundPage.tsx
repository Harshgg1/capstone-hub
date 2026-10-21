import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">Page Not Found</h2>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-500">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="btn-primary mt-8"
      >
        Back to Dashboard
      </Link>
    </div>
  );
};
