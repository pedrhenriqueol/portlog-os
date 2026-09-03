import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { WorkOrder, Asset, WOStatus } from '../types';
import { 
  Wrench, 
  Plus, 
  Clock, 
  User, 
  CheckCircle2,
  AlertTriangle,
  Layers,
  Filter,
  Play,
  Pause,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { CreateWorkOrderModal } from '../components/CreateWorkOrderModal';
import { WorkOrderDetailModal } from '../components/WorkOrderDetailModal';
import { motion } from 'framer-motion';

export const WorkOrders: React.FC = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
  const [transitioningId, setTransitioningId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [woRes, assetsRes] = await Promise.all([
        api.get('/work-orders'),
        api.get('/assets')
      ]);
      setWorkOrders(woRes.data.workOrders);
      setAssets(assetsRes.data.assets);
    } catch (err) {
      console.error('Falha ao carregar ordens de serviço:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateWorkOrder = async (data: any) => {
    await api.post('/work-orders', data);
    await loadData();
  };

  // Movimentação de status com atualização otimista e ROLLBACK imediato em caso de erro
  const handleUpdateStatus = async (id: string, status: WOStatus, notes?: string) => {
    setTransitioningId(id);
    setErrorMessage(null);

    // Salva snapshot para rollback
    const previousOrders = [...workOrders];
    const previousSelected = selectedWO ? { ...selectedWO } : null;
    
    // Atualização otimista na UI
    setWorkOrders(prev => prev.map(wo => wo.id === id ? { ...wo, status } : wo));
    if (selectedWO && selectedWO.id === id) {
      setSelectedWO({ ...selectedWO, status });
    }

    try {
      await api.patch(`/work-orders/${id}/status`, { status, notes });
      await loadData();
    } catch (err: any) {
      // Rollback otimista instantâneo para o estado anterior
      setWorkOrders(previousOrders);
      if (previousSelected) setSelectedWO(previousSelected);
      setErrorMessage(err.response?.data?.message || err.message || 'Falha ao transicionar status da Ordem de Serviço.');
    } finally {
      setTransitioningId(null);
    }
  };

  const handleToggleChecklist = async (checklistId: string, completed: boolean) => {
    await api.patch(`/work-orders/checklists/${checklistId}`, { completed });
    await loadData();
    if (selectedWO && selectedWO.checklists) {
      setSelectedWO({
        ...selectedWO,
        checklists: selectedWO.checklists.map(c => 
          c.id === checklistId ? { ...c, completed, checkedAt: completed ? new Date().toISOString() : undefined } : c
        )
      });
    }
  };

  const columns = [
    { id: 'ABERTA', label: 'Triagem / Aberta', color: 'bg-blue-500' },
    { id: 'EM_EXECUCAO', label: 'Em Execução', color: 'bg-port-amber' },
    { id: 'AGUARDANDO_PECA', label: 'Aguardando Peça', color: 'bg-purple-500' },
    { id: 'CONCLUIDA', label: 'Concluídas / QA', color: 'bg-port-emerald' },
  ];

  // Helper para renderização padronizada de badges de prioridade (Urgente, Preventiva, Corretiva)
  const renderPriorityBadge = (priority: string, type: string) => {
    if (priority === 'EMERGENCIAL_BERCO' || type === 'CORRETIVA_URGENTE') {
      return (
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-port-nautical/15 text-port-nautical border border-port-nautical/40 flex items-center gap-1 shadow-sm">
          <AlertTriangle className="w-3 h-3" />
          Urgente
        </span>
      );
    }
    if (type === 'PREVENTIVA_PROGRAMADA') {
      return (
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-port-cobalt/15 text-blue-400 border border-port-cobalt/40 flex items-center gap-1 shadow-sm">
          <CheckCircle2 className="w-3 h-3" />
          Preventiva
        </span>
      );
    }
    return (
      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-port-amber/15 text-port-amber border border-port-amber/40 flex items-center gap-1 shadow-sm">
        <Wrench className="w-3 h-3" />
        Corretiva
      </span>
    );
  };

  // Helper para timer de SLA com destaque de estouro ou risco iminente
  const renderSlaStatus = (deadlineStr: string) => {
    if (!deadlineStr) return null;
    const deadline = new Date(deadlineStr);
    const now = new Date();
    const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 0) {
      const overdueHours = Math.abs(Math.round(diffHours));
      return (
        <span className="flex items-center gap-1 text-port-rose font-mono font-bold text-[10px] bg-port-rose/10 px-2 py-0.5 rounded border border-port-rose/30">
          <Clock className="w-3 h-3" />
          SLA Estourado (-{overdueHours}h)
        </span>
      );
    }

    if (diffHours <= 4) {
      const remainingHours = Math.max(1, Math.round(diffHours));
      return (
        <span className="flex items-center gap-1 text-port-amber font-mono font-bold text-[10px] bg-port-amber/10 px-2 py-0.5 rounded border border-port-amber/30">
          <Clock className="w-3 h-3" />
          SLA Crítico ({remainingHours}h rest.)
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1 text-slate-400 font-mono text-[10px]">
        <Clock className="w-3 h-3 text-slate-500" />
        SLA: {deadline.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
      </span>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Ordens de Serviço de Manutenção</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Fluxo Kanban interativo de triagem técnica, execução em berço e conformidade operacional.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsCreateModalOpen(true)}
            className="py-2.5 px-4 bg-port-cobalt hover:bg-port-cobaltHover text-white font-medium rounded-xl transition-all shadow-md flex items-center gap-2 text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Abrir Nova OS</span>
          </motion.button>
        </div>
      </div>

      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button 
            onClick={() => setErrorMessage(null)} 
            className="text-slate-400 hover:text-white text-xs cursor-pointer"
          >
            ✕
          </button>
        </motion.div>
      )}

      {/* Kanban Board Industrial Interativo (Zero Overflow Horizontal em todas as telas) */}
      <div className="overflow-x-auto pb-4 pt-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start min-w-[300px] lg:min-w-0">
        {columns.map((col) => {
          const ordersInCol = workOrders.filter(wo => {
            if (col.id === 'ABERTA') return ['ABERTA', 'EM_TRIAGEM', 'APROVADA'].includes(wo.status);
            if (col.id === 'CONCLUIDA') return ['CONCLUIDA', 'VALIDACAO_QA'].includes(wo.status);
            return wo.status === col.id;
          });

          return (
            <div key={col.id} className="bg-port-card/70 border border-port-border rounded-2xl p-4 flex flex-col min-h-[600px] shadow-sm">
              
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-port-border/80 mb-3">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.color}`} />
                  {col.label}
                </span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-port-dark text-slate-300 border border-port-border">
                  {ordersInCol.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                {ordersInCol.length === 0 ? (
                  <div className="h-36 border border-dashed border-slate-800/80 rounded-xl flex items-center justify-center text-xs text-slate-500 font-mono">
                    Sem ordens nesta fase
                  </div>
                ) : (
                  ordersInCol.map((wo) => {
                    const isTransitioning = transitioningId === wo.id;

                    return (
                      <motion.div 
                        key={wo.id}
                        whileHover={{ y: -2, transition: { duration: 0.15 } }}
                        onClick={() => setSelectedWO(wo)}
                        className={`p-4 rounded-xl bg-port-dark/90 border border-port-border hover:border-slate-700 transition-all shadow-sm group cursor-pointer relative ${
                          isTransitioning ? 'opacity-60 pointer-events-none' : ''
                        }`}
                      >
                        {/* Top Bar: Order Code & Priority Badge */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-mono text-port-cobalt font-bold">
                            #{wo.orderNumber}
                          </span>
                          {renderPriorityBadge(wo.priority, wo.type)}
                        </div>

                        {/* Title */}
                        <h4 className="text-sm font-semibold text-white leading-snug mb-1 group-hover:text-blue-400 transition-colors">
                          {wo.title}
                        </h4>

                        {/* Asset Details Monospaced */}
                        <p className="text-xs text-slate-400 font-mono mb-3">
                          <span className="text-slate-300 font-semibold">{wo.asset.code}</span> • {wo.asset.locationBerth || 'Pátio Geral'}
                        </p>

                        {/* Footer Info with SLA Timer */}
                        <div className="pt-3 border-t border-port-border/70 flex items-center justify-between gap-1 text-[11px] text-slate-400 mb-3">
                          <div>
                            {renderSlaStatus(wo.slaDeadline)}
                          </div>
                          <span className="flex items-center gap-1 text-slate-400 font-mono text-[10px] shrink-0">
                            <User className="w-3 h-3 text-slate-500" />
                            {wo.assignedTo ? wo.assignedTo.name.split(' ')[0] : 'Supervisor'}
                          </span>
                        </div>

                        {/* Controles Diretos de Transição de Fase (Kanban Interativo) */}
                        <div className="pt-2 border-t border-port-border/40 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          
                          {/* 1. Em Triagem / Aberta ➔ Iniciar Execução */}
                          {['ABERTA', 'EM_TRIAGEM', 'APROVADA'].includes(wo.status) && (
                            <button
                              onClick={() => handleUpdateStatus(wo.id, 'EM_EXECUCAO', 'Início de execução técnica registrado pelo Kanban')}
                              className="w-full py-1.5 px-2.5 bg-port-cobalt/15 hover:bg-port-cobalt/25 border border-port-cobalt/40 text-blue-400 hover:text-blue-300 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Play className="w-3 h-3 text-port-cobalt fill-current" />
                              <span>Iniciar Execução ➔</span>
                            </button>
                          )}

                          {/* 2. Em Execução ➔ Pausar p/ Peça ou Enviar p/ QA */}
                          {wo.status === 'EM_EXECUCAO' && (
                            <div className="grid grid-cols-2 gap-1.5 w-full">
                              <button
                                onClick={() => handleUpdateStatus(wo.id, 'AGUARDANDO_PECA', 'Pausa operacional: aguardando componentes de estoque')}
                                className="py-1 px-2 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 rounded-lg text-[10px] font-medium flex items-center justify-center gap-1 transition-all cursor-pointer"
                              >
                                <Pause className="w-2.5 h-2.5" />
                                <span>Pausar Peça</span>
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(wo.id, 'VALIDACAO_QA', 'Serviço finalizado: encaminhado para validação e auditoria QA')}
                                className="py-1 px-2 bg-port-emerald/15 hover:bg-port-emerald/25 border border-port-emerald/30 text-port-emerald rounded-lg text-[10px] font-medium flex items-center justify-center gap-1 transition-all cursor-pointer"
                              >
                                <ShieldCheck className="w-2.5 h-2.5" />
                                <span>Enviar QA ➔</span>
                              </button>
                            </div>
                          )}

                          {/* 3. Aguardando Peça ➔ Retomar Serviço */}
                          {wo.status === 'AGUARDANDO_PECA' && (
                            <button
                              onClick={() => handleUpdateStatus(wo.id, 'EM_EXECUCAO', 'Peça recebida: retomando execução técnica')}
                              className="w-full py-1.5 px-2.5 bg-port-amber/15 hover:bg-port-amber/25 border border-port-amber/40 text-port-amber rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Play className="w-3 h-3 text-port-amber fill-current" />
                              <span>Retomar Serviço ➔</span>
                            </button>
                          )}

                          {/* 4. Concluídas / QA ➔ Carimbo de SLA Cumprido */}
                          {['CONCLUIDA', 'VALIDACAO_QA'].includes(wo.status) && (
                            <div className="w-full py-1 px-2 bg-port-emerald/10 border border-port-emerald/25 rounded-lg flex items-center justify-between text-[10px] font-mono text-port-emerald">
                              <span className="flex items-center gap-1 font-semibold">
                                <CheckCircle2 className="w-3 h-3" />
                                {wo.status === 'CONCLUIDA' ? 'Encerramento Auditado' : 'Em Aceite QA'}
                              </span>
                              <span className="text-[9px] text-slate-400">SLA OK</span>
                            </div>
                          )}

                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

            </div>
          );
        })}
        </div>
      </div>

      {/* Modal de Criação de OS */}
      <CreateWorkOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadData}
        assets={assets}
        onSubmit={handleCreateWorkOrder}
      />

      {/* Modal de Detalhes & QA da OS */}
      <WorkOrderDetailModal
        workOrder={selectedWO}
        isOpen={!!selectedWO}
        onClose={() => setSelectedWO(null)}
        onUpdateStatus={handleUpdateStatus}
        onToggleChecklist={handleToggleChecklist}
      />
    </motion.div>
  );
};
