import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  FileSpreadsheet,
  Layers,
  History,
  Building2,
  Calendar,
  Search,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { Material, Movement, Sector, AppSettings } from '../types';
import { formatCurrency, formatDate, formatDateTime, exportToCsv } from '../utils/formatters';

interface ReportsViewProps {
  materials: Material[];
  movements: Movement[];
  sectors: Sector[];
  settings: AppSettings;
  selectedKardexMaterialId?: number | null;
}

export default function ReportsView({
  materials,
  movements,
  sectors,
  settings,
  selectedKardexMaterialId,
}: ReportsViewProps) {
  const [reportTab, setReportTab] = useState<'POSICAO' | 'KARDEX' | 'SETORES'>('POSICAO');
  const [kardexMatId, setKardexMatId] = useState<number>(
    selectedKardexMaterialId || materials[0]?.id || 1
  );
  const [sectorReportId, setSectorReportId] = useState<string>('ALL');

  useEffect(() => {
    if (selectedKardexMaterialId) {
      setKardexMatId(selectedKardexMaterialId);
      setReportTab('KARDEX');
    }
  }, [selectedKardexMaterialId]);

  // Kardex calculation for selected material
  const targetMaterial = materials.find(m => m.id === kardexMatId);
  const materialMovements = movements
    .filter(m => m.material_id === kardexMatId)
    .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());

  const totalEntries = materialMovements
    .filter(m => m.type === 'ENTRADA')
    .reduce((acc, m) => acc + m.quantity, 0);

  const totalExits = materialMovements
    .filter(m => m.type === 'SAIDA')
    .reduce((acc, m) => acc + m.quantity, 0);

  // Sector consumption calculations
  const sectorMovements = movements.filter(m => m.type === 'SAIDA' && m.sector_id);

  // Print triggering
  const handlePrint = () => {
    window.print();
  };

  // CSV Exports
  const handleExportStockPositionCsv = () => {
    const headers = [
      'Código',
      'Material',
      'Categoria',
      'Unidade',
      'Saldo Atual',
      'Mínimo',
      'Máximo',
      'Valor Unitário (R$)',
      'Valor Total (R$)',
      'Localização'
    ];
    const rows = materials.map(m => [
      m.code,
      m.name,
      m.category,
      m.unit,
      m.current_quantity,
      m.min_quantity,
      m.max_quantity,
      m.unit_price.toFixed(2),
      (m.current_quantity * m.unit_price).toFixed(2),
      m.location || '-'
    ]);
    exportToCsv(`relatorio_posicao_estoque_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  const handleExportKardexCsv = () => {
    if (!targetMaterial) return;
    const headers = ['Data / Hora', 'Tipo', 'Setor Destino', 'Documento', 'Motivo', 'Entrada', 'Saída', 'Saldo', 'Valor Total (R$)'];
    const rows = materialMovements.map(m => [
      m.date_time,
      m.type,
      m.sector_name || 'Almoxarifado',
      m.document_number || '-',
      m.reason,
      m.type === 'ENTRADA' ? m.quantity : '',
      m.type === 'SAIDA' ? m.quantity : '',
      m.new_balance,
      m.total_price.toFixed(2)
    ]);
    exportToCsv(`kardex_${targetMaterial.code}_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  return (
    <div className="space-y-5">
      {/* Navigation and Actions */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-extrabold text-[#1a3a52] tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#2c5aa0]" />
            <span>Central de Relatórios Operacionais & Rastreabilidade</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Posição física dos estoques, ficha Kardex com histórico cronológico e consumo segmentado por centro de custo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {reportTab === 'POSICAO' && (
            <button
              onClick={handleExportStockPositionCsv}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Exportar CSV</span>
            </button>
          )}
          {reportTab === 'KARDEX' && (
            <button
              onClick={handleExportKardexCsv}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Exportar Kardex</span>
            </button>
          )}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#0f2438] bg-[#f4c430] hover:bg-[#e0a800] rounded-lg transition shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Relatório</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher (Hidden in Print) */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-2xs no-print text-xs font-bold">
        <button
          onClick={() => setReportTab('POSICAO')}
          className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 transition ${
            reportTab === 'POSICAO'
              ? 'bg-[#1a3a52] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Boxes className="w-4 h-4 text-[#f4c430]" />
          <span>Posição Geral dos Estoques (Inventário)</span>
        </button>
        <button
          onClick={() => setReportTab('KARDEX')}
          className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 transition ${
            reportTab === 'KARDEX'
              ? 'bg-[#1a3a52] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <History className="w-4 h-4 text-[#f4c430]" />
          <span>Ficha Kardex / Rastreabilidade de Item</span>
        </button>
        <button
          onClick={() => setReportTab('SETORES')}
          className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 transition ${
            reportTab === 'SETORES'
              ? 'bg-[#1a3a52] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4 text-[#f4c430]" />
          <span>Consumo & Custo por Setor</span>
        </button>
      </div>

      {/* Formal Printable Document Header (Appears in Print or Top of Printable Sheets) */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-6 print-container print:border-none print:shadow-none print:p-0">
        <div className="border-b-2 border-slate-800 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#1a3a52] flex items-center justify-center text-[#f4c430]">
                <Boxes className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight text-[#1a3a52] uppercase">
                  {settings.company_name}
                </h2>
                <p className="text-[11px] text-slate-600">
                  {settings.company_subtitle} • Almoxarifado Central
                </p>
              </div>
            </div>
            <div className="text-right text-xs">
              <div className="font-bold text-slate-800 uppercase tracking-wide">
                {reportTab === 'POSICAO' && 'Relatório de Posição dos Estoques'}
                {reportTab === 'KARDEX' && 'Ficha de Rastreabilidade & Kardex'}
                {reportTab === 'SETORES' && 'Relatório de Consumo por Departamento'}
              </div>
              <div className="text-slate-500 text-[11px]">
                Emissão: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-slate-700 font-semibold text-[11px]">
                Responsável Técnico: <span className="text-[#1a3a52]">{settings.technical_responsible}</span>
              </div>
            </div>
          </div>
        </div>

        {/* TAB 1: Posição Geral dos Estoques */}
        {reportTab === 'POSICAO' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 font-medium block">Total de Itens Cadastrados</span>
                <span className="font-bold text-slate-900 text-sm">{materials.length} materiais</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Patrimônio em Estoque</span>
                <span className="font-bold text-[#1a3a52] text-sm">
                  {formatCurrency(materials.reduce((acc, m) => acc + (m.current_quantity * m.unit_price), 0))}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Itens em Alerta Crítico</span>
                <span className="font-bold text-amber-700 text-sm">
                  {materials.filter(m => m.current_quantity <= m.min_quantity).length} itens
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Itens com Excesso de Saldo</span>
                <span className="font-bold text-blue-800 text-sm">
                  {materials.filter(m => m.current_quantity > m.max_quantity).length} itens
                </span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#1a3a52] text-slate-200 font-semibold">
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Descrição do Material</th>
                    <th className="py-2.5 px-3">Categoria</th>
                    <th className="py-2.5 px-2 text-center">Unid.</th>
                    <th className="py-2.5 px-3 text-right">Saldo Físico</th>
                    <th className="py-2.5 px-2 text-center">Mín / Máx</th>
                    <th className="py-2.5 px-3 text-right">Custo Unit.</th>
                    <th className="py-2.5 px-3 text-right">Valor Total</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3">Localização</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {materials.map(mat => {
                    const isCritical = mat.current_quantity <= mat.min_quantity;
                    const isExcess = mat.current_quantity > mat.max_quantity;
                    return (
                      <tr key={mat.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold text-slate-800">{mat.code}</td>
                        <td className="py-2 px-3 font-medium text-slate-900">{mat.name}</td>
                        <td className="py-2 px-3 text-slate-600">{mat.category}</td>
                        <td className="py-2 px-2 text-center font-mono">{mat.unit}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {mat.current_quantity}
                        </td>
                        <td className="py-2 px-2 text-center text-[10px] text-slate-500 font-mono">
                          {mat.min_quantity} / {mat.max_quantity}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-600">
                          {formatCurrency(mat.unit_price)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-[#1a3a52]">
                          {formatCurrency(mat.current_quantity * mat.unit_price)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {isCritical ? (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                              Crítico
                            </span>
                          ) : isExcess ? (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                              Excesso
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                              Normal
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-500 text-[11px]">{mat.location || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Ficha Kardex */}
        {reportTab === 'KARDEX' && (
          <div className="space-y-4">
            {/* Material Selector (Hidden in Print) */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                  Selecione o Material para Ficha Kardex:
                </span>
                <select
                  value={kardexMatId}
                  onChange={e => setKardexMatId(Number(e.target.value))}
                  className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium min-w-[280px]"
                >
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>
                      [{m.code}] {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {targetMaterial && (
                <div className="text-xs text-slate-600 font-mono">
                  Saldo Físico Atual: <strong className="text-slate-900">{targetMaterial.current_quantity} {targetMaterial.unit}</strong>
                </div>
              )}
            </div>

            {/* Target Material Header Info */}
            {targetMaterial && (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-slate-500 font-medium block">Código & Descrição</span>
                    <span className="font-mono font-bold text-[#1a3a52] text-sm">
                      {targetMaterial.code}
                    </span>
                    <span className="block font-semibold text-slate-800">{targetMaterial.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Parâmetros de Estoque</span>
                    <span className="text-slate-800">
                      Mín: <strong>{targetMaterial.min_quantity}</strong> | Máx: <strong>{targetMaterial.max_quantity}</strong> {targetMaterial.unit}
                    </span>
                    <span className="block text-slate-500 text-[11px]">Local: {targetMaterial.location || 'Não informado'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Total de Entradas / Saídas</span>
                    <span className="text-emerald-700 font-bold">+{totalEntries}</span> / <span className="text-blue-700 font-bold">-{totalExits}</span> {targetMaterial.unit}
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Saldo Atual em Estoque</span>
                    <span className="text-base font-black text-[#1a3a52] font-mono">
                      {targetMaterial.current_quantity} {targetMaterial.unit}
                    </span>
                    <span className="block text-slate-500 text-[11px]">
                      Patrimônio: {formatCurrency(targetMaterial.current_quantity * targetMaterial.unit_price)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Kardex Movements Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#1a3a52] text-slate-200 font-semibold">
                    <th className="py-2.5 px-3">Data / Hora</th>
                    <th className="py-2.5 px-2 text-center">Tipo</th>
                    <th className="py-2.5 px-3">Setor Solicitante</th>
                    <th className="py-2.5 px-3">Nº Doc / Motivo</th>
                    <th className="py-2.5 px-3 text-right">Entrada</th>
                    <th className="py-2.5 px-3 text-right">Saída</th>
                    <th className="py-2.5 px-3 text-right">Saldo Resultante</th>
                    <th className="py-2.5 px-3 text-right">Valor Total</th>
                    <th className="py-2.5 px-3">Operador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {materialMovements.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500">
                        Nenhuma movimentação registrada para este material até o momento.
                      </td>
                    </tr>
                  ) : (
                    materialMovements.map(m => {
                      const isEntrada = m.type === 'ENTRADA';
                      return (
                        <tr key={m.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                            {formatDateTime(m.date_time)}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isEntrada ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-[#2c5aa0]'
                            }`}>
                              {m.type}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-800">
                            {m.sector_name || <span className="text-slate-400 italic">Almoxarifado</span>}
                          </td>
                          <td className="py-2 px-3 text-slate-700 max-w-[200px] truncate" title={m.reason}>
                            {m.document_number && <span className="font-mono text-[10px] font-bold mr-1">[{m.document_number}]</span>}
                            {m.reason}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                            {isEntrada ? `+${m.quantity}` : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-blue-900">
                            {!isEntrada ? `-${m.quantity}` : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-black text-slate-900 bg-slate-50">
                            {m.new_balance} {targetMaterial?.unit}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-[#1a3a52]">
                            {formatCurrency(m.total_price)}
                          </td>
                          <td className="py-2 px-3 text-slate-600 text-[11px]">{m.responsible_person}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Consumo & Rastreabilidade por Setor */}
        {reportTab === 'SETORES' && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Filtrar por Setor:</span>
                <select
                  value={sectorReportId}
                  onChange={e => setSectorReportId(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="ALL">Todos os Setores</option>
                  {sectors.map(s => (
                    <option key={s.id} value={s.id}>
                      [{s.code}] {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sectors
                .filter(s => sectorReportId === 'ALL' || String(s.id) === sectorReportId)
                .map(sector => {
                  const itemsIssued = movements.filter(
                    m => m.type === 'SAIDA' && m.sector_id === sector.id
                  );
                  const totalSpent = itemsIssued.reduce((acc, m) => acc + m.total_price, 0);

                  return (
                    <div
                      key={sector.id}
                      className="border border-slate-200 rounded-xl p-4 bg-white space-y-3"
                    >
                      <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold bg-[#1a3a52] text-[#f4c430] px-2 py-0.5 rounded">
                              {sector.code}
                            </span>
                            <h3 className="font-bold text-sm text-slate-900">{sector.name}</h3>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Responsável: {sector.responsible} • CC: {sector.cost_center || 'Geral'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block uppercase">Despesa Total</span>
                          <span className="font-mono font-bold text-sm text-[#1a3a52]">
                            {formatCurrency(totalSpent)}
                          </span>
                        </div>
                      </div>

                      {/* Recent items issued */}
                      <div>
                        <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                          Materiais Fornecidos ao Setor ({itemsIssued.length} baixas):
                        </span>
                        {itemsIssued.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">
                            Nenhum material retirado por este setor no período.
                          </p>
                        ) : (
                          <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                            {itemsIssued.map(item => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-50 hover:bg-slate-100"
                              >
                                <div className="truncate max-w-[200px]">
                                  <span className="font-bold text-slate-800 mr-1.5">{item.material_name}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">({formatDate(item.date_time.slice(0, 10))})</span>
                                </div>
                                <div className="text-right font-mono shrink-0">
                                  <span className="font-semibold text-slate-700 mr-2">
                                    {item.quantity} {item.material_unit}
                                  </span>
                                  <span className="font-bold text-[#1a3a52]">
                                    {formatCurrency(item.total_price)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Technical Responsible Formal Endorsement Signatures in Reports */}
        <div className="pt-8 border-t border-slate-300 page-break-inside-avoid">
          <div className="grid grid-cols-2 gap-8 text-xs">
            <div className="text-center space-y-1">
              <div className="border-b border-slate-700 h-10 w-full mb-1" />
              <div className="font-bold text-[#1a3a52]">{settings.technical_responsible}</div>
              <div className="text-[11px] text-slate-600 font-medium">Responsável Técnico / Coordenação Operacional</div>
              <div className="text-[10px] text-slate-400 font-mono">{settings.technical_document}</div>
            </div>
            <div className="text-center space-y-1">
              <div className="border-b border-slate-700 h-10 w-full mb-1" />
              <div className="font-bold text-slate-900">Almoxarife / Controle de Patrimônio</div>
              <div className="text-[11px] text-slate-600 font-medium">Expedição e Auditoria de Inventário</div>
              <div className="text-[10px] text-slate-400">Data de Conferência: ____/____/________</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
