import React, { useState } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  Printer,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Calendar,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { Requisition, Material, Sector, AppSettings } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import NewRequisitionModal from './NewRequisitionModal';
import RequisitionPrintModal from './RequisitionPrintModal';

interface RequisitionsViewProps {
  requisitions: Requisition[];
  materials: Material[];
  sectors: Sector[];
  settings: AppSettings;
  loading: boolean;
  onRefresh: () => void;
  currentUser: { name: string; role: string; sector_id?: number | null };
  onSaveRequisition: (data: any) => Promise<void>;
  onApproveRequisition: (id: number, approvedBy: string) => Promise<void>;
  onRejectRequisition: (id: number, reason: string) => Promise<void>;
}

export default function RequisitionsView({
  requisitions,
  materials,
  sectors,
  settings,
  loading,
  onRefresh,
  currentUser,
  onSaveRequisition,
  onApproveRequisition,
  onRejectRequisition,
}: RequisitionsViewProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedForPrint, setSelectedForPrint] = useState<Requisition | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDENTE' | 'APROVADA' | 'REJEITADA'>('ALL');
  const [search, setSearch] = useState('');

  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [approveError, setApproveError] = useState<string | null>(null);

  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const filtered = requisitions.filter(r => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      const match =
        r.requisition_number.toLowerCase().includes(s) ||
        r.requester_name.toLowerCase().includes(s) ||
        (r.sector_name?.toLowerCase().includes(s)) ||
        (r.justification?.toLowerCase().includes(s));
      if (!match) return false;
    }
    return true;
  });

  const pendingCount = requisitions.filter(r => r.status === 'PENDENTE').length;

  const handleOpenPrint = (req: Requisition) => {
    setSelectedForPrint(req);
    setPrintModalOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (!approvingId) return;
    setApproveError(null);
    try {
      await onApproveRequisition(approvingId, currentUser.name);
      setApprovingId(null);
      onRefresh();
    } catch (err: any) {
      setApproveError(err.message || 'Erro ao aprovar requisição.');
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingId) return;
    try {
      await onRejectRequisition(rejectingId, rejectReason.trim() || 'Recusada pelo gestor de estoque.');
      setRejectingId(null);
      setRejectReason('');
      onRefresh();
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#1a3a52] tracking-tight flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#2c5aa0]" />
            <span>Requisições de Materiais & Impressão Formal</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Solicitações de retirada, conferência de estoque, baixa automática e impressão em padrão A4 com termo de responsabilidade.
          </p>
        </div>

        <button
          id="btn-new-requisition"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#1a3a52] hover:bg-[#2c5aa0] rounded-lg transition shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#f4c430]" />
          <span>Criar Requisição</span>
        </button>
      </div>

      {/* Status Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-slate-500 font-medium block">Total de Requisições</span>
          <span className="text-base font-extrabold text-[#1a3a52]">{requisitions.length} emitidas</span>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Aguardando Atendimento</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-base font-extrabold text-amber-700">{pendingCount} pendentes</span>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Atendidas / Aprovadas</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-base font-extrabold text-emerald-700">
            {requisitions.filter(r => r.status === 'APROVADA').length} atendidas
          </span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por número da requisição, solicitante, setor ou finalidade..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0] bg-white font-medium w-full md:w-44"
          >
            <option value="ALL">Todos os Status</option>
            <option value="PENDENTE">⏳ Pendentes</option>
            <option value="APROVADA">✅ Aprovadas / Atendidas</option>
            <option value="REJEITADA">❌ Rejeitadas</option>
          </select>
        </div>
      </div>

      {/* Requisitions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#1a3a52] text-slate-200 border-b border-[#2c5aa0]/30 font-semibold">
                <th className="py-3 px-3">Nº Requisição</th>
                <th className="py-3 px-3">Data</th>
                <th className="py-3 px-3">Setor Solicitante</th>
                <th className="py-3 px-3">Solicitante</th>
                <th className="py-3 px-2 text-center">Itens</th>
                <th className="py-3 px-3 text-right">Valor Total</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Nenhuma requisição encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filtered.map(req => {
                  const isPending = req.status === 'PENDENTE';
                  const isApproved = req.status === 'APROVADA';
                  const isRejected = req.status === 'REJEITADA';

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-mono font-bold text-[#1a3a52]">
                        {req.requisition_number}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                        {formatDate(req.date)}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800">
                        {req.sector_name}
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        {req.requester_name}
                      </td>
                      <td className="py-3 px-2 text-center font-mono">
                        <span className="bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-700">
                          {req.items?.length || req.items_count || 0}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#1a3a52]">
                        {formatCurrency(req.total_value || 0)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : isRejected
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {isApproved && <CheckCircle className="w-3 h-3" />}
                          {isPending && <Clock className="w-3 h-3" />}
                          {isRejected && <XCircle className="w-3 h-3" />}
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                        {/* Print Button (Always Available) */}
                        <button
                          onClick={() => handleOpenPrint(req)}
                          className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded transition inline-flex items-center gap-1"
                          title="Visualizar e Imprimir Requisição A4"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#2c5aa0]" />
                          <span>Imprimir</span>
                        </button>

                        {/* Approve Button (Only for Pending) */}
                        {isPending && (
                          <>
                            <button
                              onClick={() => {
                                setApprovingId(req.id);
                                setApproveError(null);
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded transition inline-flex items-center gap-1 shadow-2xs"
                              title="Aprovar e dar baixa automática nos saldos de estoque"
                            >
                              <CheckCircle className="w-3.5 h-3.5 text-[#f4c430]" />
                              <span>Atender</span>
                            </button>
                            <button
                              onClick={() => setRejectingId(req.id)}
                              className="px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 rounded transition"
                              title="Rejeitar requisição"
                            >
                              Rejeitar
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Requisition Modal */}
      <NewRequisitionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        materials={materials}
        sectors={sectors}
        currentUser={currentUser}
        onSave={async (data) => {
          await onSaveRequisition(data);
          onRefresh();
        }}
      />

      {/* Print Modal */}
      <RequisitionPrintModal
        requisition={selectedForPrint}
        settings={settings}
        isOpen={printModalOpen}
        onClose={() => {
          setPrintModalOpen(false);
          setSelectedForPrint(null);
        }}
      />

      {/* Approve Confirmation Modal */}
      {approvingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center gap-3 text-emerald-700">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Atender e Liberar Requisição?</h3>
                <p className="text-xs text-slate-500">Baixa automática de materiais</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ao confirmar, o sistema registrará automaticamente as movimentações de <strong>SAÍDA</strong> para cada item da requisição, deduzindo os saldos correspondentes no inventário físico.
            </p>
            {approveError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{approveError}</span>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setApprovingId(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                id="btn-confirm-approve-requisition"
                onClick={handleConfirmApprove}
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition shadow-xs"
              >
                Confirmar e Dar Baixa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              <span>Rejeitar Requisição</span>
            </h3>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Motivo da Recusa (Opcional):
              </label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Ex: Saldo indisponível ou necessidade de autorização da gerência..."
                rows={3}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRejectingId(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
              >
                Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
