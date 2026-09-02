import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Ship, 
  LayoutDashboard, 
  Wrench, 
  Layers, 
  ShieldAlert, 
  LogOut, 
  Building2,
  Clock,
  UserCheck,
  Radio,
  Users
} from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Dashboard & SLA', icon: LayoutDashboard },
    { to: '/telemetry', label: 'Telemetria IoT', icon: Radio },
    { to: '/work-orders', label: 'Ordens de Serviço', icon: Wrench },
    { to: '/assets', label: 'Frotas & Equipamentos', icon: Layers },
    { to: '/team', label: 'Equipe Técnica', icon: Users },
    { to: '/audit', label: 'Auditoria & QA', icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen flex bg-port-darker text-slate-100 selection:bg-port-cobalt/30 selection:text-blue-200">
      {/* Sidebar Industrial */}
      <aside className="w-64 bg-port-dark border-r border-port-border flex flex-col justify-between p-4 shrink-0 shadow-xl">
        <div>
          {/* Logo & Terminal Identity */}
          <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-port-border/70">
            <div className="w-10 h-10 rounded-xl bg-port-cobalt/15 border border-port-cobalt/30 flex items-center justify-center text-port-cobalt shadow-sm">
              <Ship className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white tracking-wide text-base leading-tight">
                PortLog <span className="text-port-cobalt font-mono text-xs">OS</span>
              </h2>
              <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-port-emerald inline-block animate-pulse" />
                Live Berço
              </span>
            </div>
          </div>

          {/* Terminal Context Badge */}
          <div className="mx-1 mb-6 px-3 py-2.5 rounded-xl bg-port-card/80 border border-port-border text-xs text-slate-300">
            <div className="flex items-center gap-1.5 font-medium mb-1 truncate text-slate-200">
              <Building2 className="w-3.5 h-3.5 text-port-cobalt shrink-0" />
              <span className="truncate">{user?.tenant?.name || 'Terminal de Contêineres'}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono block">slug: {user?.tenant?.slug || 'berco-principal'}</span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                      isActive
                        ? 'bg-port-card text-white border border-slate-700/60 shadow-md font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Minimalist Active Route Indicator */}
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-port-cobalt rounded-r-md shadow-sm" />
                      )}
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-port-cobalt font-bold' : 'text-slate-400 group-hover:text-slate-300'}`} />
                      <span className="truncate">{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="pt-4 border-t border-port-border/70">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-port-card border border-port-border flex items-center justify-center text-xs font-bold text-port-cobalt shadow-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'Operador'}</p>
              <p className="text-[10px] text-slate-400 font-mono truncate">{user?.role || 'TECNICO'}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-port-rose/90 hover:text-port-rose hover:bg-port-rose/10 transition-all border border-port-rose/20 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 border-b border-port-border bg-port-dark/70 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20 print:hidden">
          <div className="flex items-center gap-2.5 text-xs text-slate-400">
            <span className="font-mono uppercase tracking-wider text-[11px] text-slate-400">Terminal Ativo:</span>
            <span className="font-semibold text-white bg-port-card px-2.5 py-1 rounded-lg border border-port-border font-mono text-xs">
              {user?.tenant?.name || 'Berço 01'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-slate-400 font-mono">
              <Clock className="w-4 h-4 text-port-amber" />
              <span>SLA Engine Operacional</span>
            </div>
            <div className="h-4 w-[1px] bg-port-border" />
            <div className="flex items-center gap-1.5 text-port-emerald font-medium font-mono text-[11px]">
              <UserCheck className="w-4 h-4" />
              <span>{user?.role ? user.role.replace(/_/g, ' ') : 'OPERADOR'}</span>
            </div>
          </div>
        </header>

        <div className="p-8 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
