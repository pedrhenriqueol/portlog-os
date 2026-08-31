import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { DashboardMetrics, Asset } from '../types';
import { 
  Activity, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [metricsRes, assetsRes] = await Promise.all([
          api.get('/dashboard/metrics'),
          api.get('/assets')
        ]);
        setMetrics(metricsRes.data.metrics);
        setAssets(assetsRes.data.assets);
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

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Centro de Comando & Telemetria Portuária</h1>
        <p className="text-sm text-gray-400 mt-1">Supervisão em tempo real de disponibilidade de berço, frotas e cumprimento de SLA de manutenção.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Disponibilidade da Frota */}
        <div className="p-5 bg-port-card/70 border border-port-border/80 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Disponibilidade Geral</span>
            <div className="w-8 h-8 rounded-lg bg-port-emerald/10 border border-port-emerald/30 flex items-center justify-center text-port-emerald">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tracking-tight">
              {metrics ? metrics.availabilityRate : '100%'}
            </span>
            <span className="text-xs text-port-emerald flex items-center font-medium">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +1.2%
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-mono">
            {metrics?.operationalAssets || 0} de {metrics?.totalAssets || 0} equipamentos ativos
          </p>
        </div>

        {/* Ordens de Serviço Críticas */}
        <div className="p-5 bg-port-card/70 border border-port-border/80 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Emergencial Berço</span>
            <div className="w-8 h-8 rounded-lg bg-port-rose/10 border border-port-rose/30 flex items-center justify-center text-port-rose">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-port-rose tracking-tight">
              {metrics ? metrics.criticalBerthWorkOrders : 0}
            </span>
            <span className="text-xs text-gray-400 font-mono">Risco Demurrage</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-mono">Paradas com impacto direto na atracação</p>
        </div>

        {/* Tempo Médio de Reparo (MTTR) */}
        <div className="p-5 bg-port-card/70 border border-port-border/80 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">MTTR Médio</span>
            <div className="w-8 h-8 rounded-lg bg-port-accent/10 border border-port-accent/30 flex items-center justify-center text-port-accent">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tracking-tight">
              {metrics ? metrics.mttrHours : '0.0h'}
            </span>
            <span className="text-xs text-port-emerald flex items-center font-medium">
              Concluídas no mês
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-mono">Tempo médio de reparo</p>
        </div>

        {/* Cumprimento de SLA */}
        <div className="p-5 bg-port-card/70 border border-port-border/80 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Estouros de SLA</span>
            <div className="w-8 h-8 rounded-lg bg-port-amber/10 border border-port-amber/30 flex items-center justify-center text-port-amber">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-port-amber tracking-tight">
              {metrics ? metrics.slaBreachedWorkOrders : 0}
            </span>
            <span className="text-xs text-gray-400 font-mono">de {metrics?.totalActiveWorkOrders || 0} ativas</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-mono">Controle de pontualidade técnica</p>
        </div>

      </div>

      {/* Main Charts & Live Feed Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Availability Telemetry Chart */}
        <div className="lg:col-span-2 p-6 bg-port-card/50 border border-port-border/80 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-white text-base">Disponibilidade Operacional vs MTTR (7 Dias)</h3>
              <p className="text-xs text-gray-400">Rastreamento de taxa de uptime dos guindastes STS e frotas de pátio</p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-port-accent/10 border border-port-accent/30 text-port-accent">
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
            <p className="text-xs text-gray-400 mb-4">Equipamentos cadastrados no Supabase</p>

            <div className="space-y-3">
              {assets.slice(0, 4).map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-port-dark/60 border border-port-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-port-card flex items-center justify-center text-xs font-mono font-bold text-port-accent">
                      {item.code}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white truncate max-w-[140px]">{item.name}</p>
                      <span className="text-[10px] text-gray-400 font-mono">{item.locationBerth || 'Pátio'}</span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                    item.status === 'OPERACIONAL'
                      ? 'bg-port-emerald/10 border-port-emerald/30 text-port-emerald'
                      : 'bg-port-amber/10 border-port-amber/30 text-port-amber'
                  }`}>
                    {item.status === 'OPERACIONAL' ? 'ONLINE' : 'MANUT'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Link 
            to="/assets"
            className="w-full mt-4 py-2.5 px-3 bg-port-card hover:bg-port-border/40 border border-port-border text-xs font-medium text-gray-300 rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            <span>Ver Inventário Completo</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </div>
  );
};
