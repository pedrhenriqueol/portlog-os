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
  ArrowUp,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Telemetry: React.FC = () => {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  
  // Estado local para transição instantânea de anomalia sem delay de rede
  const [simulatedAnomalies, setSimulatedAnomalies] = useState<Record<string, { 
    type: 'TEMPERATURA' | 'VIBRACAO' | 'PRESSAO_HIDRAULICA'; 
    temp: number;
    vib: number;
    press: number;
  }>>({});

  const fetchTelemetry = async () => {
    try {
      const response = await api.get('/telemetry/live');
      setReadings(response.data.readings);
    } catch (err) {
      console.error('Falha ao coletar telemetria IoT:', err);
    } finally {
      setLoading(false);
    }
  };

  // Polling automático com cancelamento limpo e proteção contra memory leaks
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const safeFetch = async () => {
      try {
        const response = await api.get('/telemetry/live', { signal: controller.signal });
        if (isMounted) {
          setReadings(response.data.readings);
          setLoading(false);
        }
      } catch (err: any) {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError' && isMounted) {
          console.error('Falha ao coletar telemetria IoT:', err);
          setLoading(false);
        }
      }
    };

    safeFetch();
    const interval = setInterval(safeFetch, 5000);

    return () => {
      isMounted = false;
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  const handleTriggerAnomaly = async (reading: SensorReading, sensorType: 'TEMPERATURA' | 'VIBRACAO' | 'PRESSAO_HIDRAULICA') => {
    setTriggering(reading.assetId);
    setNotification(null);

    // Variação de telemetria imediata
    const newTemp = sensorType === 'TEMPERATURA' ? 94.2 : reading.temperature;
    const newVib = sensorType === 'VIBRACAO' ? 8.7 : reading.vibration;
    const newPress = sensorType === 'PRESSAO_HIDRAULICA' ? 285 : reading.hydraulicPressure;

    // Aplica estado de anomalia no card instantaneamente
    setSimulatedAnomalies(prev => ({
      ...prev,
      [reading.assetId]: {
        type: sensorType,
        temp: newTemp,
        vib: newVib,
        press: newPress
      }
    }));

    const val = sensorType === 'TEMPERATURA' ? newTemp : sensorType === 'VIBRACAO' ? newVib : newPress;
    const threshold = sensorType === 'TEMPERATURA' ? 80 : sensorType === 'VIBRACAO' ? 7.0 : 250;

    try {
      const res = await api.post('/telemetry/trigger-anomaly', {
        assetId: reading.assetId,
        sensorType,
        currentValue: val,
        threshold
      });

      const woNumber = res.data?.workOrder?.orderNumber || '1042';
      setNotification(`Alerta Preditivo: OS #${woNumber} aberta automaticamente para ${reading.assetCode} (${sensorType}: ${val})`);
      await fetchTelemetry();
    } catch (err: any) {
      setNotification(`Erro ao registrar anomalia: ${err.message}`);
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
      {/* Header Industrial */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-white tracking-tight">Telemetria IoT & Manutenção Preditiva</h1>
            <span className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-port-emerald/10 border border-port-emerald/30 text-port-emerald">
              <span className="w-2 h-2 rounded-full bg-port-emerald animate-ping" />
              Stream 5s Ativo
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            Supervisão de sensores térmicos de redutores, vibração de mancais e pressão do circuito hidráulico.
          </p>
        </div>

        <button
          onClick={fetchTelemetry}
          className="px-3.5 py-2 bg-port-card hover:bg-port-border/40 border border-port-border rounded-xl text-xs font-medium text-slate-300 flex items-center gap-2 transition-all cursor-pointer shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar Sensores</span>
        </button>
      </div>

      {/* Banner de Notificação de Disparo de Anomalia */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 rounded-xl bg-port-nautical/15 border border-port-nautical/40 text-port-nautical text-xs font-medium flex items-center justify-between shadow-md"
          >
            <div className="flex items-center gap-2.5 font-mono">
              <ShieldAlert className="w-4 h-4 shrink-0 text-port-nautical" />
              <span>{notification}</span>
            </div>
            <button 
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid de Sensores Industriais IoT */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {readings.map((sensor) => {
          const sim = simulatedAnomalies[sensor.assetId];
          const currentTemp = sim?.temp ?? sensor.temperature;
          const currentVib = sim?.vib ?? sensor.vibration;
          const currentPress = sim?.press ?? sensor.hydraulicPressure;

          const isAnomalous = !!sim || currentTemp >= 80 || currentVib >= 7.0 || currentPress >= 250;
          const isCritical = sensor.status === 'CRITICO' || isAnomalous;
          const isAlert = sensor.status === 'ALERTA' && !isAnomalous;

          return (
            <motion.div
              key={sensor.assetId}
              whileHover={{ y: -2 }}
              className={`p-5 rounded-2xl bg-port-card/85 border transition-all duration-300 shadow-md flex flex-col justify-between relative overflow-hidden ${
                isAnomalous 
                  ? 'border-port-nautical/80 shadow-lg shadow-port-nautical/10 ring-1 ring-port-nautical/50' 
                  : isCritical 
                  ? 'border-port-rose/70 shadow-port-rose/10' 
                  : isAlert 
                  ? 'border-port-amber/70 shadow-port-amber/10' 
                  : 'border-port-border hover:border-slate-700'
              }`}
            >
              {/* Top Sensor Header */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-port-dark border border-port-border text-port-cobalt shadow-inner">
                    {sensor.assetCode}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400">
                      Saúde: <strong className="text-white">{isAnomalous ? Math.min(sensor.healthScore, 58) : sensor.healthScore}%</strong>
                    </span>
                    
                    {isAnomalous ? (
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-port-nautical/20 text-port-nautical border border-port-nautical/40 animate-pulse flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        ANOMALIA DETECTADA
                      </span>
                    ) : (
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                        isCritical
                          ? 'bg-port-rose/20 text-port-rose border-port-rose/40 animate-pulse'
                          : isAlert
                          ? 'bg-port-amber/20 text-port-amber border-port-amber/40'
                          : 'bg-port-emerald/20 text-port-emerald border-port-emerald/40'
                      }`}>
                        {sensor.status}
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-semibold text-white text-base leading-snug truncate">
                  {sensor.assetName}
                </h3>

                {/* Real-time Telemetry Metrics Monospaced */}
                <div className="mt-4 grid grid-cols-3 gap-2 font-mono text-center">
                  
                  {/* Temperatura */}
                  <div className={`p-2.5 rounded-xl border transition-all duration-300 ${
                    currentTemp >= 80 
                      ? 'bg-port-nautical/15 border-port-nautical/50 text-port-nautical' 
                      : 'bg-port-darker border-port-border/60 text-slate-300'
                  }`}>
                    <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-0.5">
                      <Thermometer className="w-3 h-3 text-port-amber" />
                      <span>TEMP</span>
                    </div>
                    <span className="text-xs font-bold flex items-center justify-center gap-0.5">
                      {currentTemp.toFixed(1)}°C
                      {currentTemp >= 80 && <ArrowUp className="w-3 h-3 animate-bounce text-port-nautical" />}
                    </span>
                  </div>

                  {/* Vibração */}
                  <div className={`p-2.5 rounded-xl border transition-all duration-300 ${
                    currentVib >= 7.0 
                      ? 'bg-port-rose/15 border-port-rose/50 text-port-rose' 
                      : 'bg-port-darker border-port-border/60 text-slate-300'
                  }`}>
                    <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-0.5">
                      <Zap className="w-3 h-3 text-blue-400" />
                      <span>VIB</span>
                    </div>
                    <span className="text-xs font-bold flex items-center justify-center gap-0.5">
                      {currentVib.toFixed(1)} <span className="text-[9px]">mm/s</span>
                      {currentVib >= 7.0 && <ArrowUp className="w-3 h-3 animate-bounce text-port-rose" />}
                    </span>
                  </div>

                  {/* Pressão Hidráulica */}
                  <div className={`p-2.5 rounded-xl border transition-all duration-300 ${
                    currentPress >= 250 
                      ? 'bg-port-amber/15 border-port-amber/50 text-port-amber' 
                      : 'bg-port-darker border-port-border/60 text-slate-300'
                  }`}>
                    <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-0.5">
                      <Gauge className="w-3 h-3 text-port-cobalt" />
                      <span>PRESS</span>
                    </div>
                    <span className="text-xs font-bold">
                      {Math.round(currentPress)} <span className="text-[9px]">bar</span>
                    </span>
                  </div>

                </div>
              </div>

              {/* Action: Trigger AI Predictive Order */}
              <div className="mt-5 pt-3 border-t border-port-border/70 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(sensor.timestamp).toLocaleTimeString('pt-BR')}
                </span>

                <button
                  onClick={() => handleTriggerAnomaly(sensor, currentTemp >= 80 ? 'TEMPERATURA' : 'VIBRACAO')}
                  disabled={triggering === sensor.assetId}
                  className={`px-2.5 py-1.5 border text-[11px] font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                    isAnomalous
                      ? 'bg-port-nautical/20 hover:bg-port-nautical/30 border-port-nautical/50 text-port-nautical'
                      : 'bg-port-card hover:bg-port-dark border-port-border text-slate-300 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-port-amber" />
                  <span>{triggering === sensor.assetId ? 'Disparando...' : 'Simular Anomalia!'}</span>
                </button>
              </div>

            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
