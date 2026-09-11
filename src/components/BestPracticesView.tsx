import React, { useState } from 'react';
import {
  Lightbulb,
  CheckSquare,
  Calculator,
  ShieldCheck,
  TrendingDown,
  Sparkles,
  Layers,
  ArrowRight,
  BookOpen,
  Award
} from 'lucide-react';
import { AppSettings } from '../types';

interface BestPracticesViewProps {
  settings: AppSettings;
}

export default function BestPracticesView({ settings }: BestPracticesViewProps) {
  // Interactive Reorder Point Calculator
  const [dailyDemand, setDailyDemand] = useState<number>(10);
  const [leadTimeDays, setLeadTimeDays] = useState<number>(7);
  const [safetyStock, setSafetyStock] = useState<number>(20);

  const reorderPoint = Math.round((dailyDemand * leadTimeDays) + safetyStock);

  // 5S Checklist state
  const [checklist, setChecklist] = useState<{ [key: string]: boolean }>({
    seiri: true,
    seiton: true,
    seiso: false,
    seiketsu: true,
    shitsuke: false,
  });

  const toggleCheck = (key: string) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#1a3a52] tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#2c5aa0]" />
            <span>Manual de Boas Práticas em Gestão de Estoques</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Padrões operacionais, metodologias consolidadas (Curva ABC, PEPS/FIFO, Ponto de Pedido) e metodologia 5S.
          </p>
        </div>

        <div className="px-3 py-1.5 bg-[#1a3a52]/5 rounded-lg border border-[#2c5aa0]/20 text-xs text-[#1a3a52] font-semibold flex items-center gap-1.5">
          <Award className="w-4 h-4 text-[#f4c430]" />
          <span>Homologado por: <strong>{settings.technical_responsible}</strong></span>
        </div>
      </div>

      {/* Grid of Methodologies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Curva ABC */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 text-[#1a3a52]">
            <div className="p-2 bg-[#1a3a52]/10 rounded-lg text-[#1a3a52]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Classificação e Curva ABC de Materiais</h3>
              <span className="text-[11px] text-slate-500">Princípio de Pareto (80 / 20)</span>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            A Curva ABC estratifica o inventário pelo seu impacto financeiro sobre o capital imobilizado. Isso permite priorizar o rigor do controle onde reside a maior parte do investimento:
          </p>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
              <strong className="text-emerald-900 block font-bold">Classe A (Alta Criticidade Financeira):</strong>
              <span className="text-emerald-800">
                Aproximadamente 20% dos itens que correspondem a até 80% do valor total do estoque. Requerem auditorias cíclicas semanais, controle rígido de requisições e reposição Just-in-Time.
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
              <strong className="text-amber-900 block font-bold">Classe B (Média Criticidade):</strong>
              <span className="text-amber-800">
                Cerca de 30% dos itens que representam 15% do valor financeiro. Controle moderado com conferências mensais.
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <strong className="text-slate-800 block font-bold">Classe C (Baixa Criticidade Financeira):</strong>
              <span className="text-slate-700">
                Metade dos itens (50%) que compõem apenas 5% do valor total. Permitem estoques de segurança maiores para reduzir custo transacional de compras.
              </span>
            </div>
          </div>
        </div>

        {/* PEPS / FIFO */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 text-[#1a3a52]">
            <div className="p-2 bg-[#2c5aa0]/10 rounded-lg text-[#2c5aa0]">
              <ArrowRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Método PEPS (FIFO) & Rotação de Lotes</h3>
              <span className="text-[11px] text-slate-500">Primeiro que Entra, Primeiro que Sai</span>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Garante que os materiais mais antigos sejam dispensados prioritariamente, evitando obsolescência técnica, deterioração por prazo de validade (especialmente óleos, tintas, resinas e borrachas) e garantindo custos contábeis reais.
          </p>
          <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside">
            <li><strong>Disposição Física Gravitacional:</strong> Abastecer prateleiras por trás e retirar pela frente.</li>
            <li><strong>Etiquetagem Visual de Lote:</strong> Identificar data de entrada nos invólucros para fácil inspeção do conferente.</li>
            <li><strong>Controle de Validade de EPIs:</strong> Descarte rigoroso de capacetes, cintos e filtros com prazo expirado.</li>
          </ul>
        </div>
      </div>

      {/* Interactive Tool: Ponto de Pedido (PP) & Estoque Mínimo */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 text-[#1a3a52]">
          <div className="p-2 bg-[#f4c430]/20 rounded-lg text-[#0f2438]">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Simulador de Ponto de Pedido (PP) & Estoque Mínimo</h3>
            <p className="text-xs text-slate-500">
              Fórmula técnica: <code>Ponto de Pedido = (Consumo Médio Diário × Lead Time de Compra) + Estoque de Segurança</code>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Consumo Médio Diário (un/dia)
            </label>
            <input
              type="number"
              min="1"
              value={dailyDemand}
              onChange={e => setDailyDemand(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Lead Time / Prazo Fornecedor (dias)
            </label>
            <input
              type="number"
              min="1"
              value={leadTimeDays}
              onChange={e => setLeadTimeDays(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Estoque de Segurança Recomendado
            </label>
            <input
              type="number"
              min="0"
              value={safetyStock}
              onChange={e => setSafetyStock(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0]"
            />
          </div>

          <div className="bg-[#1a3a52] text-white p-3.5 rounded-lg flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-[#f4c430] tracking-wider">
              Ponto de Reposição Calculado:
            </span>
            <div className="text-2xl font-black font-mono">
              {reorderPoint} <span className="text-xs font-normal text-slate-300">unidades</span>
            </div>
            <span className="text-[10px] text-slate-300">
              Emitir pedido de compra quando o estoque atingir este patamar.
            </span>
          </div>
        </div>
      </div>

      {/* 5S no Almoxarifado Checklist */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-[#1a3a52]">
          <Sparkles className="w-5 h-5 text-[#f4c430]" />
          <h3 className="font-bold text-sm">Programa 5S Aplicado à Organização do Almoxarifado</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          {/* Seiri */}
          <div
            onClick={() => toggleCheck('seiri')}
            className={`p-3.5 rounded-lg border cursor-pointer transition select-none ${
              checklist.seiri
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div className="flex items-center justify-between font-bold mb-1">
              <span>1. Seiri (Utilização)</span>
              <CheckSquare className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-[11px] leading-snug">
              Descarte de itens obsoletos, sucatas e materiais danificados sem reparo viável.
            </p>
          </div>

          {/* Seiton */}
          <div
            onClick={() => toggleCheck('seiton')}
            className={`p-3.5 rounded-lg border cursor-pointer transition select-none ${
              checklist.seiton
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div className="flex items-center justify-between font-bold mb-1">
              <span>2. Seiton (Organização)</span>
              <CheckSquare className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-[11px] leading-snug">
              Um lugar para cada coisa e cada coisa em seu devido lugar. Ruas, prateleiras e gaveteiros etiquetados.
            </p>
          </div>

          {/* Seiso */}
          <div
            onClick={() => toggleCheck('seiso')}
            className={`p-3.5 rounded-lg border cursor-pointer transition select-none ${
              checklist.seiso
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div className="flex items-center justify-between font-bold mb-1">
              <span>3. Seiso (Limpeza)</span>
              <CheckSquare className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-[11px] leading-snug">
              Ambiente desimpedido de resíduos, sem vazamento de fluídos ou poeira excessiva sobre componentes elétricos.
            </p>
          </div>

          {/* Seiketsu */}
          <div
            onClick={() => toggleCheck('seiketsu')}
            className={`p-3.5 rounded-lg border cursor-pointer transition select-none ${
              checklist.seiketsu
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div className="flex items-center justify-between font-bold mb-1">
              <span>4. Seiketsu (Padronização)</span>
              <CheckSquare className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-[11px] leading-snug">
              Procedimentos operacionais padrão (POP) para recebimento, conferência de NFs e expedição de requisições.
            </p>
          </div>

          {/* Shitsuke */}
          <div
            onClick={() => toggleCheck('shitsuke')}
            className={`p-3.5 rounded-lg border cursor-pointer transition select-none ${
              checklist.shitsuke
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div className="flex items-center justify-between font-bold mb-1">
              <span>5. Shitsuke (Disciplina)</span>
              <CheckSquare className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-[11px] leading-snug">
              Cumprimento rigoroso das rotinas de registro em sistema sem exceções ou movimentações não lançadas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
