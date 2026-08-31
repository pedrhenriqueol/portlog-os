import React, { useState, useEffect } from 'react';
import { WorkOrder, WOStatus, PartItem } from '../types';
import { api } from '../api/client';
import { 
  X, 
  Wrench, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Square,
  ShieldCheck,
  Package,
  Plus,
  Printer,
  FileText,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [parts, setParts] = useState<PartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form de Peças
  const [partName, setPartName] = useState('');
  const [partCode, setPartCode] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState(0);
  const [addingPart, setAddingPart] = useState(false);
  const [showPartForm, setShowPartForm] = useState(false);

  useEffect(() => {
    if (workOrder && isOpen) {
      loadParts();
    }
  }, [workOrder, isOpen]);

  const loadParts = async () => {
    if (!workOrder) return;
    try {
      const res = await api.get(`/inventory/work-orders/${workOrder.id}/parts`);
      setParts(res.data.parts);
    } catch (e) {
      console.error(e);
    }
  };

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

  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingPart(true);
    setError('');

    try {
      await api.post(`/inventory/work-orders/${workOrder.id}/parts`, {
        partName: partName.trim(),
        partCode: partCode.trim().toUpperCase(),
        quantity: Number(quantity),
        unitCost: Number(unitCost)
      });
      setPartName('');
      setPartCode('');
      setQuantity(1);
      setUnitCost(0);
      setShowPartForm(false);
      await loadParts();
    } catch (err: any) {
      setError(err.message || 'Erro ao apontar peça utilizada.');
    } finally {
      setAddingPart(false);
    }
  };

  const handlePrintLaudo = () => {
    window.print();
  };

  const totalPartsCost = parts.reduce((acc, p) => acc + Number(p.totalCost), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 print:p-0 print:bg-white print:static">
      <div className="bg-port-card border border-port-border w-full max-w-3xl rounded-2xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto print:max-h-none print:border-none print:shadow-none print:bg-white print:text-black">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-port-border/60 print:border-black">
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono font-bold px-2.5 py-1 rounded bg-port-accent/20 border border-port-accent/40 text-port-accent print:bg-gray-100 print:text-black">
              #{workOrder.orderNumber}
            </span>
            <div>
              <h3 className="font-bold text-white text-lg leading-snug print:text-black">{workOrder.title}</h3>
              <p className="text-xs text-gray-400 font-mono print:text-gray-700">
                {workOrder.asset.code} • {workOrder.asset.name} • {workOrder.asset.locationBerth || 'Pátio'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrintLaudo}
              className="px-3 py-1.5 rounded-xl bg-port-dark hover:bg-port-border/40 border border-port-border text-xs text-gray-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
              title="Imprimir Laudo Pericial de Conformidade"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Gerar Laudo PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-port-border/40 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-port-rose/10 border border-port-rose/30 text-port-rose text-xs print:hidden">
            {error}
          </div>
        )}

        {/* Badges & Meta */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-port-darker border border-port-border/50 print:border-gray-300">
            <span className="text-gray-500 block text-[10px]">STATUS</span>
            <span className="font-semibold text-white print:text-black">{workOrder.status.replace('_', ' ')}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-port-darker border border-port-border/50 print:border-gray-300">
            <span className="text-gray-500 block text-[10px]">PRIORIDADE</span>
            <span className={`font-semibold ${
              workOrder.priority === 'EMERGENCIAL_BERCO' ? 'text-port-rose' : 'text-port-amber'
            } print:text-black`}>
              {workOrder.priority.replace('_', ' ')}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-port-darker border border-port-border/50 print:border-gray-300">
            <span className="text-gray-500 block text-[10px]">SLA MÁXIMO</span>
            <span className="font-semibold text-port-accent print:text-black">
              {new Date(workOrder.slaDeadline).toLocaleString('pt-BR')}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-port-darker border border-port-border/50 print:border-gray-300">
            <span className="text-gray-500 block text-[10px]">CUSTO TOTAL PEÇAS</span>
            <span className="font-semibold text-port-emerald print:text-black">
              R$ {totalPartsCost.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="mt-5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1 print:text-black">
            Descrição Técnica da Ocorrência
          </label>
          <div className="p-3 bg-port-darker rounded-xl border border-port-border/60 text-xs text-gray-300 leading-relaxed print:bg-gray-50 print:text-black print:border-gray-300">
            {workOrder.description}
          </div>
        </div>

        {/* Technical QA Checklist */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 print:text-black">
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
                      ? 'bg-port-emerald/10 border-port-emerald/40 text-port-emerald print:text-black'
                      : 'bg-port-darker border-port-border/60 text-gray-300 hover:border-port-accent/50 print:text-black'
                  }`}
                >
                  <div className="flex items-center gap-2.5 text-xs">
                    {check.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-port-emerald shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-500 shrink-0" />
                    )}
                    <span className={check.completed ? 'line-through text-gray-400 print:no-underline' : 'font-medium'}>
                      {check.taskItem}
                    </span>
                  </div>

                  {check.checkedAt && (
                    <span className="text-[10px] font-mono text-gray-500">
                      Auditado às {new Date(check.checkedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Peças & Componentes Consumidos (Inventory Tracking) */}
        <div className="mt-6 pt-4 border-t border-port-border/60">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-port-accent" />
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-300 print:text-black">
                Peças & Componentes Utilizados na Manutenção
              </label>
            </div>

            <button
              onClick={() => setShowPartForm(!showPartForm)}
              className="px-2.5 py-1 bg-port-accent/15 hover:bg-port-accent/25 border border-port-accent/40 text-port-accent text-xs font-medium rounded-lg transition-all flex items-center gap-1 cursor-pointer print:hidden"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Apontar Peça</span>
            </button>
          </div>

          {/* Form inline de apontamento de peça */}
          <AnimatePresence>
            {showPartForm && (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleAddPart}
                className="mb-4 p-4 bg-port-darker rounded-xl border border-port-border/80 space-y-3 text-xs"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-400 mb-1">Nome da Peça / Fluido *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Óleo Hidráulico ISO VG 46"
                      value={partName}
                      onChange={(e) => setPartName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-port-card border border-port-border rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Part Number / Código *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: SKF-6208-2RS"
                      value={partCode}
                      onChange={(e) => setPartCode(e.target.value)}
                      className="w-full px-3 py-1.5 bg-port-card border border-port-border rounded-lg text-white font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-400 mb-1">Quantidade *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-port-card border border-port-border rounded-lg text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Custo Unitário (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={unitCost}
                      onChange={(e) => setUnitCost(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-port-card border border-port-border rounded-lg text-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPartForm(false)}
                    className="px-3 py-1 text-gray-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={addingPart}
                    className="px-4 py-1.5 bg-port-accent text-white font-medium rounded-lg text-xs"
                  >
                    {addingPart ? 'Registrando...' : 'Salvar Peça'}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Lista de Peças */}
          <div className="space-y-2">
            {parts.length === 0 ? (
              <p className="text-xs text-gray-500 italic p-3 bg-port-darker/40 rounded-xl border border-port-border/40">
                Nenhum componente ou peça apontada nesta OS.
              </p>
            ) : (
              parts.map((p) => (
                <div key={p.id} className="p-3 rounded-xl bg-port-darker border border-port-border/60 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="font-semibold text-white print:text-black">{p.partName}</span>
                    <span className="text-gray-500 ml-2">({p.partCode})</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-400">{p.quantity} un x R$ {Number(p.unitCost).toFixed(2)}</span>
                    <span className="font-bold text-port-emerald print:text-black">R$ {Number(p.totalCost).toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* State Machine Transition Actions */}
        <div className="mt-6 pt-4 border-t border-port-border/60 print:hidden">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Avançar Máquina de Estados da OS
          </label>

          <div className="flex flex-wrap gap-2">
            {workOrder.status !== 'EM_EXECUCAO' && (
              <button
                disabled={loading}
                onClick={() => handleStatusChange('EM_EXECUCAO')}
                className="px-3 py-2 bg-port-amber/15 hover:bg-port-amber/25 border border-port-amber/40 text-port-amber text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Iniciar Execução</span>
              </button>
            )}

            {workOrder.status !== 'AGUARDANDO_PECA' && (
              <button
                disabled={loading}
                onClick={() => handleStatusChange('AGUARDANDO_PECA')}
                className="px-3 py-2 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-400 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Aguardando Peça</span>
              </button>
            )}

            {workOrder.status !== 'CONCLUIDA' && (
              <button
                disabled={loading}
                onClick={() => handleStatusChange('CONCLUIDA')}
                className="px-4 py-2 bg-port-emerald hover:bg-port-emerald/90 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-port-emerald/20 flex items-center gap-1.5 cursor-pointer"
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
