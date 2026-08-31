import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { SensorReading } from '../types';
import { 
  Activity, 
  Radio, 
  AlertTriangle, 
  Gauge, 
  Thermometer, 
  Zap, 
  ShieldAlert, 
  CheckCircle2, 
  RefreshCw,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Telemetry: React.FC = () => {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchTelemetry = async () => {
    try {
      const response = await api.get('/telemetry/live');
      setReadings(response.data.readings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Polling automático a cada 5 segundos para simular telemetria em tempo real
  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerAnomaly = async (reading: SensorReading, sensorType: 'TEMPERATURA' | 'VIBRACAO' | 'PRESSAO_HIDRAULICA') => {
    setTriggering(reading.assetId);
    setNotification(null);

    const val = sensorType === 'TEMPERATURA' ? reading.temperature : sensorType === 'VIBRACAO' ? reading.vibration : reading.hydraulicPressure;
    const threshold = sensorType === 'TEMPERATURA' ? 80 : sensorType === 'VIBRACAO' ? 7.0 : 250;

    try {
      const res = await api.post('/telemetry/trigger-anomaly', {
        assetId: reading.assetId,
        sensorType,
        currentValue: val,
        threshold
      });
      setNotification(`🚨 OS Preditiva #${res.data.workOrder.orderNumber} aberta automaticamente para ${reading.assetCode}!`);
      await fetchTelemetry();
    } catch (err: any) {
      setNotification(`Erro ao disparar anomalia: ${err.message}`);
    } finally {
      setTriggering(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Telemetria IoT & Manutenção Preditiva</h1>
            <span className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-port-emerald/10 border border-port-emerald/30 text-port-emerald">
              <span className="w-2 h-2 rounded-full bg-port-emerald animate-ping" />
              Live Telemetry 5s
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-0.5">
            Monitoramento de sensores de temperatura de redutores, vibração de motores e pressão hidráulica com IA Preditiva.
          </p>
        </div>

        <button
          onClick={fetchTelemetry}
          className="px-3.5 py-2 bg-port-card hover:bg-port-border/40 border border-port-border rounded-xl text-xs font-medium text-gray-300 flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar Sensores</span>
        </button>
      </div>

      {/* Anomaly Trigger Banner Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-xl bg-port-rose/15 border border-port-rose/40 text-port-rose text-xs font-medium flex items-center justify-between shadow-lg shadow-port-rose/5"
          >
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>{notification}</span>
            </div>
            <button 
              onClick={() => setNotification(null)}
              className="text-gray-400 hover:text-white text-xs font-mono underline"
            >
              Fechar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid of IoT Sensors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {readings.map((sensor) => {
          const isCritical = sensor.status === 'CRITICO';
          const isAlert = sensor.status === 'ALERTA';

          return (
            <motion.div
              key={sensor.assetId}
              whileHover={{ y: -3 }}
              className={`p-5 rounded-2xl bg-port-card/80 border transition-all shadow-xl flex flex-col justify-between relative overflow-hidden ${
                isCritical 
                  ? 'border-port-rose/60 shadow-port-rose/10' 
                  : isAlert 
                  ? 'border-port-amber/60 shadow-port-amber/10' 
                  : 'border-port-border/80 hover:border-port-accent/50'
              }`}
            >
              {/* Top Sensor Header */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-port-dark border border-port-border text-port-accent">
                    {sensor.assetCode}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-gray-400">
                      Saúde: <strong className="text-white">{sensor.healthScore}%</strong>
                    </span>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                      isCritical
                        ? 'bg-port-rose/20 text-port-rose border-port-rose/40 animate-pulse'
                        : isAlert
                        ? 'bg-port-amber/20 text-port-amber border-port-amber/40'
                        : 'bg-port-emerald/20 text-port-emerald border-port-emerald/40'
                    }`}>
                      {sensor.status}
                    </span>
                  </div>
                </div>

                <h3 className="font-semibold text-white text-base leading-snug truncate">
                  {sensor.assetName}
                </h3>

                {/* Real-time Telemetry Metrics */}
                <div className="mt-4 grid grid-cols-3 gap-2 font-mono text-center">
                  
                  {/* Temperatura */}
                  <div className={`p-2.5 rounded-xl border ${
                    sensor.temperature >= 80 ? 'bg-port-rose/10 border-port-rose/40 text-port-rose' : 'bg-port-darker border-port-border/40 text-gray-300'
                  }`}>
                    <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500 mb-0.5">
                      <Thermometer className="w-3 h-3 text-port-amber" />
                      <span>TEMP</span>
                    </div>
                    <span className="text-xs font-bold">{sensor.temperature}°C</span>
                  </div>

                  {/* Vibração */}
                  <div className={`p-2.5 rounded-xl border ${
                    sensor.vibration >= 7.0 ? 'bg-port-rose/10 border-port-rose/40 text-port-rose' : 'bg-port-darker border-port-border/40 text-gray-300'
                  }`}>
                    <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500 mb-0.5">
                      <Zap className="w-3 h-3 text-blue-400" />
                      <span>VIB</span>
                    </div>
                    <span className="text-xs font-bold">{sensor.vibration} <span className="text-[9px]">mm/s</span></span>
                  </div>

                  {/* Pressão Hidráulica */}
                  <div className="p-2.5 rounded-xl bg-port-darker border border-port-border/40 text-gray-300">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500 mb-0.5">
                      <Gauge className="w-3 h-3 text-port-accent" />
                      <span>PRESS</span>
                    </div>
                    <span className="text-xs font-bold">{sensor.hydraulicPressure} <span className="text-[9px]">bar</span></span>
                  </div>

                </div>
              </div>

              {/* Action: Trigger AI Predictive Order */}
              <div className="mt-5 pt-3 border-t border-port-border/50 flex items-center justify-between gap-2">
                <span className="text-[10px] text-gray-500 font-mono">
                  {new Date(sensor.timestamp).toLocaleTimeString('pt-BR')}
                </span>

                <button
                  onClick={() => handleTriggerAnomaly(sensor, sensor.temperature >= 80 ? 'TEMPERATURA' : 'VIBRACAO')}
                  disabled={triggering === sensor.assetId}
                  className="px-2.5 py-1.5 bg-port-rose/15 hover:bg-port-rose/25 border border-port-rose/40 text-port-rose text-[11px] font-medium rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{triggering === sensor.assetId ? 'Disparando...' : 'Simular Anomalia IoT'}</span>
                </button>
              </div>

            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
