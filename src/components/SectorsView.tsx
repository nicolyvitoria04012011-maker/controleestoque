import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  User,
  CreditCard,
  Mail,
  AlertTriangle,
  X,
  Check,
  Package
} from 'lucide-react';
import { Sector } from '../types';
import { formatCurrency } from '../utils/formatters';

interface SectorsViewProps {
  sectors: Sector[];
  loading: boolean;
  onRefresh: () => void;
  onSaveSector: (data: any, id?: number) => Promise<void>;
  onDeleteSector: (id: number) => Promise<{ success: boolean; message?: string }>;
}

export default function SectorsView({
  sectors,
  loading,
  onRefresh,
  onSaveSector,
  onDeleteSector,
}: SectorsViewProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [responsible, setResponsible] = useState('');
  const [costCenter, setCostCenter] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingSector(null);
    setCode('');
    setName('');
    setResponsible('');
    setCostCenter('');
    setEmail('');
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (sec: Sector) => {
    setEditingSector(sec);
    setCode(sec.code);
    setName(sec.name);
    setResponsible(sec.responsible);
    setCostCenter(sec.cost_center || '');
    setEmail(sec.email || '');
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!code.trim() || !name.trim() || !responsible.trim()) {
      setFormError('Preencha a sigla/código, nome do setor e responsável.');
      return;
    }

    setSaving(true);
    try {
      await onSaveSector(
        {
          code: code.trim().toUpperCase(),
          name: name.trim(),
          responsible: responsible.trim(),
          cost_center: costCenter.trim(),
          email: email.trim(),
        },
        editingSector?.id
      );
      setModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar setor.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setDeleteError(null);
    const res = await onDeleteSector(deletingId);
    if (res.success) {
      setDeletingId(null);
      onRefresh();
    } else {
      setDeleteError(res.message || 'Não foi possível excluir o setor.');
    }
  };

  const totalSpentAllSectors = sectors.reduce((acc, s) => acc + (s.total_spent || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#1a3a52] tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#2c5aa0]" />
            <span>Gestão de Setores & Departamentos</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastro de centros de custo e setores solicitantes para rastreamento de consumo de materiais.
          </p>
        </div>

        <button
          id="btn-new-sector"
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#1a3a52] hover:bg-[#2c5aa0] rounded-lg transition shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#f4c430]" />
          <span>Novo Setor</span>
        </button>
      </div>

      {/* Sectors Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sectors.map(sec => {
          const percentOfTotal = totalSpentAllSectors > 0 ? Math.round(((sec.total_spent || 0) / totalSpentAllSectors) * 100) : 0;
          return (
            <div
              key={sec.id}
              className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-[#2c5aa0]/40 transition space-y-3.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-[#1a3a52] text-[#f4c430]">
                      {sec.code}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">
                      {sec.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(sec)}
                      className="p-1 text-slate-400 hover:text-[#1a3a52] hover:bg-slate-100 rounded transition"
                      title="Editar Setor"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingId(sec.id);
                        setDeleteError(null);
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                      title="Excluir Setor"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Responsável: <strong className="text-slate-800">{sec.responsible}</strong></span>
                  </div>
                  {sec.cost_center && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      <span>Centro de Custo: <strong className="text-slate-800">{sec.cost_center}</strong></span>
                    </div>
                  )}
                  {sec.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{sec.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Consumption summary */}
              <div className="pt-3 border-t border-slate-100 bg-slate-50 -mx-5 -mb-5 p-4 rounded-b-xl">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Consumo Acumulado:</span>
                  <span className="font-bold text-[#1a3a52] font-mono">
                    {formatCurrency(sec.total_spent || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>{sec.materials_consumed_count || 0} materiais distintos</span>
                  <span>{percentOfTotal}% do total</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sector Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="bg-[#1a3a52] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingSector ? 'Editar Setor' : 'Cadastrar Novo Setor'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Sigla / Código *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="Ex: MAN"
                    className="w-full px-3 py-2 text-xs font-mono font-bold uppercase border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Nome do Setor / Departamento *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: Manutenção Industrial"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Encarregado / Responsável *
                </label>
                <input
                  type="text"
                  required
                  value={responsible}
                  onChange={e => setResponsible(e.target.value)}
                  placeholder="Ex: Eng. Carlos Silva"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Centro de Custo
                  </label>
                  <input
                    type="text"
                    value={costCenter}
                    onChange={e => setCostCenter(e.target.value)}
                    placeholder="Ex: CC-1010"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    E-mail do Setor
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="manutencao@empresa.com.br"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0]"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#1a3a52] hover:bg-[#2c5aa0] rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4 text-[#f4c430]" />
                  <span>{saving ? 'Salvando...' : editingSector ? 'Salvar Alterações' : 'Cadastrar Setor'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Excluir Setor?</h3>
            </div>
            <p className="text-xs text-slate-600">
              Setores com movimentações ou requisições registradas não podem ser excluídos para garantir a integridade histórica.
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
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
