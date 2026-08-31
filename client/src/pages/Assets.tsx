import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Asset } from '../types';
import { Layers, Plus, Search, MapPin, Gauge } from 'lucide-react';
import { CreateAssetModal } from '../components/CreateAssetModal';

export const Assets: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/assets', { params: { search: search || undefined } });
      setAssets(response.data.assets);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, [search]);

  const handleCreateAsset = async (data: any) => {
    await api.post('/assets', data);
    await loadAssets();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Frotas & Equipamentos de Berço</h1>
          <p className="text-sm text-gray-400 mt-0.5">Inventário de guindastes STS, RTGs, reach stackers e rebocadores.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código ou nome..."
              className="pl-9 pr-4 py-2 bg-port-card border border-port-border rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-port-accent transition-all w-64 font-mono"
            />
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="py-2.5 px-4 bg-port-accent hover:bg-port-accentHover text-white font-medium rounded-xl transition-all shadow-lg shadow-port-accent/20 flex items-center gap-2 text-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Equipamento</span>
          </button>
        </div>
      </div>

      {/* Grid of Asset Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {assets.length === 0 && !loading ? (
          <div className="col-span-3 p-12 text-center text-gray-500 text-xs font-mono border border-dashed border-port-border rounded-2xl">
            Nenhum equipamento encontrado. Clique em "Cadastrar Equipamento" para adicionar.
          </div>
        ) : (
          assets.map((asset) => (
            <div 
              key={asset.id}
              className="p-5 rounded-2xl bg-port-card/70 border border-port-border hover:border-port-accent/50 transition-all shadow-lg flex flex-col justify-between group"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-port-accent/10 border border-port-accent/30 text-port-accent">
                    {asset.code}
                  </span>
                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                    asset.status === 'OPERACIONAL'
                      ? 'bg-port-emerald/10 border-port-emerald/30 text-port-emerald'
                      : 'bg-port-amber/10 border-port-amber/30 text-port-amber'
                  }`}>
                    {asset.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Asset Name */}
                <h3 className="font-semibold text-white text-base leading-snug group-hover:text-port-accent transition-colors">
                  {asset.name}
                </h3>
                <p className="text-xs text-gray-400 font-mono mt-1">Categoria: {asset.category.replace('_', ' ')}</p>

                {/* Location & Hourmeter */}
                <div className="mt-4 space-y-2 pt-3 border-t border-port-border/40 text-xs text-gray-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-gray-400">
                      <MapPin className="w-3.5 h-3.5 text-port-accent" />
                      Localização / Berço:
                    </span>
                    <span className="text-white font-mono">{asset.locationBerth || 'Pátio Principal'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-gray-400">
                      <Gauge className="w-3.5 h-3.5 text-port-amber" />
                      Horímetro Acumulado:
                    </span>
                    <span className="text-white font-mono">{Number(asset.hourMeter).toFixed(1)} hrs</span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-5 pt-3 border-t border-port-border/40 flex items-center justify-between text-xs text-gray-500">
                <span className="font-mono">
                  {asset._count?.workOrders || 0} manutenções ativas
                </span>
                <span className="text-port-accent text-[11px] font-medium">
                  Ativo Registrado
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Criação */}
      <CreateAssetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadAssets}
        onSubmit={handleCreateAsset}
      />
    </div>
  );
};
