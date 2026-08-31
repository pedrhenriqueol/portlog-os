import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { ShieldCheck, Clock, User, FileText, CheckCircle2 } from 'lucide-react';

export const Audit: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAuditLogs() {
      try {
        const response = await api.get('/audit');
        setLogs(response.data.logs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAuditLogs();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Trilha de Auditoria & Conformidade QA</h1>
        <p className="text-sm text-gray-400 mt-0.5">Registro imutável de alterações de estado, aprovações de ordens de serviço e segurança.</p>
      </div>

      <div className="bg-port-card/70 border border-port-border rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-port-border/60 bg-port-dark/40 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-300 font-mono flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-port-emerald" />
            Append-Only Audit Stream
          </span>
          <span className="text-[11px] text-gray-500 font-mono">{logs.length} eventos registrados</span>
        </div>

        <div className="divide-y divide-port-border/40">
          {logs.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-xs font-mono">
              Nenhum log registrado ainda. As transições de OS e cadastros aparecerão aqui automaticamente.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-port-dark/30 transition-colors flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-port-accent">
                      {log.action}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-port-border text-gray-300 font-mono">
                      {log.entity}
                    </span>
                  </div>

                  <div className="text-xs text-gray-300 font-mono bg-port-darker/60 p-2 rounded-lg border border-port-border/40 mt-2 max-w-2xl">
                    <pre className="text-[11px] whitespace-pre-wrap">{JSON.stringify(log.details, null, 2)}</pre>
                  </div>
                </div>

                <div className="text-right text-[11px] text-gray-500 font-mono shrink-0">
                  <p className="text-gray-400 font-medium">{log.user?.name || 'Sistema'}</p>
                  <p className="text-[10px]">{new Date(log.createdAt).toLocaleString('pt-BR')}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
