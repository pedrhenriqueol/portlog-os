import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Ship, ShieldCheck, AlertCircle, ArrowRight, Lock, Mail, Building } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [tenantSlug, setTenantSlug] = useState('mucuripe-port');
  const [email, setEmail] = useState('admin@mucuripe.com');
  const [password, setPassword] = useState('pedrooliveira1227!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(tenantSlug, email, password);
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-port-darker via-port-dark to-[#0F172A] p-4 relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-port-accent/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-port-emerald/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-port-card/90 backdrop-blur-xl border border-port-border/80 rounded-2xl p-8 shadow-2xl relative z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-port-accent/20 border border-port-accent/40 flex items-center justify-center text-port-accent mb-3 shadow-lg shadow-port-accent/10">
            <Ship className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            PortLog <span className="text-port-accent font-mono text-sm px-2 py-0.5 rounded bg-port-accent/10 border border-port-accent/30">OS</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">Gestão de Ordens de Serviço & Frotas Portuárias</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-port-rose/10 border border-port-rose/30 flex items-center gap-3 text-port-rose text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Terminal Portuário (Slug)
            </label>
            <div className="relative">
              <Building className="w-5 h-5 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={tenantSlug}
                onChange={(e) => setTenantSlug(e.target.value)}
                placeholder="ex: mucuripe-port"
                className="w-full pl-11 pr-4 py-2.5 bg-port-darker/80 border border-port-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-port-accent focus:ring-1 focus:ring-port-accent transition-all text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              E-mail Corporativo
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operador@terminal.com"
                className="w-full pl-11 pr-4 py-2.5 bg-port-darker/80 border border-port-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-port-accent focus:ring-1 focus:ring-port-accent transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Senha de Acesso
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-2.5 bg-port-darker/80 border border-port-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-port-accent focus:ring-1 focus:ring-port-accent transition-all text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-port-accent hover:bg-port-accentHover text-white font-medium rounded-xl transition-all shadow-lg shadow-port-accent/25 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>Autenticando...</span>
            ) : (
              <>
                <span>Acessar Painel Operacional</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-port-border/50 flex items-center justify-center gap-2 text-xs text-gray-500">
          <ShieldCheck className="w-4 h-4 text-port-emerald" />
          <span>Sessão protegida por HttpOnly Cookies & Zero-Trust RBAC</span>
        </div>
      </div>
    </div>
  );
};
