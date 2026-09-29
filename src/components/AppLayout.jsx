const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bug, LayoutDashboard, ScanSearch, Home, Settings as SettingsIcon, LogOut, ArrowLeft } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'New Scan', path: '/analyzer', icon: ScanSearch },
  { label: 'Settings', path: '/settings', icon: SettingsIcon },
  { label: 'Home', path: '/', icon: Home },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await db.auth.logout();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-sidebar-border bg-sidebar-background flex flex-col fixed inset-y-0 left-0 z-30 hidden md:flex">
        <div className="p-6 pb-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <Bug className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-lg text-foreground block leading-none">BugSweep</span>
              <span className="text-[10px] font-mono text-muted-foreground">v1.0 // stable</span>
            </div>
          </Link>
        </div>

        <div className="px-6 pb-2">
          <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest">// navigation</span>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-mono transition-all ${
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50'
                }`}
              >
                <Icon style={{ width: 18, height: 18 }} className="shrink-0" />
                <span className="flex items-center gap-1">
                  {active && <span className="text-accent">$</span>}
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut style={{ width: 18, height: 18 }} className="shrink-0" />
            <span className="font-mono">sign out</span>
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 h-14 border-b border-border bg-background/80 backdrop-blur-lg flex items-center px-4 justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Bug className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-foreground">BugSweep</span>
        </Link>
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`p-2 rounded-lg transition-all ${active ? 'bg-primary/15 text-primary' : 'text-muted-foreground'}`}
              >
                <Icon style={{ width: 18, height: 18 }} />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-0 min-h-screen">
        {location.pathname !== '/dashboard' && (
          <div className="sticky top-14 md:top-0 z-20 flex items-center px-6 h-14 border-b border-border bg-background/80 backdrop-blur-lg">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition font-mono"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>cd ~/dashboard</span>
            </button>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}