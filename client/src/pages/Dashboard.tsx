import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { DashboardMetrics, Asset } from '../types';
import { 
  Activity, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(() => {
    const cached = sessionStorage.getItem('portlog_cached_metrics');
    return cached ? JSON.parse(cached) : null;
  });
  const [assets, setAssets] = useState<Asset[]>(() => {
    const cached = sessionStorage.getItem('portlog_cached_assets');
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading] = useState(!metrics);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [metricsRes, assetsRes] = await Promise.all([
          api.get('/dashboard/metrics'),
          api.get('/assets')
        ]);
        setMetrics(metricsRes.data.metrics);
        setAssets(assetsRes.data.assets);
        sessionStorage.setItem('portlog_cached_metrics', JSON.stringify(metricsRes.data.metrics));
        sessionStorage.setItem('portlog_cached_assets', JSON.stringify(assetsRes.data.assets));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const chartData = [
    { name: 'Seg', disponibilidade: 94.2, mttr: 3.1 },
    { name: 'Ter', disponibilidade: 95.8, mttr: 2.8 },
    { name: 'Qua', disponibilidade: 92.5, mttr: 4.2 },
    { name: 'Qui', disponibilidade: 97.1, mttr: 2.1 },
    { name: 'Sex', disponibilidade: 98.4, mttr: 1.9 },
    { name: 'Sáb', disponibilidade: 99.0, mttr: 1.5 },
    { name: 'Dom', disponibilidade: 98.8, mttr: 1.8 },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 max-w-7xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Centro de Comando & Telemetria</h1>
            <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-port-emerald/10 border border-port-emerald/30 text-port-emerald">
              <span className="w-1.5 h-1.5 rounded-full bg-port-emerald animate-pulse" />
              Sincronizado Supabase
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">Supervisão em tempo real de disponibilidade de berço, frotas e cumprimento de SLA de manutenção.</p>
        </div>
      </motion.div>

      {/* KPI Cards Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Disponibilidade da Frota */}
        <div className="p-5 bg-port-card/70 hover:bg-port-card/90 border border-port-border/80 hover:border-port-emerald/50 rounded-2xl relative overflow-hidden transition-all duration-300 shadow-lg hover:shadow-port-emerald/5 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Disponibilidade Geral</span>
            <div className="w-9 h-9 rounded-xl bg-port-emerald/10 border border-port-emerald/30 flex items-center justify-center text-port-emerald group-hover:scale-110 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            {loading && !metrics ? (
              <div className="h-9 w-24 bg-port-border/60 animate-pulse rounded-lg" />
            ) : (
              <>
                <span className="text-3xl font-bold text-white tracking-tight">
                  {metrics?.availabilityRate || '0.0%'}
                </span>
                <span className="text-xs text-port-emerald flex items-center font-medium">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> +1.2%
                </span>
              </>
            )}
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-mono">
            {loading && !metrics ? (
              <span className="inline-block h-3 w-32 bg-port-border/40 animate-pulse rounded mt-1" />
            ) : (
              `${metrics?.operationalAssets || 0} de ${metrics?.totalAssets || 0} equipamentos ativos`
            )}
          </p>
        </div>

        {/* Ordens de Serviço Críticas */}
        <div className="p-5 bg-port-card/70 hover:bg-port-card/90 border border-port-border/80 hover:border-port-rose/50 rounded-2xl relative overflow-hidden transition-all duration-300 shadow-lg hover:shadow-port-rose/5 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Emergencial Berço</span>
            <div className="w-9 h-9 rounded-xl bg-port-rose/10 border border-port-rose/30 flex items-center justify-center text-port-rose group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            {loading && !metrics ? (
              <div className="h-9 w-16 bg-port-border/60 animate-pulse rounded-lg" />
            ) : (
              <>
                <span className="text-3xl font-bold text-port-rose tracking-tight">
                  {metrics?.criticalBerthWorkOrders || 0}
                </span>
                <span className="text-xs text-gray-400 font-mono">Risco Demurrage</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-mono">
            {loading && !metrics ? (
              <span className="inline-block h-3 w-36 bg-port-border/40 animate-pulse rounded mt-1" />
            ) : (
              'Paradas com impacto na atracação'
            )}
          </p>
        </div>

        {/* Tempo Médio de Reparo (MTTR) */}
        <div className="p-5 bg-port-card/70 hover:bg-port-card/90 border border-port-border/80 hover:border-port-accent/50 rounded-2xl relative overflow-hidden transition-all duration-300 shadow-lg hover:shadow-port-accent/5 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">MTTR Médio</span>
            <div className="w-9 h-9 rounded-xl bg-port-accent/10 border border-port-accent/30 flex items-center justify-center text-port-accent group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            {loading && !metrics ? (
              <div className="h-9 w-20 bg-port-border/60 animate-pulse rounded-lg" />
            ) : (
              <>
                <span className="text-3xl font-bold text-white tracking-tight">
                  {metrics?.mttrHours || '0.0h'}
                </span>
                <span className="text-xs text-port-emerald flex items-center font-medium">
                  Concluídas
                </span>
              </>
            )}
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-mono">
            {loading && !metrics ? (
              <span className="inline-block h-3 w-32 bg-port-border/40 animate-pulse rounded mt-1" />
            ) : (
              'Tempo médio de intervenção'
            )}
          </p>
        </div>

        {/* Cumprimento de SLA */}
        <div className="p-5 bg-port-card/70 hover:bg-port-card/90 border border-port-border/80 hover:border-port-amber/50 rounded-2xl relative overflow-hidden transition-all duration-300 shadow-lg hover:shadow-port-amber/5 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Estouros de SLA</span>
            <div className="w-9 h-9 rounded-xl bg-port-amber/10 border border-port-amber/30 flex items-center justify-center text-port-amber group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            {loading && !metrics ? (
              <div className="h-9 w-16 bg-port-border/60 animate-pulse rounded-lg" />
            ) : (
              <>
                <span className="text-3xl font-bold text-port-amber tracking-tight">
                  {metrics?.slaBreachedWorkOrders || 0}
                </span>
                <span className="text-xs text-gray-400 font-mono">de {metrics?.totalActiveWorkOrders || 0} ativas</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-mono">
            {loading && !metrics ? (
              <span className="inline-block h-3 w-36 bg-port-border/40 animate-pulse rounded mt-1" />
            ) : (
              'Controle de pontualidade técnica'
            )}
          </p>
        </div>

      </motion.div>

      {/* Main Charts & Live Feed Section */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Availability Telemetry Chart */}
        <div className="lg:col-span-2 p-6 bg-port-card/50 border border-port-border/80 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-white text-base">Disponibilidade Operacional vs MTTR (7 Dias)</h3>
              <p className="text-xs text-gray-400">Rastreamento de taxa de uptime dos guindastes STS e frotas de pátio</p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-port-accent/10 border border-port-accent/30 text-port-accent flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Telemetry Stream
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorDisp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284C7" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#6B7280" fontSize={12} tickLine={false} />
                <YAxis stroke="#6B7280" fontSize={12} domain={[85, 100]} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="disponibilidade" stroke="#0284C7" strokeWidth={2} fillOpacity={1} fill="url(#colorDisp)" name="Disponibilidade %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Status of Real Assets from Supabase */}
        <div className="p-6 bg-port-card/50 border border-port-border/80 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-white text-base mb-1">Status de Frotas de Berço</h3>
            <p className="text-xs text-gray-400 mb-4">Equipamentos cadastrados no terminal</p>

            <div className="space-y-3">
              {loading && assets.length === 0 ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-3 rounded-xl bg-port-dark/40 border border-port-border/40 flex items-center justify-between animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-7 bg-port-border/60 rounded-lg" />
                        <div className="space-y-1">
                          <div className="w-24 h-3 bg-port-border/60 rounded" />
                          <div className="w-16 h-2 bg-port-border/40 rounded" />
                        </div>
                      </div>
                      <div className="w-14 h-5 bg-port-border/60 rounded" />
                    </div>
                  ))}
                </div>
              ) : assets.length === 0 ? (
                <p className="text-xs text-gray-500 italic p-4 text-center">Nenhum equipamento cadastrado ainda.</p>
              ) : (
                assets.slice(0, 4).map((item) => (
                  <div key={item.id} className="p-3 rounded-xl bg-port-dark/60 border border-port-border/50 hover:border-port-accent/40 transition-all flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="px-2.5 py-1.5 rounded-lg bg-port-card border border-port-border/80 flex items-center justify-center text-xs font-mono font-bold text-port-accent shrink-0 min-w-[56px] text-center">
                        {item.code}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-white truncate">{item.name}</p>
                        <span className="text-[10px] text-gray-400 font-mono block truncate">{item.locationBerth || 'Pátio Principal'}</span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border shrink-0 ${
                      item.status === 'OPERACIONAL'
                        ? 'bg-port-emerald/10 border-port-emerald/30 text-port-emerald'
                        : 'bg-port-amber/10 border-port-amber/30 text-port-amber'
                    }`}>
                      {item.status === 'OPERACIONAL' ? 'ONLINE' : 'MANUT'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <Link 
            to="/assets"
            className="w-full mt-4 py-2.5 px-3 bg-port-card hover:bg-port-accent/10 border border-port-border hover:border-port-accent/40 text-xs font-medium text-gray-300 hover:text-white rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Ver Inventário Completo</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </motion.div>
    </motion.div>
  );
};
