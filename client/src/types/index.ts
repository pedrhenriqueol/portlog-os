export type Role = 'ADMIN_MASTER' | 'SUPERVISOR_OPERACIONAL' | 'TECNICO_MANUTENCAO' | 'AUDITOR_QA';

export type AssetCategory = 
  | 'GUINDASTE_STS' 
  | 'GUINDASTE_RTG' 
  | 'REACH_STACKER' 
  | 'TERMINAL_TRACTOR' 
  | 'REBOCADOR_MARITIMO';

export type AssetStatus = 
  | 'OPERACIONAL' 
  | 'EM_MANUTENCAO' 
  | 'INOPERANTE_CRITICO' 
  | 'DESATIVADO';

export type WOPriority = 
  | 'BAIXA' 
  | 'MEDIA' 
  | 'ALTA' 
  | 'EMERGENCIAL_BERCO';

export type WOStatus = 
  | 'ABERTA' 
  | 'EM_TRIAGEM' 
  | 'APROVADA' 
  | 'EM_EXECUCAO' 
  | 'AGUARDANDO_PECA' 
  | 'VALIDACAO_QA' 
  | 'CONCLUIDA' 
  | 'CANCELADA';

export type WOType = 
  | 'PREVENTIVA_PROGRAMADA' 
  | 'CORRETIVA_URGENTE' 
  | 'PREDITIVA_SENSOR' 
  | 'INSPECAO_NORMATIVA';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  active?: boolean;
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  _count?: {
    assignedWOs: number;
  };
}

export interface Asset {
  id: string;
  code: string;
  name: string;
  category: AssetCategory;
  status: AssetStatus;
  locationBerth?: string;
  hourMeter: number;
  lastMaintenanceAt?: string;
  _count?: {
    workOrders: number;
  };
}

export interface ChecklistItem {
  id: string;
  taskItem: string;
  completed: boolean;
  measuredValue?: string;
  notes?: string;
  checkedAt?: string;
}

export interface PartItem {
  id: string;
  partName: string;
  partCode: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface WorkOrder {
  id: string;
  orderNumber: number;
  type: WOType;
  priority: WOPriority;
  status: WOStatus;
  title: string;
  description: string;
  slaDeadline: string;
  startedAt?: string;
  completedAt?: string;
  costParts: number;
  costLabor: number;
  asset: {
    id: string;
    code: string;
    name: string;
    category: AssetCategory;
    locationBerth?: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    role: Role;
  };
  createdBy: {
    id: string;
    name: string;
  };
  checklists?: ChecklistItem[];
  partsUsed?: PartItem[];
  _count?: {
    checklists: number;
    partsUsed: number;
  };
}

export interface DashboardMetrics {
  totalAssets: number;
  operationalAssets: number;
  availabilityRate: string;
  totalActiveWorkOrders: number;
  slaBreachedWorkOrders: number;
  criticalBerthWorkOrders: number;
  mttrHours: string;
  completedLast30Days: number;
}

export interface SensorReading {
  assetId: string;
  assetCode: string;
  assetName: string;
  temperature: number;
  vibration: number;
  hydraulicPressure: number;
  healthScore: number;
  status: 'NORMAL' | 'ALERTA' | 'CRITICO';
  timestamp: string;
}
