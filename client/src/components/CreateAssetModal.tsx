import React, { useState } from 'react';
import { AssetCategory } from '../types';
import { X, Layers, Plus, MapPin, Gauge } from 'lucide-react';

interface CreateAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export const CreateAssetModal: React.FC<CreateAssetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onSubmit
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AssetCategory>('GUINDASTE_STS');
  const [locationBerth, setLocationBerth] = useState('');
  const [hourMeter, setHourMeter] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onSubmit({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        category,
        locationBerth: locationBerth.trim() || undefined,
        hourMeter: Number(hourMeter)
      });
      // Reset form
      setCode('');
      setName('');
      setLocationBerth('');
      setHourMeter(0);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar equipamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-port-card border border-port-border w-full max-w-lg rounded-2xl p-6 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-port-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-port-accent/20 border border-port-accent/40 flex items-center justify-center text-port-accent">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Cadastrar Novo Equipamento</h3>
              <p className="text-xs text-gray-400">Adicionar guindaste, reach stacker ou rebocador à frota</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Código Patrimonial *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: STS-03, RS-05"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 bg-port-darker border border-port-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-port-accent font-mono uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Categoria *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AssetCategory)}
                className="w-full px-3 py-2 bg-port-darker border border-port-border rounded-xl text-white focus:outline-none focus:border-port-accent"
              >
                <option value="GUINDASTE_STS">Guindaste STS (Cais)</option>
                <option value="GUINDASTE_RTG">Guindaste RTG (Pátio)</option>
                <option value="REACH_STACKER">Reach Stacker (45T)</option>
                <option value="TERMINAL_TRACTOR">Terminal Tractor (Tug)</option>
                <option value="REBOCADOR_MARITIMO">Rebocador Marítimo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
              Nome do Equipamento / Modelo *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Super Post-Panamax Liebherr 65T"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-port-darker border border-port-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-port-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Localização / Berço de Atracação
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ex: Berço 103, Pátio C"
                  value={locationBerth}
                  onChange={(e) => setLocationBerth(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-port-darker border border-port-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-port-accent font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Horímetro Inicial (Horas)
              </label>
              <div className="relative">
                <Gauge className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={hourMeter}
                  onChange={(e) => setHourMeter(Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 bg-port-darker border border-port-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-port-accent font-mono"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-port-border/60 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-port-border/40 font-medium transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-port-accent hover:bg-port-accentHover text-white font-medium rounded-xl transition-all shadow-md shadow-port-accent/20 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? 'Salvando...' : 'Salvar no Supabase'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
