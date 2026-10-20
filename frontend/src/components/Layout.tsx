import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  X,
} from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { endpoints, get, initials } from '../lib/api';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobile, setMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [unread, setUnread] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const faculty = user?.role === 'FACULTY';
  const links = faculty
    ? [{ to: '/faculty/dashboard', label: 'Faculty overview', icon: ShieldCheck }]
    : [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/projects', label: 'Projects', icon: PanelLeftOpen },
      ];

  const activeProject = location.pathname.match(/\/projects\/([^/]+)/)?.[1];
  if (activeProject && !links.some((l) => location.pathname.startsWith(l.to))) {
    links.push({
      to: `/projects/${activeProject}`,
      label: 'Current project',
      icon: PanelLeftOpen,
    });
  }

  const refreshUnread = () => {
    get<unknown>(endpoints.unread)
      .then((result) =>
        setUnread(
          typeof result === 'number'
            ? result
            : Number((result as { count?: number })?.count || 0)
        )
      )
      .catch(() => setUnread(0));
  };

  useEffect(() => {
    refreshUnread();
    window.addEventListener('capstonehub:notifications-changed', refreshUnread);
    return () => window.removeEventListener('capstonehub:notifications-changed', refreshUnread);
  }, [location.pathname]);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [userMenuOpen]);

  const handleSignOut = () => {
    setUserMenuOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform ${
          mobile ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${collapsed ? 'lg:w-20' : ''}`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-5">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-3 font-bold"
          >
            <div className="rounded-xl bg-indigo-600 p-2 text-white">
              <PanelLeftOpen size={18} />
            </div>
            {!collapsed && <span>CapstoneHub</span>}
          </button>
          <button className="lg:hidden" onClick={() => setMobile(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMobile(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <link.icon size={18} />
              {!collapsed && link.label}
            </NavLink>
          ))}
          {!collapsed && (
            <div className="mt-8 rounded-2xl bg-[#17213a] p-4 text-white">
              <p className="text-xs font-semibold text-indigo-300">WORKFLOW</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Connect planning decisions to the evidence that matters.
              </p>
            </div>
          )}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          >
            <LogOut size={18} />
            {!collapsed && 'Sign out'}
          </button>
        </div>
      </aside>

      <div className={`${collapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/80 bg-[#f7f8fc]/90 px-5 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setMobile(true)}>
              <Menu size={22} />
            </button>
            <button
              className="hidden rounded-lg p-2 text-slate-400 hover:bg-white lg:block"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
            </button>
            <span className="hidden text-sm text-slate-400 sm:inline">
              Academic delivery workspace
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/notifications')}
              className="relative rounded-xl p-2 text-slate-500 hover:bg-white"
            >
              <Bell size={19} />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-indigo-600 px-1 text-center text-[10px] font-bold text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {/* User Profile Pill & Dropdown Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-3 rounded-xl border border-transparent p-1.5 pl-3 transition hover:border-slate-200 hover:bg-white/80 focus:outline-none"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                  {initials(user?.name)}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-semibold text-slate-800 leading-tight">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs capitalize text-slate-400">
                    {user?.role?.toLowerCase().replace(/_/g, ' ') || 'student'}
                  </p>
                </div>
                <ChevronDown
                  size={15}
                  className={`hidden text-slate-400 sm:block transition-transform duration-200 ${
                    userMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="border-b border-slate-100 px-3 py-2.5">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email || ''}</p>
                    <span className="mt-2 inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-medium capitalize text-indigo-700">
                      {user?.role?.toLowerCase().replace(/_/g, ' ') || 'student'}
                    </span>
                  </div>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                    >
                      <LogOut size={16} /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] p-5 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
