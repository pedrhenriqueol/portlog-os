import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { maskCNPJ } from '../utils/masks';
import { 
  Ship, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight, 
  Lock, 
  Mail, 
  Building, 
  User, 
  FileText,
  CheckCircle2
} from 'lucide-react';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [tenantName, setTenantName] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleTenantNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTenantName(val);
    if (!tenantSlug || tenantSlug === generateSlug(tenantName)) {
      setTenantSlug(generateSlug(val));
    }
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCnpj(maskCNPJ(e.target.value));
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanCnpj = cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) {
      setError('Por favor, informe um CNPJ válido com 14 dígitos.');
      return;
    }

    if (password.length < 8) {
      setError('A senha deve conter no mínimo 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/register-tenant', {
        tenantName: tenantName.trim(),
        tenantSlug: tenantSlug.trim(),
        cnpj: cnpj.trim(),
        adminName: adminName.trim(),
        email: email.trim().toLowerCase(),
        password
      });

      setSuccess(true);

      setTimeout(async () => {
        await login(tenantSlug.trim(), email.trim().toLowerCase(), password);
        navigate('/', { replace: true });
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Erro ao registrar terminal portuário.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-port-darker via-port-dark to-[#0F172A] p-4 sm:p-6 relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-port-accent/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-port-emerald/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl bg-port-card/90 backdrop-blur-xl border border-port-border/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10 my-8">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-port-accent/20 border border-port-accent/40 flex items-center justify-center text-port-accent mb-2.5 shadow-md">
            <Ship className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            PortLog <span className="text-port-accent font-mono text-xs px-2 py-0.5 rounded bg-port-accent/10 border border-port-accent/30">Enterprise</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">Cadastro de Novo Terminal Portuário / ZPE & Administrador</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-port-rose/10 border border-port-rose/30 flex items-center gap-2.5 text-port-rose text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 p-3.5 rounded-xl bg-port-emerald/10 border border-port-emerald/30 flex items-center gap-2.5 text-port-emerald text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Terminal cadastrado com sucesso! Inicializando sessão operacional...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Seção 1: Dados do Terminal Portuário */}
          <div className="space-y-3 pb-3 border-b border-port-border/50">
            <span className="text-[11px] font-bold uppercase tracking-wider text-port-accent flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" />
              1. Dados do Terminal / Autoridade Portuária
            </span>

            <div>
              <label className="block font-semibold text-gray-300 mb-1">
                Nome da Empresa / Terminal *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Terminal Portuário de Santos S/A"
                value={tenantName}
                onChange={handleTenantNameChange}
                className="w-full px-3 py-2 bg-port-darker border border-port-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-port-accent"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-300 mb-1">
                  Identificador Único (Slug) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: santos-port"
                  value={tenantSlug}
                  onChange={(e) => setTenantSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="w-full px-3 py-2 bg-port-darker border border-port-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-port-accent font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">
                  CNPJ *
                </label>
                <div className="relative">
                  <FileText className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={18}
                    placeholder="00.000.000/0001-00"
                    value={cnpj}
                    onChange={handleCnpjChange}
                    className="w-full pl-8 pr-3 py-2 bg-port-darker border border-port-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-port-accent font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2: Dados do Usuário Master */}
          <div className="space-y-3 pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-port-emerald flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              2. Administrador Master (Superintendente)
            </span>

            <div>
              <label className="block font-semibold text-gray-300 mb-1">
                Nome Completo do Responsável *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Pedro Henrique Oliveira"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="w-full px-3 py-2 bg-port-darker border border-port-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-port-accent"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-300 mb-1">
                E-mail Corporativo de Acesso *
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="superintendente@terminal.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-port-darker border border-port-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-port-accent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-300 mb-1">
                  Senha * (mín. 8 chars)
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-port-darker border border-port-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-port-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">
                  Confirmar Senha *
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-port-darker border border-port-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-port-accent"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full mt-4 py-3 px-4 bg-port-accent hover:bg-port-accentHover text-white font-medium rounded-xl transition-all shadow-lg shadow-port-accent/25 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 text-sm"
          >
            {loading ? (
              <span>Provisionando Tenant no Supabase...</span>
            ) : (
              <>
                <span>Cadastrar Terminal & Acessar</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-gray-400">
          Já possui um terminal cadastrado?{' '}
          <Link to="/login" className="text-port-accent hover:underline font-medium">
            Fazer login
          </Link>
        </div>

        <div className="mt-6 pt-4 border-t border-port-border/50 flex items-center justify-center gap-2 text-[11px] text-gray-500">
          <ShieldCheck className="w-3.5 h-3.5 text-port-emerald" />
          <span>Isolamento Lógico de Tenant & Criptografia Bcrypt 12 Rounds</span>
        </div>
      </div>
    </div>
  );
};
