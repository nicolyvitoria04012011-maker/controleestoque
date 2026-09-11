import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Edit2,
  Trash2,
  History,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { Material } from '../types';
import { formatCurrency, formatNumber, exportToCsv } from '../utils/formatters';
import MaterialModal from './MaterialModal';

interface MaterialsViewProps {
  materials: Material[];
  loading: boolean;
  onRefresh: () => void;
  onSelectMaterialKardex: (materialId: number) => void;
  onSaveMaterial: (data: any, id?: number) => Promise<void>;
  onDeleteMaterial: (id: number) => Promise<{ success: boolean; message?: string }>;
}

export default function MaterialsView({
  materials,
  loading,
  onRefresh,
  onSelectMaterialKardex,
  onSaveMaterial,
  onDeleteMaterial,
}: MaterialsViewProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'CRITICAL' | 'NORMAL' | 'EXCESS'>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const categories = Array.from(new Set(materials.map(m => m.category))).sort();

  // Filtered materials
  const filteredMaterials = materials.filter(mat => {
    const matchesSearch =
      search.trim() === '' ||
      mat.code.toLowerCase().includes(search.toLowerCase()) ||
      mat.name.toLowerCase().includes(search.toLowerCase()) ||
      mat.location?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || mat.category === selectedCategory;

    let matchesStatus = true;
    if (selectedStatus === 'CRITICAL') {
      matchesStatus = mat.current_quantity <= mat.min_quantity;
    } else if (selectedStatus === 'NORMAL') {
      matchesStatus = mat.current_quantity > mat.min_quantity && mat.current_quantity <= mat.max_quantity;
    } else if (selectedStatus === 'EXCESS') {
      matchesStatus = mat.current_quantity > mat.max_quantity;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalFilteredValue = filteredMaterials.reduce((acc, m) => acc + (m.current_quantity * m.unit_price), 0);
  const criticalCount = materials.filter(m => m.current_quantity <= m.min_quantity).length;

  const handleExportCsv = () => {
    const headers = ['Código', 'Nome do Material', 'Categoria', 'Unidade', 'Saldo Atual', 'Valor Unitário (R$)', 'Valor Total (R$)', 'Estoque Mínimo', 'Estoque Máximo', 'Localização'];
    const rows = filteredMaterials.map(m => [
      m.code,
      m.name,
      m.category,
      m.unit,
      m.current_quantity,
      m.unit_price.toFixed(2),
      (m.current_quantity * m.unit_price).toFixed(2),
      m.min_quantity,
      m.max_quantity,
      m.location || '-'
    ]);
    exportToCsv(`posicao_estoque_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setDeleteError(null);
    const res = await onDeleteMaterial(deletingId);
    if (res.success) {
      setDeletingId(null);
      onRefresh();
    } else {
      setDeleteError(res.message || 'Não foi possível excluir o material.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header and Controls */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#1a3a52] tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-[#2c5aa0]" />
            <span>Gestão de Materiais & Almoxarifado</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastro de itens, unidades de medida, parametrização de estoque mínimo/máximo e precificação.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            title="Exportar dados filtrados para planilha Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exportar CSV</span>
          </button>
          <button
            id="btn-new-material"
            onClick={() => {
              setEditingMaterial(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#1a3a52] hover:bg-[#2c5aa0] rounded-lg transition shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#f4c430]" />
            <span>Novo Material</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-slate-500 font-medium block">Total de Materiais</span>
          <span className="text-base font-extrabold text-[#1a3a52]">{materials.length} itens</span>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-slate-500 font-medium block">Valor Filtrado em Estoque</span>
          <span className="text-base font-extrabold text-[#1a3a52]">{formatCurrency(totalFilteredValue)}</span>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-slate-500 font-medium block">Itens com Estoque Crítico</span>
          <span className={`text-base font-extrabold ${criticalCount > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
            {criticalCount} {criticalCount === 1 ? 'item' : 'itens'}
          </span>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-slate-500 font-medium block">Categorias Ativas</span>
          <span className="text-base font-extrabold text-[#2c5aa0]">{categories.length} categorias</span>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="input-search-materials"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por código, nome do material ou localização..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0] focus:border-transparent"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0] bg-white text-slate-700 w-full md:w-44"
          >
            <option value="ALL">Todas as Categorias</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value as any)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0] bg-white text-slate-700 w-full md:w-40"
          >
            <option value="ALL">Todos os Status</option>
            <option value="CRITICAL">⚠️ Estoque Crítico</option>
            <option value="NORMAL">✅ Estoque Normal</option>
            <option value="EXCESS">📦 Estoque em Excesso</option>
          </select>
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#1a3a52] text-slate-200 border-b border-[#2c5aa0]/30 font-semibold">
                <th className="py-3 px-3">Código</th>
                <th className="py-3 px-3">Nome / Descrição</th>
                <th className="py-3 px-3">Categoria</th>
                <th className="py-3 px-2 text-center">Unid.</th>
                <th className="py-3 px-3 text-right">Saldo Atual</th>
                <th className="py-3 px-3 text-right">Valor Unit.</th>
                <th className="py-3 px-3 text-right">Valor Total</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Localização</th>
                <th className="py-3 px-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    Nenhum material encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredMaterials.map(mat => {
                  const isCritical = mat.current_quantity <= mat.min_quantity;
                  const isExcess = mat.current_quantity > mat.max_quantity;
                  const totalVal = mat.current_quantity * mat.unit_price;

                  return (
                    <tr key={mat.id} className="hover:bg-slate-50/80 transition group">
                      <td className="py-3 px-3 font-mono font-bold text-[#1a3a52]">
                        {mat.code}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 max-w-[240px] truncate" title={mat.name}>
                          {mat.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Min: {mat.min_quantity} | Max: {mat.max_quantity} {mat.unit}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-medium text-slate-700">
                          {mat.category}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center font-mono font-bold text-slate-600">
                        {mat.unit}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`font-mono font-bold text-sm ${
                          isCritical ? 'text-amber-600 bg-amber-50 px-2 py-0.5 rounded' : 'text-slate-800'
                        }`}>
                          {mat.current_quantity}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {formatCurrency(mat.unit_price)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#1a3a52]">
                        {formatCurrency(totalVal)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {isCritical ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                            <AlertTriangle className="w-3 h-3" /> Crítico
                          </span>
                        ) : isExcess ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                            Excesso
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Normal
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-500 text-[11px]">
                        {mat.location || '-'}
                      </td>
                      <td className="py-3 px-3 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => onSelectMaterialKardex(mat.id)}
                          className="p-1.5 text-blue-700 hover:bg-blue-50 rounded transition"
                          title="Ver Kardex / Rastreabilidade"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingMaterial(mat);
                            setModalOpen(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-[#1a3a52] hover:bg-slate-100 rounded transition"
                          title="Editar Material"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingId(mat.id);
                            setDeleteError(null);
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded transition"
                          title="Excluir Material"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Material Modal (Add/Edit) */}
      <MaterialModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingMaterial(null);
        }}
        materialToEdit={editingMaterial}
        onSave={async (data) => {
          await onSaveMaterial(data, editingMaterial?.id);
          onRefresh();
        }}
        existingCategories={categories}
      />

      {/* Delete Confirmation Modal */}
      {deletingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Excluir Material?</h3>
            </div>
            <p className="text-xs text-slate-600">
              Tem certeza de que deseja remover este material? Esta operação é irreversível e só é permitida caso o item não possua movimentações históricas.
            </p>
            {deleteError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-2.5 rounded-lg">
                {deleteError}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeletingId(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
