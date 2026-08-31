import React, { useState } from 'react';
import { WorkOrder, WOStatus } from '../types';
import { 
  X, 
  Wrench, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  CheckSquare, 
  Square,
  ShieldCheck,
  ArrowRight,
  UserCheck
} from 'lucide-react';

interface WorkOrderDetailModalProps {
  workOrder: WorkOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: WOStatus, notes?: string) => Promise<void>;
  onToggleChecklist: (checklistId: string, completed: boolean) => Promise<void>;
}

export const WorkOrderDetailModal: React.FC<WorkOrderDetailModalProps> = ({
  workOrder,
  isOpen,
  onClose,
  onUpdateStatus,
  onToggleChecklist
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !workOrder) return null;

  const handleStatusChange = async (newStatus: WOStatus) => {
    setLoading(true);
    setError('');
    try {
      await onUpdateStatus(workOrder.id, newStatus);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar status da OS.');
    } finally {
      setLoading(false);
    }
  };

  const handleChecklistClick = async (checklistId: string, currentCompleted: boolean) => {
    try {
      await onToggleChecklist(checklistId, !currentCompleted);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar item do checklist.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-port-card border border-port-border w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-port-border/60">
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono font-bold px-2.5 py-1 rounded bg-port-accent/20 border border-port-accent/40 text-port-accent">
              #{workOrder.orderNumber}
            </span>
            <div>
              <h3 className="font-bold text-white text-base leading-snug">{workOrder.title}</h3>
              <p className="text-xs text-gray-400 font-mono">
                {workOrder.asset.code} • {workOrder.asset.name} • {workOrder.asset.locationBerth || 'Pátio'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-port-border/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-port-rose/10 border border-port-rose/30 text-port-rose text-xs">
            {error}
          </div>
        )}

        {/* Badges & Meta */}
        <div className="mt-4 grid grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-port-darker border border-port-border/50">
            <span className="text-gray-500 block text-[10px]">STATUS ATUAL</span>
            <span className="font-semibold text-white">{workOrder.status.replace('_', ' ')}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-port-darker border border-port-border/50">
            <span className="text-gray-500 block text-[10px]">PRIORIDADE</span>
            <span className={`font-semibold ${
              workOrder.priority === 'EMERGENCIAL_BERCO' ? 'text-port-rose' : 'text-port-amber'
            }`}>
              {workOrder.priority.replace('_', ' ')}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-port-darker border border-port-border/50">
            <span className="text-gray-500 block text-[10px]">DEADLINE SLA</span>
            <span className="font-semibold text-port-accent">
              {new Date(workOrder.slaDeadline).toLocaleString('pt-BR')}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="mt-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
            Descrição Técnica da Ocorrência
          </label>
          <div className="p-3 bg-port-darker rounded-xl border border-port-border/60 text-xs text-gray-300 leading-relaxed">
            {workOrder.description}
          </div>
        </div>

        {/* Technical QA Checklist */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
              Checklist de Conformidade Técnica (QA)
            </label>
            <span className="text-[11px] text-gray-500 font-mono">
              {workOrder.checklists?.filter(c => c.completed).length || 0} de {workOrder.checklists?.length || 0} validados
            </span>
          </div>

          <div className="space-y-2">
            {(!workOrder.checklists || workOrder.checklists.length === 0) ? (
              <p className="text-xs text-gray-500 italic p-3 bg-port-darker/50 rounded-xl border border-port-border/40">
                Nenhum item de checklist cadastrado para esta OS.
              </p>
            ) : (
              workOrder.checklists.map((check) => (
                <div
                  key={check.id}
                  onClick={() => handleChecklistClick(check.id, check.completed)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    check.completed
                      ? 'bg-port-emerald/10 border-port-emerald/40 text-port-emerald'
                      : 'bg-port-darker border-port-border/60 text-gray-300 hover:border-port-accent/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 text-xs">
                    {check.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-port-emerald shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-500 shrink-0" />
                    )}
                    <span className={check.completed ? 'line-through text-gray-400' : 'font-medium'}>
                      {check.taskItem}
                    </span>
                  </div>

                  {check.checkedAt && (
                    <span className="text-[10px] font-mono text-gray-500">
                      {new Date(check.checkedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* State Machine Transition Actions */}
        <div className="mt-6 pt-4 border-t border-port-border/60">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Avançar Máquina de Estados da OS
          </label>

          <div className="flex flex-wrap gap-2">
            {workOrder.status !== 'EM_EXECUCAO' && (
              <button
                disabled={loading}
                onClick={() => handleStatusChange('EM_EXECUCAO')}
                className="px-3 py-2 bg-port-amber/15 hover:bg-port-amber/25 border border-port-amber/40 text-port-amber text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Iniciar Execução</span>
              </button>
            )}

            {workOrder.status !== 'AGUARDANDO_PECA' && (
              <button
                disabled={loading}
                onClick={() => handleStatusChange('AGUARDANDO_PECA')}
                className="px-3 py-2 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-400 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
              >
                <span>Aguardando Peça</span>
              </button>
            )}

            {workOrder.status !== 'CONCLUIDA' && (
              <button
                disabled={loading}
                onClick={() => handleStatusChange('CONCLUIDA')}
                className="px-4 py-2 bg-port-emerald hover:bg-port-emerald/90 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-port-emerald/20 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Aprovar & Concluir (QA)</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
