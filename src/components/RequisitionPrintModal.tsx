import React from 'react';
import { X, Printer, CheckCircle2, Boxes, ShieldCheck, Download } from 'lucide-react';
import { Requisition, AppSettings } from '../types';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';

interface RequisitionPrintModalProps {
  requisition: Requisition | null;
  settings: AppSettings;
  isOpen: boolean;
  onClose: () => void;
}

export default function RequisitionPrintModal({
  requisition,
  settings,
  isOpen,
  onClose,
}: RequisitionPrintModalProps) {
  if (!isOpen || !requisition) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalValue = requisition.items.reduce(
    (acc, item) => acc + (item.quantity * item.unit_price),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 max-w-4xl w-full my-auto overflow-hidden print:border-none print:shadow-none print:max-w-none print:w-full print:rounded-none">
        {/* Modal Controls (Hidden in Print) */}
        <div className="bg-[#1a3a52] text-white px-6 py-3 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#f4c430]" />
            <span className="font-bold text-sm">Visualização de Impressão da Requisição</span>
            <span className="font-mono text-xs text-amber-300">({requisition.requisition_number})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              id="btn-print-requisition-action"
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#f4c430] hover:bg-[#e0a800] text-[#0f2438] font-bold text-xs rounded-lg transition shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Gerar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg transition hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Formal Document Layout (A4 format) */}
        <div className="p-8 sm:p-10 text-slate-900 space-y-6 print:p-6 print-container">
          {/* Header */}
          <div className="border-b-2 border-slate-800 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-[#1a3a52] flex items-center justify-center text-[#f4c430] border border-slate-700">
                  <Boxes className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-tight text-[#1a3a52] uppercase">
                    {settings.company_name}
                  </h1>
                  <p className="text-xs text-slate-600 font-medium">
                    {settings.company_subtitle}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Telefone: {settings.contact_phone} • E-mail: {settings.contact_email}
                  </p>
                </div>
              </div>

              {/* Number and Status */}
              <div className="text-right">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Requisição de Material
                </div>
                <div className="text-xl font-black text-[#1a3a52] font-mono">
                  {requisition.requisition_number}
                </div>
                <div className="mt-1">
                  <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded uppercase ${
                    requisition.status === 'APROVADA'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : requisition.status === 'REJEITADA'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    Status: {requisition.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 font-semibold block uppercase tracking-wider text-[10px]">Data de Emissão</span>
              <span className="font-bold text-slate-900">{formatDate(requisition.date)}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block uppercase tracking-wider text-[10px]">Setor Solicitante</span>
              <span className="font-bold text-slate-900">
                {requisition.sector_name} {requisition.sector_code ? `(${requisition.sector_code})` : ''}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block uppercase tracking-wider text-[10px]">Solicitante / Requisitante</span>
              <span className="font-bold text-slate-900">{requisition.requester_name}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block uppercase tracking-wider text-[10px]">Responsável Técnico</span>
              <span className="font-bold text-[#1a3a52]">{settings.technical_responsible}</span>
            </div>
          </div>

          {/* Justification */}
          {requisition.justification && (
            <div className="text-xs bg-white p-3 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-700 block mb-0.5">Finalidade / Justificativa da Aplicação:</span>
              <p className="text-slate-600 leading-relaxed">{requisition.justification}</p>
            </div>
          )}

          {/* Items Table */}
          <div className="border border-slate-300 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#1a3a52] text-white font-semibold">
                  <th className="py-2.5 px-3 w-10 text-center">Item</th>
                  <th className="py-2.5 px-3 w-24">Código</th>
                  <th className="py-2.5 px-3">Descrição do Material</th>
                  <th className="py-2.5 px-2 text-center w-16">Unid.</th>
                  <th className="py-2.5 px-3 text-right w-20">Qtd. Solicitada</th>
                  <th className="py-2.5 px-3 text-right w-24">Valor Unit.</th>
                  <th className="py-2.5 px-3 text-right w-28">Valor Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {requisition.items.map((it, idx) => (
                  <tr key={it.id || idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{it.material_code}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      {it.material_name}
                      {it.observation && (
                        <span className="block text-[10px] text-slate-500 italic mt-0.5">
                          Obs: {it.observation}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-slate-600">{it.material_unit || 'UN'}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{it.quantity}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">{formatCurrency(it.unit_price)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(it.quantity * it.unit_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                  <td colSpan={4} className="py-2.5 px-3 text-right uppercase text-[11px] text-slate-600">
                    Totais da Requisição:
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-900">
                    {requisition.items.reduce((s, i) => s + i.quantity, 0)} itens
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">-</td>
                  <td className="py-2.5 px-3 text-right font-mono text-sm text-[#1a3a52]">
                    {formatCurrency(totalValue)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Legal / Conferral Notice */}
          <div className="text-[10px] text-slate-500 border border-slate-200 p-3 rounded-lg leading-normal">
            <strong>Termo de Responsabilidade e Recebimento:</strong> Declaro que recebi os materiais listados nesta requisição em perfeitas condições de uso e conferência, comprometendo-me a utilizá-los estritamente nas atividades operacionais do setor designado, obedecendo às normas de segurança do trabalho e boas práticas de conservação patrimonial.
          </div>

          {/* Signature Blocks (Crucial Requirement: Three formal signatures) */}
          <div className="pt-8 border-t border-slate-300 page-break-inside-avoid">
            <div className="grid grid-cols-3 gap-6 text-center text-xs">
              {/* Signature 1: Solicitante */}
              <div className="space-y-1">
                <div className="border-b border-slate-700 h-10 w-full mb-1" />
                <div className="font-bold text-slate-900">{requisition.requester_name}</div>
                <div className="text-[10px] text-slate-500">Assinatura do Solicitante / Recebedor</div>
                <div className="text-[10px] text-slate-400">Data: ____/____/________</div>
              </div>

              {/* Signature 2: Almoxarife */}
              <div className="space-y-1">
                <div className="border-b border-slate-700 h-10 w-full mb-1" />
                <div className="font-bold text-slate-900">
                  {requisition.approved_by || 'Almoxarife Responsável'}
                </div>
                <div className="text-[10px] text-slate-500">Expedição / Almoxarifado Central</div>
                <div className="text-[10px] text-slate-400">
                  {requisition.approval_date ? `Atendido em: ${formatDate(requisition.approval_date)}` : 'Data: ____/____/________'}
                </div>
              </div>

              {/* Signature 3: Responsável Técnico (MANDATORY REQUIREMENT) */}
              <div className="space-y-1">
                <div className="border-b border-slate-700 h-10 w-full mb-1" />
                <div className="font-bold text-[#1a3a52]">
                  {settings.technical_responsible}
                </div>
                <div className="text-[10px] text-slate-600 font-semibold">
                  Responsável Técnico Homologado
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {settings.technical_document}
                </div>
              </div>
            </div>
          </div>

          {/* Footer watermark in print */}
          <div className="pt-6 border-t border-slate-200 text-[9px] text-slate-400 flex justify-between items-center print-only">
            <span>Sistema de Controle de Estoques • Documento Emitido Eletronicamente</span>
            <span>Autenticação: {requisition.requisition_number}-{new Date().getTime()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
