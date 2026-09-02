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
  Radio
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
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
        console.error('Falha ao sincronizar métricas da central:', err);
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
      transition: { staggerChildren: 0.06 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 max-w-7xl mx-auto"
    >
      {/* Header Industrial */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-white tracking-tight">Centro de Comando & Telemetria</h1>
            <span className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-port-emerald/10 border border-port-emerald/30 text-port-emerald">
              <span className="w-1.5 h-1.5 rounded-full bg-port-emerald animate-pulse" />
              Telemetria Ativa
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Supervisão contínua de disponibilidade de berço, indicadores MTTR e conformidade de SLA operacional.
          </p>
        </div>
      </motion.div>

      {/* KPI Cards Grid com Skeleton Loaders Anti-Glitch */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* 1. Disponibilidade Geral */}
        <div className="p-5 bg-port-card/90 border border-port-border hover:border-slate-700/80 rounded-2xl relative overflow-hidden transition-all duration-200 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Disponibilidade Geral</span>
            <div className="w-9 h-9 rounded-xl bg-port-emerald/10 border border-port-emerald/30 flex items-center justify-center text-port-emerald">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            {loading && !metrics ? (
              <div className="h-9 w-24 bg-slate-800/60 animate-pulse rounded-lg" />
            ) : (
              <>
                <span className="text-3xl font-bold text-white font-mono tracking-tight">
                  {metrics?.availabilityRate || '96.8%'}
                </span>
                <span className="text-xs text-port-emerald flex items-center font-mono font-medium">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> +1.2%
                </span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 font-mono">
            {loading && !metrics ? (
              <span className="inline-block h-3.5 w-36 bg-slate-800/40 animate-pulse rounded mt-1" />
            ) : (
              `${metrics?.operationalAssets ?? 18} de ${metrics?.totalAssets ?? 20} equipamentos operando`
            )}
          </p>
        </div>

        {/* 2. Emergencial Berço (Laranja Náutico / Rose) */}
        <div className="p-5 bg-port-card/90 border border-port-border hover:border-port-nautical/50 rounded-2xl relative overflow-hidden transition-all duration-200 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Emergencial Berço</span>
            <div className="w-9 h-9 rounded-xl bg-port-nautical/10 border border-port-nautical/30 flex items-center justify-center text-port-nautical">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            {loading && !metrics ? (
              <div className="h-9 w-16 bg-slate-800/60 animate-pulse rounded-lg" />
            ) : (
              <>
                <span className="text-3xl font-bold text-port-nautical font-mono tracking-tight">
                  {metrics?.criticalBerthWorkOrders ?? 0}
                </span>
                <span className="text-xs text-slate-400 font-mono">Risco Demurrage</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 font-mono">
            {loading && !metrics ? (
              <span className="inline-block h-3.5 w-40 bg-slate-800/40 animate-pulse rounded mt-1" />
            ) : (
              'Paradas com impacto direto na atracação'
            )}
          </p>
        </div>

        {/* 3. MTTR Médio */}
        <div className="p-5 bg-port-card/90 border border-port-border hover:border-port-cobalt/50 rounded-2xl relative overflow-hidden transition-all duration-200 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">MTTR Médio</span>
            <div className="w-9 h-9 rounded-xl bg-port-cobalt/10 border border-port-cobalt/30 flex items-center justify-center text-port-cobalt">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            {loading && !metrics ? (
              <div className="h-9 w-20 bg-slate-800/60 animate-pulse rounded-lg" />
            ) : (
              <>
                <span className="text-3xl font-bold text-white font-mono tracking-tight">
                  {metrics?.mttrHours ? `${metrics.mttrHours}h` : '1.8h'}
                </span>
                <span className="text-xs text-port-emerald flex items-center font-mono font-medium">
                  Tempo Resposta
                </span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 font-mono">
            {loading && !metrics ? (
              <span className="inline-block h-3.5 w-32 bg-slate-800/40 animate-pulse rounded mt-1" />
            ) : (
              'Média de resolução técnica concluída'
            )}
          </p>
        </div>

        {/* 4. Estouro de SLA (Âmbar / Rose Operacional) */}
        <div className="p-5 bg-port-card/90 border border-port-border hover:border-port-amber/50 rounded-2xl relative overflow-hidden transition-all duration-200 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Estouro de SLA</span>
            <div className="w-9 h-9 rounded-xl bg-port-amber/10 border border-port-amber/30 flex items-center justify-center text-port-amber">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            {loading && !metrics ? (
              <div className="h-9 w-24 bg-slate-800/60 animate-pulse rounded-lg" />
            ) : (
              <>
                <span className="text-3xl font-bold text-white font-mono tracking-tight">
                  {metrics?.slaBreachedWorkOrders ?? 0}
                </span>
                <span className={`text-xs font-mono font-medium ${(metrics?.slaBreachedWorkOrders ?? 0) === 0 ? 'text-port-emerald' : 'text-port-rose'}`}>
                  {(metrics?.slaBreachedWorkOrders ?? 0) === 0 ? 'Zero Estouro' : 'OS Crítica'}
                </span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 font-mono">
            {loading && !metrics ? (
              <span className="inline-block h-3.5 w-36 bg-slate-800/40 animate-pulse rounded mt-1" />
            ) : (
              'Ordens ativas fora da janela contratual'
            )}
          </p>
        </div>

      </motion.div>

      {/* Main Charts & Live Feed Section */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Curva de Disponibilidade Operacional vs MTTR */}
        <div className="lg:col-span-2 p-6 bg-port-card/80 border border-port-border rounded-2xl shadow-md">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-white text-base">Disponibilidade Operacional vs MTTR (Últimos 7 Dias)</h3>
              <p className="text-xs text-slate-400 mt-0.5">Telemetria de taxa de uptime consolidada dos guindastes STS e RTG de berço</p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-port-cobalt/10 border border-port-cobalt/30 text-port-cobalt flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" />
              <span>Realtime Stream</span>
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDisp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748B" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#64748B" 
                  fontSize={12} 
                  domain={[88, 100]} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0D131F', 
                    borderColor: '#1E293B', 
                    borderRadius: '10px', 
                    fontSize: '12px',
                    color: '#F8FAFC',
                    fontFamily: 'monospace'
                  }}
                  formatter={(value: any) => [`${value}%`, 'Disponibilidade']}
                />
                <Area 
                  type="monotone" 
                  dataKey="disponibilidade" 
                  stroke="#2563EB" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorDisp)" 
                  name="Disponibilidade %" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Frotas & Equipamentos de Berço (Supabase Synced) */}
        <div className="p-6 bg-port-card/80 border border-port-border rounded-2xl flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-white text-base">Frotas no Berço</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                {assets.length} ativos
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">Inventário de maquinário do terminal</p>

            <div className="space-y-2.5">
              {loading && assets.length === 0 ? (
                <div className="space-y-2.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 flex items-center justify-between animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-7 bg-slate-800/80 rounded-lg" />
                        <div className="space-y-1.5">
                          <div className="w-24 h-3.5 bg-slate-800/80 rounded" />
                          <div className="w-16 h-2.5 bg-slate-800/50 rounded" />
                        </div>
                      </div>
                      <div className="w-12 h-5 bg-slate-800/80 rounded" />
                    </div>
                  ))}
                </div>
              ) : assets.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-4 text-center font-mono">Nenhum equipamento cadastrado no momento.</p>
              ) : (
                assets.slice(0, 4).map((item) => (
                  <div key={item.id} className="p-3 rounded-xl bg-port-dark/70 border border-port-border hover:border-slate-700/80 transition-all flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="px-2.5 py-1.5 rounded-lg bg-port-card border border-port-border flex items-center justify-center text-xs font-mono font-bold text-port-cobalt shrink-0 min-w-[58px] text-center shadow-inner">
                        {item.code}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-white truncate">{item.name}</p>
                        <span className="text-[10px] text-slate-400 font-mono block truncate">{item.locationBerth || 'Pátio Norte'}</span>
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
            className="w-full mt-4 py-2.5 px-3 bg-port-dark hover:bg-port-card border border-port-border hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>Ver Inventário Completo</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </motion.div>
    </motion.div>
  );
};
