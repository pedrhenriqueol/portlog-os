import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { WorkOrder } from '../types';
import { 
  Wrench, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  User, 
  ChevronRight,
  Filter
} from 'lucide-react';

export const WorkOrders: React.FC = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState<string>('ALL');

  useEffect(() => {
    async function loadWorkOrders() {
      try {
        const response = await api.get('/work-orders');
        setWorkOrders(response.data.workOrders);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadWorkOrders();
  }, []);

  const columns = [
    { id: 'ABERTA', label: 'Abertas / Triagem', color: 'border-blue-500/40 bg-blue-500/5 text-blue-400' },
    { id: 'EM_EXECUCAO', label: 'Em Execução Técnica', color: 'border-port-amber/40 bg-port-amber/5 text-port-amber' },
    { id: 'AGUARDANDO_PECA', label: 'Aguardando Peça / Estoque', color: 'border-purple-500/40 bg-purple-500/5 text-purple-400' },
    { id: 'CONCLUIDA', label: 'Concluídas & Aprovadas QA', color: 'border-port-emerald/40 bg-port-emerald/5 text-port-emerald' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Ordens de Serviço de Manutenção</h1>
          <p className="text-sm text-gray-400 mt-0.5">Fluxo de triagem, execução em campo e validação de qualidade.</p>
        </div>

        <div className="flex items-center gap-3">
          <button className="py-2.5 px-4 bg-port-accent hover:bg-port-accentHover text-white font-medium rounded-xl transition-all shadow-lg shadow-port-accent/20 flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            <span>Abrir Nova OS</span>
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
        {columns.map((col) => {
          const ordersInCol = workOrders.filter(wo => {
            if (col.id === 'ABERTA') return ['ABERTA', 'EM_TRIAGEM', 'APROVADA'].includes(wo.status);
            return wo.status === col.id;
          });

          return (
            <div key={col.id} className="bg-port-card/40 border border-port-border/70 rounded-2xl p-4 flex flex-col min-h-[600px]">
              
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-port-border/50 mb-3">
                <span className="text-xs font-bold text-gray-300 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.color.split(' ')[2]}`} />
                  {col.label}
                </span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-port-dark/80 text-gray-400 border border-port-border/40">
                  {ordersInCol.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {ordersInCol.length === 0 ? (
                  <div className="h-32 border border-dashed border-port-border/50 rounded-xl flex items-center justify-center text-xs text-gray-500">
                    Nenhuma OS nesta etapa
                  </div>
                ) : (
                  ordersInCol.map((wo) => (
                    <div 
                      key={wo.id}
                      className="p-4 rounded-xl bg-port-card border border-port-border/80 hover:border-port-accent/50 transition-all shadow-md group cursor-pointer"
                    >
                      {/* Priority and Order Number */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-mono text-port-accent font-bold">
                          #{wo.orderNumber}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          wo.priority === 'EMERGENCIAL_BERCO'
                            ? 'bg-port-rose/20 text-port-rose border border-port-rose/40'
                            : wo.priority === 'ALTA'
                            ? 'bg-port-amber/20 text-port-amber border border-port-amber/40'
                            : 'bg-gray-800 text-gray-400 border border-gray-700'
                        }`}>
                          {wo.priority.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="text-sm font-semibold text-white leading-snug mb-1 group-hover:text-port-accent transition-colors">
                        {wo.title}
                      </h4>

                      {/* Asset Details */}
                      <p className="text-xs text-gray-400 font-mono mb-3">
                        {wo.asset.code} • {wo.asset.locationBerth || 'Pátio Geral'}
                      </p>

                      {/* Footer Info */}
                      <div className="pt-3 border-t border-port-border/40 flex items-center justify-between text-[11px] text-gray-500 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-port-accent" />
                          SLA: {new Date(wo.slaDeadline).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="flex items-center gap-1 text-gray-400">
                          <User className="w-3 h-3" />
                          {wo.assignedTo ? wo.assignedTo.name.split(' ')[0] : 'Não atribuído'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
