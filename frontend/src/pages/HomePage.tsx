import React from 'react';
import { Users, FolderGit2, CheckCircle2 } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="surface p-8 sm:p-10">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome to CapstoneHub</h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-slate-500">
          Academic software engineering lifecycle and project management platform.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="surface flex items-start gap-5 p-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FolderGit2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Traceability</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
              Requirement &rarr; Story &rarr; Task &rarr; Sprint &rarr; Bug &rarr; PR
            </p>
          </div>
        </div>

        <div className="surface flex items-start gap-5 p-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Role Coordination</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
              Faculty Advisors, Team Leads, and Members working in unison.
            </p>
          </div>
        </div>

        <div className="surface flex items-start gap-5 p-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Foundation Ready</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
              React + TypeScript frontend wired to Express API and PostgreSQL.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
