export type UnitOfMeasure = 'UN' | 'CX' | 'KG' | 'M' | 'L' | 'PC' | 'PAR' | 'ROLO' | 'PACOTE';

export type AppTab = 'dashboard' | 'materials' | 'sectors' | 'movements' | 'requisitions' | 'reports' | 'best-practices';

export type MovementType = 'ENTRADA' | 'SAIDA';

export type RequisitionStatus = 'PENDENTE' | 'APROVADA' | 'REJEITADA' | 'CANCELADA';

export type UserRole = 'ADMIN' | 'ALMOXARIFE' | 'SOLICITANTE';

export interface User {
  id: number;
  username: string;
  name: string;
  role: UserRole;
  sector_id?: number | null;
  sector_name?: string;
}

export interface Material {
  id: number;
  code: string;
  name: string;
  category: string;
  unit: UnitOfMeasure;
  current_quantity: number;
  unit_price: number;
  min_quantity: number;
  max_quantity: number;
  location: string;
  created_at: string;
}

export interface Sector {
  id: number;
  code: string;
  name: string;
  responsible: string;
  cost_center: string;
  email: string;
  created_at: string;
  materials_consumed_count?: number;
  total_spent?: number;
}

export interface Movement {
  id: number;
  date_time: string;
  type: MovementType;
  material_id: number;
  material_name?: string;
  material_code?: string;
  material_unit?: string;
  sector_id?: number | null;
  sector_name?: string;
  quantity: number;
  previous_balance: number;
  new_balance: number;
  unit_price: number;
  total_price: number;
  reason: string;
  document_number?: string;
  responsible_person: string;
  created_at: string;
}

export interface RequisitionItem {
  id?: number;
  requisition_id?: number;
  material_id: number;
  material_code?: string;
  material_name?: string;
  material_unit?: string;
  current_stock?: number;
  quantity: number;
  unit_price: number;
  total_price?: number;
  observation?: string;
}

export interface Requisition {
  id: number;
  requisition_number: string;
  date: string;
  sector_id: number;
  sector_name?: string;
  sector_code?: string;
  requester_name: string;
  status: RequisitionStatus;
  justification: string;
  approved_by?: string | null;
  approval_date?: string | null;
  items: RequisitionItem[];
  total_value?: number;
  items_count?: number;
  created_at: string;
}

export interface AppSettings {
  company_name: string;
  company_subtitle: string;
  technical_responsible: string;
  technical_document: string;
  contact_email: string;
  contact_phone: string;
  currency: string;
}

export interface AbcItem {
  material_id: number;
  code: string;
  name: string;
  category: string;
  current_quantity: number;
  unit_price: number;
  total_value: number;
  percentage_of_total: number;
  cumulative_percentage: number;
  classification: 'A' | 'B' | 'C';
}

export interface TopMovedItem {
  material_id: number;
  code: string;
  name: string;
  unit: string;
  total_quantity: number;
  total_value: number;
  movement_count: number;
}

export interface SectorConsumption {
  sector_id: number;
  sector_name: string;
  sector_code: string;
  total_value: number;
  items_count: number;
}

export interface MonthlyMovementSummary {
  month: string;
  entradas_val: number;
  saidas_val: number;
  entradas_qty: number;
  saidas_qty: number;
}

export interface DashboardKpis {
  totalInventoryValue: number;
  totalMaterialsCount: number;
  criticalItemsCount: number;
  pendingRequisitionsCount: number;
  monthMovementsCount: number;
  stockTurnoverRate: number; // Taxa de rotatividade
  criticalMaterials: Material[];
  topMovedMaterials: TopMovedItem[];
  abcClassification: {
    classA: { count: number; totalValue: number; percentageValue: number };
    classB: { count: number; totalValue: number; percentageValue: number };
    classC: { count: number; totalValue: number; percentageValue: number };
    items: AbcItem[];
  };
  monthlyMovements: MonthlyMovementSummary[];
  sectorConsumption: SectorConsumption[];
}

export type DashboardStats = DashboardKpis;

export interface KardexEntry {
  id: number;
  date_time: string;
  type: MovementType;
  quantity: number;
  unit_price: number;
  total_price: number;
  previous_balance: number;
  new_balance: number;
  reason: string;
  document_number: string;
  sector_name: string;
  responsible_person: string;
}
