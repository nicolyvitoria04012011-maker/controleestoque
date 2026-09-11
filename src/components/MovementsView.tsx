import React, { useState } from 'react';
import {
  ArrowLeftRight,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  Calendar,
  Building2,
  Package
} from 'lucide-react';
import { Movement, Material, Sector, MovementType } from '../types';
import { formatCurrency, formatDateTime, exportToCsv } from '../utils/formatters';
import NewMovementModal from './NewMovementModal';

interface MovementsViewProps {
  movements: Movement[];
  materials: Material[];
  sectors: Sector[];
  loading: boolean;
  onRefresh: () => void;
  currentUser: { name: string };
  onSaveMovement: (data: any) => Promise<void>;
  onOpenNewMovementModal?: boolean;
}

export default function MovementsView({
  movements,
  materials,
  sectors,
  loading,
  onRefresh,
  currentUser,
  onSaveMovement,
}: MovementsViewProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<MovementType>('ENTRADA');
  const [selectedType, setSelectedType] = useState<'ALL' | 'ENTRADA' | 'SAIDA'>('ALL');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  const filteredMovements = movements.filter(m => {
    if (selectedType !== 'ALL' && m.type !== selectedType) return false;
    if (selectedSector !== 'ALL' && String(m.sector_id) !== selectedSector) return false;
    if (selectedMaterial !== 'ALL' && String(m.material_id) !== selectedMaterial) return false;
    if (startDate && m.date_time < startDate) return false;
    if (endDate && m.date_time.slice(0, 10) > endDate) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      const match =
        (m.material_name?.toLowerCase().includes(s)) ||
        (m.material_code?.toLowerCase().includes(s)) ||
        (m.reason?.toLowerCase().includes(s)) ||
        (m.document_number?.toLowerCase().includes(s)) ||
        (m.responsible_person?.toLowerCase().includes(s)) ||
        (m.sector_name?.toLowerCase().includes(s));
      if (!match) return false;
    }
    return true;
  });

  const totalEntradasVal = filteredMovements
    .filter(m => m.type === 'ENTRADA')
    .reduce((acc, m) => acc + m.total_price, 0);

  const totalSaidasVal = filteredMovements
    .filter(m => m.type === 'SAIDA')
    .reduce((acc, m) => acc + m.total_price, 0);

  const handleExportCsv = () => {
    const headers = [
      'Data e Hora',
      'Tipo',
      'Código Material',
      'Descrição Material',
      'Setor',
      'Quantidade',
      'Unidade',
      'Saldo Anterior',
      'Novo Saldo',
      'Valor Unitário (R$)',
      'Valor Total (R$)',
      'Nº Documento',
      'Motivo / Justificativa',
      'Operador Responsável'
    ];
    const rows = filteredMovements.map(m => [
      m.date_time,
      m.type,
      m.material_code || '',
      m.material_name || '',
      m.sector_name || 'Almoxarifado',
      m.quantity,
      m.material_unit || 'UN',
      m.previous_balance,
      m.new_balance,
      m.unit_price.toFixed(2),
      m.total_price.toFixed(2),
      m.document_number || '-',
      m.reason,
      m.responsible_person
    ]);
    exportToCsv(`historico_movimentacoes_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  const handleOpenAdd = (type: MovementType) => {
    setModalType(type);
    setModalOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#1a3a52] tracking-tight flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-[#2c5aa0]" />
            <span>Movimentações de Estoque</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro rigoroso de entradas e saídas físicas com cálculo automático de saldos e controle financeiro.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exportar CSV</span>
          </button>
          <button
            id="btn-new-entrada"
            onClick={() => handleOpenAdd('ENTRADA')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition"
          >
            <ArrowDownRight className="w-4 h-4 text-emerald-600" />
            <span>Registrar Entrada</span>
          </button>
          <button
            id="btn-new-saida"
            onClick={() => handleOpenAdd('SAIDA')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#1a3a52] hover:bg-[#2c5aa0] rounded-lg transition shadow-xs"
          >
            <ArrowUpRight className="w-4 h-4 text-[#f4c430]" />
            <span>Registrar Saída</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-slate-500 font-medium block">Total de Movimentações Filtradas</span>
          <span className="text-base font-extrabold text-[#1a3a52]">{filteredMovements.length} registros</span>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Entradas Acumuladas</span>
            <ArrowDownRight className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-base font-extrabold text-emerald-700">{formatCurrency(totalEntradasVal)}</span>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Saídas Acumuladas</span>
            <ArrowUpRight className="w-4 h-4 text-[#2c5aa0]" />
          </div>
          <span className="text-base font-extrabold text-[#1a3a52]">{formatCurrency(totalSaidasVal)}</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por material, código, motivo, responsável ou documento..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0]"
            />
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value as any)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0] bg-white font-medium"
            >
              <option value="ALL">Todos os Tipos</option>
              <option value="ENTRADA">⬇️ Apenas Entradas</option>
              <option value="SAIDA">⬆️ Apenas Saídas</option>
            </select>

            {/* Material filter */}
            <select
              value={selectedMaterial}
              onChange={e => setSelectedMaterial(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0] bg-white max-w-[200px]"
            >
              <option value="ALL">Todos os Materiais</option>
              {materials.map(m => (
                <option key={m.id} value={m.id}>
                  [{m.code}] {m.name}
                </option>
              ))}
            </select>

            {/* Sector filter */}
            <select
              value={selectedSector}
              onChange={e => setSelectedSector(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0] bg-white max-w-[180px]"
            >
              <option value="ALL">Todos os Setores</option>
              {sectors.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date range filters */}
        <div className="flex items-center gap-3 text-xs text-slate-600 pt-2 border-t border-slate-100 flex-wrap">
          <span className="font-semibold text-slate-700 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Período:
          </span>
          <div className="flex items-center gap-1.5">
            <span>De:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-2.5 py-1 text-xs border border-slate-300 rounded-md"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span>Até:</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-2.5 py-1 text-xs border border-slate-300 rounded-md"
            />
          </div>
          {(startDate || endDate || selectedType !== 'ALL' || selectedMaterial !== 'ALL' || selectedSector !== 'ALL' || search) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSelectedType('ALL');
                setSelectedMaterial('ALL');
                setSelectedSector('ALL');
                setSearch('');
              }}
              className="text-xs text-blue-700 hover:underline font-semibold ml-auto"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#1a3a52] text-slate-200 border-b border-[#2c5aa0]/30 font-semibold">
                <th className="py-3 px-3">Data / Hora</th>
                <th className="py-3 px-2 text-center">Tipo</th>
                <th className="py-3 px-3">Material</th>
                <th className="py-3 px-3">Setor Responsável</th>
                <th className="py-3 px-2 text-right">Qtd.</th>
                <th className="py-3 px-3 text-center">Saldos (Ant. → Novo)</th>
                <th className="py-3 px-3 text-right">Total (R$)</th>
                <th className="py-3 px-3">Motivo / Documento</th>
                <th className="py-3 px-3">Operador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    Nenhuma movimentação encontrada para os parâmetros definidos.
                  </td>
                </tr>
              ) : (
                filteredMovements.map(mov => {
                  const isEntrada = mov.type === 'ENTRADA';
                  return (
                    <tr key={mov.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-600 text-[11px]">
                        {formatDateTime(mov.date_time)}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`inline-flex items-center gap-1 font-extrabold text-[10px] px-2 py-0.5 rounded-full ${
                          isEntrada
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-blue-50 text-[#2c5aa0] border border-blue-200'
                        }`}>
                          {isEntrada ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {mov.type}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 truncate max-w-[200px]" title={mov.material_name}>
                          {mov.material_name}
                        </div>
                        <span className="font-mono text-[10px] text-slate-400">
                          {mov.material_code}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        {mov.sector_name || <span className="text-slate-400 italic">Almoxarifado</span>}
                      </td>
                      <td className="py-3 px-2 text-right font-mono font-bold">
                        <span className={isEntrada ? 'text-emerald-700' : 'text-blue-900'}>
                          {isEntrada ? '+' : '-'}{mov.quantity} {mov.material_unit || 'UN'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-600">
                        <span>{mov.previous_balance}</span>
                        <span className="text-slate-400 mx-1">→</span>
                        <strong className="text-slate-900">{mov.new_balance}</strong>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#1a3a52]">
                        {formatCurrency(mov.total_price)}
                      </td>
                      <td className="py-3 px-3 max-w-[220px]">
                        <div className="truncate text-slate-800" title={mov.reason}>
                          {mov.reason}
                        </div>
                        {mov.document_number && (
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                            {mov.document_number}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600 text-[11px] whitespace-nowrap">
                        {mov.responsible_person}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <NewMovementModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialType={modalType}
        materials={materials}
        sectors={sectors}
        currentUser={currentUser}
        onSave={async (data) => {
          await onSaveMovement(data);
          onRefresh();
        }}
      />
    </div>
  );
}
