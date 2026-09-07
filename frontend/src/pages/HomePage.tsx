import React from 'react';
import { Users, FolderGit2, CheckCircle2 } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Welcome to CapstoneHub</h1>
        <p className="mt-2 text-gray-600">
          Academic software engineering lifecycle and project management platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-start space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Traceability</h3>
            <p className="mt-1 text-sm text-gray-500">
              Requirement &rarr; Story &rarr; Task &rarr; Sprint &rarr; Bug &rarr; PR
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-start space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Role Coordination</h3>
            <p className="mt-1 text-sm text-gray-500">
              Faculty Advisors, Team Leads, and Members working in unison.
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-start space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Foundation Ready</h3>
            <p className="mt-1 text-sm text-gray-500">
              React + TypeScript frontend wired to Express API and PostgreSQL.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
