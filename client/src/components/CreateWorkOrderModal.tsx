import React, { useState, useEffect } from 'react';
import { Asset, WOPriority, WOType } from '../types';
import { X, Wrench, Plus, Clock, AlertTriangle, CheckSquare } from 'lucide-react';

interface CreateWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assets: Asset[];
  onSubmit: (data: any) => Promise<void>;
}

export const CreateWorkOrderModal: React.FC<CreateWorkOrderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  assets,
  onSubmit
}) => {
  const [assetId, setAssetId] = useState('');
  const [type, setType] = useState<WOType>('CORRETIVA_URGENTE');
  const [priority, setPriority] = useState<WOPriority>('MEDIA');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [slaHours, setSlaHours] = useState(24);
  const [checklistText, setChecklistText] = useState('Inspeção visual de vazamentos\nTeste de pressão hidráulica\nChecagem dos sensores de fim de curso');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Garante que o assetId sempre seja inicializado com o ID do primeiro ativo disponível
  useEffect(() => {
    if (assets.length > 0 && (!assetId || !assets.find(a => a.id === assetId))) {
      setAssetId(assets[0].id);
    }
  }, [assets, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!assetId) {
      setError('Selecione um equipamento válido cadastrado.');
      setLoading(false);
      return;
    }

    if (description.trim().length < 10) {
      setError('A descrição técnica deve conter no mínimo 10 caracteres explicativos.');
      setLoading(false);
      return;
    }

    const checklists = checklistText
      .split('\n')
      .map(item => item.trim())
      .filter(item => item.length > 2);

    try {
      await onSubmit({
        assetId,
        type,
        priority,
        title: title.trim(),
        description: description.trim(),
        slaHours: Number(slaHours),
        checklists
      });
      // Reset form
      setTitle('');
      setDescription('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao abrir ordem de serviço.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-port-card border border-port-border w-full max-w-xl rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-port-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-port-accent/20 border border-port-accent/40 flex items-center justify-center text-port-accent">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Abrir Nova Ordem de Serviço (OS)</h3>
              <p className="text-xs text-gray-400">Emissão de chamado técnico de manutenção com cálculo de SLA</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-port-border/40 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-port-rose/10 border border-port-rose/30 text-port-rose text-xs">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Equipamento Alvo *
              </label>
              <select
                required
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                className="w-full px-3 py-2 bg-port-darker border border-port-border rounded-xl text-white focus:outline-none focus:border-port-accent font-mono"
              >
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.code} - {asset.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Tipo de Manutenção *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as WOType)}
                className="w-full px-3 py-2 bg-port-darker border border-port-border rounded-xl text-white focus:outline-none focus:border-port-accent"
              >
                <option value="CORRETIVA_URGENTE">Corretiva Urgente</option>
                <option value="PREVENTIVA_PROGRAMADA">Preventiva Programada</option>
                <option value="PREDITIVA_SENSOR">Preditiva por Sensores</option>
                <option value="INSPECAO_NORMATIVA">Inspeção Normativa / QA</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Nível de Prioridade *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as WOPriority)}
                className="w-full px-3 py-2 bg-port-darker border border-port-border rounded-xl text-white focus:outline-none focus:border-port-accent font-bold"
              >
                <option value="EMERGENCIAL_BERCO" className="text-port-rose">🚨 EMERGENCIAL BERÇO (Crítico)</option>
                <option value="ALTA" className="text-port-amber">⚠️ Alta Prioridade</option>
                <option value="MEDIA" className="text-blue-400">Normal / Média</option>
                <option value="BAIXA" className="text-gray-400">Baixa / Programada</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Prazo Máximo de SLA (Horas) *
              </label>
              <div className="relative">
                <Clock className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="1"
                  max="720"
                  required
                  value={slaHours}
                  onChange={(e) => setSlaHours(Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 bg-port-darker border border-port-border rounded-xl text-white focus:outline-none focus:border-port-accent font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
              Título da Ocorrência / Sintoma * (mín. 5 chars)
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Aquecimento excessivo na caixa redutora do guindaste"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-port-darker border border-port-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-port-accent"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
              Descrição Técnica do Problema * (mín. 10 chars)
            </label>
            <textarea
              required
              rows={3}
              placeholder="Descreva detalhadamente o sintoma, local de intervenção e ferramentas necessárias..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-port-darker border border-port-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-port-accent"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Itens de Checklist de QA (1 por linha)</span>
              <span className="text-[10px] text-port-accent lowercase">validação de conformidade</span>
            </label>
            <textarea
              rows={3}
              value={checklistText}
              onChange={(e) => setChecklistText(e.target.value)}
              placeholder="Digite um item por linha..."
              className="w-full px-3 py-2 bg-port-darker border border-port-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-port-accent font-mono text-[11px]"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-port-border/60 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-port-border/40 font-medium transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-port-accent hover:bg-port-accentHover text-white font-medium rounded-xl transition-all shadow-md shadow-port-accent/20 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? 'Emitindo OS...' : 'Emitir Ordem de Serviço'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
