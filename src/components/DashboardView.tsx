import React from 'react';
import {
  DollarSign,
  Package,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Clock,
  ArrowRight,
  CheckCircle2,
  PieChart as PieIcon,
  BarChart3,
  Layers
} from 'lucide-react';
import { DashboardKpis, Material } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';

interface DashboardViewProps {
  kpis: DashboardKpis | null;
  loading: boolean;
  onNavigate: (tab: string) => void;
  onSelectMaterialKardex: (materialId: number) => void;
  onOpenNewMovement: (type?: 'ENTRADA' | 'SAIDA') => void;
  onOpenNewRequisition: () => void;
}

export default function DashboardView({
  kpis,
  loading,
  onNavigate,
  onSelectMaterialKardex,
  onOpenNewMovement,
  onOpenNewRequisition,
}: DashboardViewProps) {
  // If explicitly loading and no data yet, show loading spinner
  if (loading && !kpis) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-[#2c5aa0] mb-3" />
        <p className="text-sm font-medium">Carregando indicadores operacionais...</p>
      </div>
    );
  }

  // Safe KPI defaults so rendering never throws
  const totalInventoryValue = kpis?.totalInventoryValue ?? 0;
  const totalMaterialsCount = kpis?.totalMaterialsCount ?? 0;
  const criticalItemsCount = kpis?.criticalItemsCount ?? 0;
  const pendingRequisitionsCount = kpis?.pendingRequisitionsCount ?? 0;
  const stockTurnoverRate = kpis?.stockTurnoverRate ?? 0;
  const criticalMaterials = kpis?.criticalMaterials ?? [];
  const topMovedMaterials = kpis?.topMovedMaterials ?? [];
  const monthlyMovements = kpis?.monthlyMovements ?? [];
  const sectorConsumption = kpis?.sectorConsumption ?? [];
  const abcClassification = kpis?.abcClassification ?? {
    classA: { count: 0, totalValue: 0, percentageValue: 0 },
    classB: { count: 0, totalValue: 0, percentageValue: 0 },
    classC: { count: 0, totalValue: 0, percentageValue: 0 },
    items: []
  };

  // Find max monthly value for chart scale
  const maxMonthlyVal = Math.max(
    ...monthlyMovements.map(m => Math.max(m?.entradas_val || 0, m?.saidas_val || 0)),
    1000
  );

  // Find max sector value for horizontal bars
  const maxSectorVal = Math.max(...sectorConsumption.map(s => s?.total_value || 0), 100);

  // Find max top moved item quantity
  const maxTopMovedQty = Math.max(...topMovedMaterials.map(m => m?.total_quantity || 0), 1);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#1a3a52] tracking-tight flex items-center gap-2">
            <span>Painel de Controle & Indicadores de Estoque</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Tempo Real
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitoramento de saldos patrimoniais, fluxo de requisições, níveis críticos e giro de materiais.
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            id="btn-quick-entrada"
            onClick={() => onOpenNewMovement('ENTRADA')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition"
          >
            <ArrowDownRight className="w-4 h-4 text-emerald-600" />
            <span>Registrar Entrada</span>
          </button>
          <button
            id="btn-quick-saida"
            onClick={() => onOpenNewMovement('SAIDA')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition"
          >
            <ArrowUpRight className="w-4 h-4 text-[#2c5aa0]" />
            <span>Registrar Saída</span>
          </button>
          <button
            id="btn-quick-requisicao"
            onClick={onOpenNewRequisition}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#0f2438] bg-[#f4c430] hover:bg-[#e0a800] rounded-lg transition shadow-xs"
          >
            <Clock className="w-4 h-4 text-[#0f2438]" />
            <span>Nova Requisição</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (4 Principal Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Valor Total do Estoque */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Valor Total do Estoque</span>
            <div className="p-2 rounded-lg bg-[#1a3a52]/10 text-[#1a3a52]">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#1a3a52] tracking-tight">
              {formatCurrency(totalInventoryValue)}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
              <span>{totalMaterialsCount} itens cadastrados</span>
              <span>•</span>
              <span className="text-emerald-700 font-medium">Ativo Operacional</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1a3a52]" />
        </div>

        {/* KPI 2: Itens em Nível Crítico */}
        <div className={`bg-white rounded-xl p-5 border shadow-xs relative overflow-hidden ${
          criticalItemsCount > 0 ? 'border-amber-300 ring-1 ring-amber-200/50' : 'border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Estoque Crítico</span>
            <div className={`p-2 rounded-lg ${criticalItemsCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-black tracking-tight ${criticalItemsCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
              {criticalItemsCount} {criticalItemsCount === 1 ? 'material' : 'materiais'}
            </div>
            <div className="flex items-center justify-between text-[11px] mt-1">
              <span className="text-slate-500">Abaixo do estoque mínimo</span>
              {criticalItemsCount > 0 && (
                <button
                  onClick={() => onNavigate('materials')}
                  className="text-amber-700 font-bold hover:underline flex items-center gap-0.5"
                >
                  Ver itens <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
          <div className={`absolute bottom-0 left-0 right-0 h-1 ${criticalItemsCount > 0 ? 'bg-[#f4c430]' : 'bg-slate-300'}`} />
        </div>

        {/* KPI 3: Taxa de Rotatividade / Giro de Estoque */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Taxa de Rotatividade (Giro)</span>
            <div className="p-2 rounded-lg bg-blue-100 text-[#2c5aa0]">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#1a3a52] tracking-tight">
              {stockTurnoverRate}x
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
              <span>Saídas acumuladas / Saldo Médio</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#2c5aa0]" />
        </div>

        {/* KPI 4: Requisições Pendentes */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Requisições Pendentes</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#0f2438] tracking-tight">
              {pendingRequisitionsCount}
            </div>
            <div className="flex items-center justify-between text-[11px] mt-1">
              <span className="text-slate-500">Aguardando atendimento</span>
              <button
                onClick={() => onNavigate('requisitions')}
                className="text-[#2c5aa0] font-bold hover:underline flex items-center gap-0.5"
              >
                Atender <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-400" />
        </div>
      </div>

      {/* Row: Curva ABC and Alerta de Estoque Crítico */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Curva ABC (Análise de Pareto 80/15/5) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#1a3a52] text-[#f4c430] rounded-lg">
                <PieIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1a3a52]">Classificação Curva ABC</h3>
                <p className="text-[11px] text-slate-500">Concentração de valor patrimonial</p>
              </div>
            </div>
            <span className="text-[10px] bg-slate-100 font-bold px-2 py-0.5 rounded text-slate-600">Pareto</span>
          </div>

          {/* Visual Progress Bar */}
          <div className="space-y-1">
            <div className="h-4 w-full bg-slate-100 rounded-full flex overflow-hidden">
              <div
                style={{ width: `${abcClassification?.classA?.percentageValue || 0}%` }}
                className="bg-[#1a3a52] h-full"
                title={`Classe A: ${abcClassification?.classA?.percentageValue || 0}% do valor`}
              />
              <div
                style={{ width: `${abcClassification?.classB?.percentageValue || 0}%` }}
                className="bg-[#2c5aa0] h-full"
                title={`Classe B: ${abcClassification?.classB?.percentageValue || 0}% do valor`}
              />
              <div
                style={{ width: `${abcClassification?.classC?.percentageValue || 0}%` }}
                className="bg-[#f4c430] h-full"
                title={`Classe C: ${abcClassification?.classC?.percentageValue || 0}% do valor`}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 px-1 font-mono">
              <span>0%</span>
              <span>80%</span>
              <span>95%</span>
              <span>100%</span>
            </div>
          </div>

          {/* ABC Legend & Details */}
          <div className="space-y-2.5 pt-1">
            {/* Classe A */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-md bg-[#1a3a52] text-white flex items-center justify-center font-bold text-xs">
                  A
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-800">Itens Estratégicos</div>
                  <div className="text-[11px] text-slate-500">{abcClassification?.classA?.count ?? 0} materiais cadastrados</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-[#1a3a52]">
                  {formatCurrency(abcClassification?.classA?.totalValue || 0)}
                </div>
                <div className="text-[10px] text-emerald-600 font-bold">
                  {abcClassification?.classA?.percentageValue ?? 0}% do valor
                </div>
              </div>
            </div>

            {/* Classe B */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-md bg-[#2c5aa0] text-white flex items-center justify-center font-bold text-xs">
                  B
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-800">Itens Intermediários</div>
                  <div className="text-[11px] text-slate-500">{abcClassification?.classB?.count ?? 0} materiais cadastrados</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-[#2c5aa0]">
                  {formatCurrency(abcClassification?.classB?.totalValue || 0)}
                </div>
                <div className="text-[10px] text-blue-600 font-bold">
                  {abcClassification?.classB?.percentageValue ?? 0}% do valor
                </div>
              </div>
            </div>

            {/* Classe C */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-md bg-[#f4c430] text-[#0f2438] flex items-center justify-center font-bold text-xs">
                  C
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-800">Itens de Apoio</div>
                  <div className="text-[11px] text-slate-500">{abcClassification?.classC?.count ?? 0} materiais cadastrados</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-700">
                  {formatCurrency(abcClassification?.classC?.totalValue || 0)}
                </div>
                <div className="text-[10px] text-amber-700 font-bold">
                  {abcClassification?.classC?.percentageValue ?? 0}% do valor
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 bg-blue-50/70 p-2.5 rounded-lg border border-blue-100 flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2c5aa0] shrink-0 mt-0.5" />
            <span>
              <strong>Dica de Gestão:</strong> Priorize inventários diários nos itens <strong>Classe A</strong>, que respondem pela maior parte do capital da empresa.
            </span>
          </div>
        </div>

        {/* Materiais Críticos / Alerta de Ruptura (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1a3a52]">Materiais em Alerta Crítico</h3>
                <p className="text-[11px] text-slate-500">Saldo atual igual ou inferior ao estoque mínimo estipulado</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('materials')}
              className="text-xs text-[#2c5aa0] hover:underline font-semibold flex items-center gap-1"
            >
              Catálogo Completo <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {criticalMaterials.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
              <p className="text-sm font-semibold text-slate-700">Estoque Saudável</p>
              <p className="text-xs text-slate-500">Nenhum material está atualmente abaixo do nível mínimo de segurança.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="py-2.5 px-3 font-semibold">Código / Material</th>
                    <th className="py-2.5 px-3 font-semibold">Localização</th>
                    <th className="py-2.5 px-2 text-center font-semibold">Estoque Atual</th>
                    <th className="py-2.5 px-2 text-center font-semibold">Mínimo</th>
                    <th className="py-2.5 px-3 font-semibold">Déficit</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {criticalMaterials.map(mat => {
                    const deficit = mat.min_quantity - mat.current_quantity;
                    const percent = Math.min(100, Math.round((mat.current_quantity / (mat.min_quantity || 1)) * 100));
                    return (
                      <tr key={mat.id} className="hover:bg-amber-50/40 transition">
                        <td className="py-2.5 px-3">
                          <div className="font-mono text-[11px] text-slate-500">{mat.code}</div>
                          <div className="font-semibold text-slate-900 truncate max-w-[200px]" title={mat.name}>
                            {mat.name}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                          {mat.location || 'Não informada'}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-xs">
                            {mat.current_quantity} {mat.unit}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-600">
                          {mat.min_quantity} {mat.unit}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${percent}%` }}
                                className="bg-amber-500 h-full rounded-full"
                              />
                            </div>
                            <span className="font-mono text-[11px] text-red-600 font-bold">
                              -{deficit > 0 ? deficit : 0} {mat.unit}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => onOpenNewMovement('ENTRADA')}
                            className="px-2 py-1 bg-[#1a3a52] hover:bg-[#2c5aa0] text-white text-[11px] font-bold rounded shadow-xs transition"
                            title="Lançar entrada de reposição para este item"
                          >
                            Repor
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Row: Materiais Mais Movimentados & Consumo por Setor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 6 Materiais Mais Movimentados (Saídas) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#2c5aa0]/10 text-[#2c5aa0] rounded-lg">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1a3a52]">Materiais Mais Movimentados (Saídas)</h3>
                <p className="text-[11px] text-slate-500">Itens com maior demanda física acumulada</p>
              </div>
            </div>
            <span className="text-[10px] bg-blue-50 text-[#2c5aa0] font-bold px-2 py-0.5 rounded">
              Giro Elevado
            </span>
          </div>

          <div className="space-y-3">
            {topMovedMaterials.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">Nenhuma saída registrada no histórico.</p>
            ) : (
              topMovedMaterials.map((item, idx) => {
                const barWidth = Math.max(8, Math.round((item.total_quantity / maxTopMovedQty) * 100));
                return (
                  <div key={item.material_id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate max-w-[280px]">
                        <span className="w-4 text-[11px] font-bold text-slate-400 font-mono">#{idx + 1}</span>
                        <span className="font-semibold text-slate-800 truncate" title={item.name}>
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">({item.code})</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-[#1a3a52]">{item.total_quantity} {item.unit}</span>
                        <span className="text-[11px] text-slate-400 ml-1.5">({formatCurrency(item.total_value)})</span>
                      </div>
                    </div>
                    {/* Visual Bar */}
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${barWidth}%` }}
                        className="h-full bg-gradient-to-r from-[#2c5aa0] to-[#f4c430] rounded-full"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Consumo Financeiro por Setor */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#1a3a52]/10 text-[#1a3a52] rounded-lg">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1a3a52]">Consumo por Setor / Centro de Custo</h3>
                <p className="text-[11px] text-slate-500">Alocação de suprimentos atendidos</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('sectors')}
              className="text-xs text-[#2c5aa0] hover:underline font-semibold"
            >
              Gerenciar Setores
            </button>
          </div>

          <div className="space-y-3">
            {sectorConsumption.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">Nenhum setor com saídas registradas.</p>
            ) : (
              sectorConsumption.slice(0, 5).map(sec => {
                const barWidth = Math.max(5, Math.round((sec.total_value / maxSectorVal) * 100));
                return (
                  <div key={sec.sector_id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono font-bold">
                          {sec.sector_code}
                        </span>
                        <span>{sec.sector_name}</span>
                      </div>
                      <span className="font-bold text-[#1a3a52]">{formatCurrency(sec.total_value)}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${barWidth}%` }}
                        className="h-full bg-[#1a3a52] rounded-full"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
