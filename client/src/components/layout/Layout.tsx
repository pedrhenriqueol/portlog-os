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
  UserCheck
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
    { to: '/work-orders', label: 'Ordens de Serviço', icon: Wrench },
    { to: '/assets', label: 'Frotas & Equipamentos', icon: Layers },
    { to: '/audit', label: 'Auditoria & QA', icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen flex bg-port-darker text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-port-dark border-r border-port-border/80 flex flex-col justify-between p-4 shrink-0">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-port-border/50">
            <div className="w-10 h-10 rounded-xl bg-port-accent/20 border border-port-accent/40 flex items-center justify-center text-port-accent shadow-md">
              <Ship className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-white tracking-wide text-base leading-tight">PortLog <span className="text-port-accent font-mono text-xs">OS</span></h2>
              <span className="text-[11px] text-gray-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-port-emerald inline-block" />
                Live Berço
              </span>
            </div>
          </div>

          {/* Terminal Context Badge */}
          <div className="mx-2 mb-6 px-3 py-2 rounded-xl bg-port-card/60 border border-port-border/60 text-xs text-gray-400">
            <div className="flex items-center gap-1.5 text-gray-300 font-medium mb-0.5 truncate">
              <Building2 className="w-3.5 h-3.5 text-port-accent shrink-0" />
              <span className="truncate">{user?.tenant.name}</span>
            </div>
            <span className="text-[10px] text-gray-500 font-mono block">slug: {user?.tenant.slug}</span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-port-accent text-white shadow-lg shadow-port-accent/20'
                        : 'text-gray-400 hover:text-white hover:bg-port-card/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="pt-4 border-t border-port-border/50">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-port-border/80 flex items-center justify-center text-xs font-bold text-port-accent">
              {user?.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-400 font-mono truncate">{user?.role}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-port-rose/80 hover:text-port-rose hover:bg-port-rose/10 transition-all border border-port-rose/20"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 border-b border-port-border/80 bg-port-dark/40 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Terminal:</span>
            <span className="font-semibold text-white bg-port-card px-2 py-1 rounded-md border border-port-border/60">
              {user?.tenant.name}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-gray-400 font-mono">
              <Clock className="w-4 h-4 text-port-accent" />
              <span>SLA Engine Ativo</span>
            </div>
            <div className="h-4 w-[1px] bg-port-border" />
            <div className="flex items-center gap-1 text-port-emerald font-medium">
              <UserCheck className="w-4 h-4" />
              <span>{user?.role.replace('_', ' ')}</span>
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
