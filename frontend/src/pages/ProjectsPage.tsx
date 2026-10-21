import React, { useEffect, useState } from 'react';
import { FolderKanban, Plus, Search, Users, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { asList, endpoints, get, post, Project } from '../lib/api';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    get<unknown>(endpoints.projects)
      .then((data) => setProjects(asList<Project>(data)))
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = projects.filter((p) =>
    `${p.name} ${p.description || ''}`.toLowerCase().includes(query.toLowerCase())
  );

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await post(endpoints.projects, form);
      setOpen(false);
      setForm({ name: '', description: '' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create project');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Page header */}
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Portfolio</p>
          <h1 className="mt-2.5 text-[1.75rem] font-semibold tracking-tight text-slate-900">
            Projects
          </h1>
          <p className="mt-2 text-[15px] text-slate-500">
            The spaces where your team turns intent into delivery.
          </p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary">
          <Plus size={16} /> Create project
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Search bar */}
      <div className="surface flex items-center gap-3 px-4 py-3">
        <Search size={17} className="text-slate-400" />
        <input
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          placeholder="Search projects…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Project grid */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((project) => (
          <Link
            to={`/projects/${project.id}`}
            key={project.id}
            className="surface group p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-surface-hover"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <FolderKanban size={20} />
              </div>
              <span className="badge bg-emerald-50 text-emerald-700">Active</span>
            </div>
            <h2 className="mt-6 text-lg font-semibold text-slate-900">{project.name}</h2>
            <p className="mt-2 min-h-[3rem] text-sm leading-relaxed text-slate-500">
              {project.description || 'A focused space for project delivery.'}
            </p>
            <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-400">
              <Users size={14} />
              {project.team?.members?.length || project._count?.members || 0} team members
            </div>
          </Link>
        ))}
        {!filtered.length && (
          <div className="surface col-span-full p-14 text-center text-sm text-slate-500">
            No projects match your search.
          </div>
        )}
      </div>

      {/* Create project modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <form onSubmit={create} className="surface w-full max-w-lg p-7 shadow-modal">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">New workspace</p>
                <h2 className="mt-1.5 text-xl font-semibold">Create a project</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-7 space-y-5">
              <label className="block text-sm font-medium text-slate-700">
                Project name
                <input
                  className="input mt-1.5"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Campus Connect"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Description
                <textarea
                  className="input mt-1.5 min-h-28 resize-y"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What is this team building?"
                />
              </label>
            </div>
            <div className="mt-7 flex justify-end gap-3">
              <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button className="btn-primary" disabled={busy}>
                {busy ? 'Creating…' : 'Create project'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
