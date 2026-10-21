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
      {/* Mobile overlay */}
      {mobile && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMobile(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[17rem] flex-col border-r border-slate-200/80 bg-white transition-all duration-200 ${
          mobile ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${collapsed ? 'lg:w-[4.5rem]' : ''}`}
      >
        {/* Logo */}
        <div className="flex h-[4.25rem] items-center justify-between border-b border-slate-100 px-5">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-3 font-bold text-slate-900"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <PanelLeftOpen size={17} />
            </div>
            {!collapsed && <span className="text-[15px]">CapstoneHub</span>}
          </button>
          <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden" onClick={() => setMobile(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMobile(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100/50'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`
              }
            >
              <link.icon size={17} strokeWidth={2} />
              {!collapsed && link.label}
            </NavLink>
          ))}

          {/* Workflow card */}
          {!collapsed && (
            <div className="mt-8 rounded-2xl bg-[#17213a] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300">Workflow</p>
              <p className="mt-2.5 text-[13px] leading-relaxed text-slate-300">
                Connect planning decisions to the evidence that matters.
              </p>
            </div>
          )}
        </nav>

        {/* Sign out */}
        <div className="border-t border-slate-100 px-3 py-3">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
          >
            <LogOut size={17} />
            {!collapsed && 'Sign out'}
          </button>
        </div>
      </aside>

      <div className={`transition-all duration-200 ${collapsed ? 'lg:pl-[4.5rem]' : 'lg:pl-[17rem]'}`}>
        {/* Top header bar */}
        <header className="sticky top-0 z-30 flex h-[4.25rem] items-center justify-between border-b border-slate-200/60 bg-[#f7f8fc]/80 px-5 backdrop-blur-lg sm:px-8">
          <div className="flex items-center gap-3">
            <button className="rounded-lg p-2 text-slate-500 hover:bg-white lg:hidden" onClick={() => setMobile(true)}>
              <Menu size={20} />
            </button>
            <button
              className="hidden rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-slate-600 lg:block"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
            <span className="hidden text-[13px] text-slate-400 sm:inline">
              Academic delivery workspace
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <button
              onClick={() => navigate('/notifications')}
              className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-white hover:text-slate-700"
            >
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {/* User Profile Pill & Dropdown Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2.5 rounded-xl border border-transparent p-1.5 pl-2.5 transition-all hover:border-slate-200 hover:bg-white/80 focus:outline-none"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-[13px] font-bold text-indigo-700">
                  {initials(user?.name)}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-[13px] font-semibold leading-tight text-slate-800">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-[11px] capitalize text-slate-400">
                    {user?.role?.toLowerCase().replace(/_/g, ' ') || 'student'}
                  </p>
                </div>
                <ChevronDown
                  size={14}
                  className={`hidden text-slate-400 transition-transform duration-200 sm:block ${
                    userMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-modal z-50 animate-toast-in">
                  <div className="border-b border-slate-100 px-3 py-3">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email || ''}</p>
                    <span className="mt-2.5 inline-flex items-center rounded-lg bg-indigo-50 px-2 py-0.5 text-[11px] font-medium capitalize text-indigo-700">
                      {user?.role?.toLowerCase().replace(/_/g, ' ') || 'student'}
                    </span>
                  </div>
                  <div className="pt-1.5">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                    >
                      <LogOut size={15} /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
