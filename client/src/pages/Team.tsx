import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { User, Role } from '../types';
import { Users, Plus, ShieldCheck, Mail, Clock, CheckCircle2, UserCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Team: React.FC = () => {
  const [team, setTeam] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('TECNICO_MANUTENCAO');
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');

  const loadTeam = async () => {
    try {
      setLoading(true);
      const response = await api.get('/team');
      setTeam(response.data.team);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');

    try {
      await api.post('/team', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role
      });
      setName('');
      setEmail('');
      setPassword('');
      setIsModalOpen(false);
      await loadTeam();
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar operador.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Equipe Técnica & Operadores</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gestão de mecânicos hidráulicos, supervisores de pátio e auditores de conformidade QA.</p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="py-2.5 px-4 bg-port-accent hover:bg-port-accentHover text-white font-medium rounded-xl transition-all shadow-lg shadow-port-accent/25 flex items-center gap-2 text-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Técnico / QA</span>
        </button>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {team.map((member) => (
          <motion.div
            key={member.id}
            whileHover={{ y: -3 }}
            className="p-5 rounded-2xl bg-port-card/70 border border-port-border/80 hover:border-port-accent/50 transition-all shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-port-accent/20 border border-port-accent/40 flex items-center justify-center font-bold text-port-accent text-sm">
                  {member.name.charAt(0)}
                </div>

                <span className={`text-[10px] font-mono font-semibold px-2.5 py-1 rounded-lg border ${
                  member.role === 'ADMIN_MASTER'
                    ? 'bg-port-accent/20 border-port-accent/40 text-port-accent'
                    : member.role === 'AUDITOR_QA'
                    ? 'bg-port-emerald/20 border-port-emerald/40 text-port-emerald'
                    : 'bg-gray-800 border-gray-700 text-gray-300'
                }`}>
                  {member.role.replace('_', ' ')}
                </span>
              </div>

              <h3 className="font-semibold text-white text-base leading-snug">{member.name}</h3>
              <p className="text-xs text-gray-400 font-mono flex items-center gap-1.5 mt-1">
                <Mail className="w-3 h-3" />
                {member.email}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-port-border/40 flex items-center justify-between text-xs text-gray-500 font-mono">
              <span>{member._count?.assignedWOs || 0} OS em atendimento</span>
              <span className="flex items-center gap-1 text-port-emerald">
                <span className="w-1.5 h-1.5 rounded-full bg-port-emerald inline-block" />
                Ativo
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal de Cadastro de Membro */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-port-card border border-port-border w-full max-w-md rounded-2xl p-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-port-border/60">
                <h3 className="font-bold text-white text-base">Novo Membro da Equipe</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mt-3 p-3 rounded-xl bg-port-rose/10 border border-port-rose/30 text-port-rose text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateMember} className="mt-4 space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-gray-300 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Andrade"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-port-darker border border-port-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-port-accent"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-300 mb-1">E-mail Corporativo *</label>
                  <input
                    type="email"
                    required
                    placeholder="carlos@terminal.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-port-darker border border-port-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-port-accent"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-300 mb-1">Função / Perfil Operacional *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full px-3 py-2 bg-port-darker border border-port-border rounded-xl text-white focus:outline-none focus:border-port-accent"
                  >
                    <option value="TECNICO_MANUTENCAO">Técnico de Manutenção / Eletromecânico</option>
                    <option value="SUPERVISOR_OPERACIONAL">Supervisor Operacional de Berço</option>
                    <option value="AUDITOR_QA">Auditor de Qualidade & Conformidade QA</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-300 mb-1">Senha Provisória *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-port-darker border border-port-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-port-accent"
                  />
                </div>

                <div className="pt-3 border-t border-port-border/60 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-2 rounded-xl text-gray-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-4 py-2 bg-port-accent hover:bg-port-accentHover text-white font-medium rounded-xl text-xs"
                  >
                    {formLoading ? 'Salvando...' : 'Cadastrar Membro'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
