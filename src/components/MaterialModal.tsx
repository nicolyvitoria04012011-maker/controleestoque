import React, { useState, useEffect } from 'react';
import { X, Package, Check } from 'lucide-react';
import { Material, UnitOfMeasure } from '../types';

interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialToEdit: Material | null;
  onSave: (data: any) => Promise<void>;
  existingCategories: string[];
}

const UNITS: UnitOfMeasure[] = ['UN', 'CX', 'KG', 'M', 'L', 'PC', 'PAR', 'ROLO', 'PACOTE'];

const DEFAULT_CATEGORIES = [
  'EPIs',
  'Ferramentas',
  'Elétrica',
  'Mecânica & Hidráulica',
  'Consumíveis Industriais',
  'Limpeza & Higiene',
  'Escritório & TI',
  'Outros'
];

export default function MaterialModal({
  isOpen,
  onClose,
  materialToEdit,
  onSave,
  existingCategories,
}: MaterialModalProps) {
  const isEditing = !!materialToEdit;

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('EPIs');
  const [customCategory, setCustomCategory] = useState('');
  const [unit, setUnit] = useState<UnitOfMeasure>('UN');
  const [currentQuantity, setCurrentQuantity] = useState<number | string>(0);
  const [unitPrice, setUnitPrice] = useState<number | string>(0);
  const [minQuantity, setMinQuantity] = useState<number | string>(5);
  const [maxQuantity, setMaxQuantity] = useState<number | string>(100);
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = Array.from(new Set([...DEFAULT_CATEGORIES, ...existingCategories]));

  useEffect(() => {
    if (materialToEdit) {
      setCode(materialToEdit.code);
      setName(materialToEdit.name);
      setCategory(materialToEdit.category);
      setUnit(materialToEdit.unit);
      setCurrentQuantity(materialToEdit.current_quantity);
      setUnitPrice(materialToEdit.unit_price);
      setMinQuantity(materialToEdit.min_quantity);
      setMaxQuantity(materialToEdit.max_quantity);
      setLocation(materialToEdit.location || '');
    } else {
      setCode('');
      setName('');
      setCategory('EPIs');
      setUnit('UN');
      setCurrentQuantity(0);
      setUnitPrice(0);
      setMinQuantity(5);
      setMaxQuantity(100);
      setLocation('');
    }
    setError(null);
  }, [materialToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError('O código do material é obrigatório.');
      return;
    }
    if (!name.trim()) {
      setError('O nome do material é obrigatório.');
      return;
    }

    const finalCategory = category === 'NOVA' ? customCategory.trim() || 'Geral' : category;

    setSaving(true);
    try {
      await onSave({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        category: finalCategory,
        unit,
        current_quantity: Number(currentQuantity) || 0,
        unit_price: Number(unitPrice) || 0,
        min_quantity: Number(minQuantity) || 0,
        max_quantity: Number(maxQuantity) || 0,
        location: location.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar material.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#1a3a52] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#f4c430]/20 text-[#f4c430] rounded-lg">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {isEditing ? 'Editar Material' : 'Cadastrar Novo Material'}
              </h3>
              <p className="text-xs text-slate-300">
                {isEditing ? 'Atualize as especificações e parâmetros de estoque' : 'Preencha os dados cadastrais do item'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Código *
              </label>
              <input
                type="text"
                required
                id="input-material-code"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Ex: EPI-010"
                className="w-full px-3 py-2 text-xs font-mono font-bold uppercase border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0] focus:border-transparent"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Nome / Descrição do Material *
              </label>
              <input
                type="text"
                required
                id="input-material-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Luva de Raspa Cano Longo"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0] focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Categoria *
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0]"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="NOVA">+ Nova Categoria...</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Unidade de Medida *
              </label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value as UnitOfMeasure)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0]"
              >
                {UNITS.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {category === 'NOVA' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nome da Nova Categoria</label>
              <input
                type="text"
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
                placeholder="Ex: Reagentes Químicos"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          )}

          {/* Pricing & Initial Balance */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Valor Unitário (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                id="input-material-price"
                value={unitPrice}
                onChange={e => setUnitPrice(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Quantidade Atual {isEditing ? '(Apenas Consulta)' : '(Saldo Inicial)'}
              </label>
              <input
                type="number"
                step="any"
                min="0"
                disabled={isEditing}
                id="input-material-qty"
                value={currentQuantity}
                onChange={e => setCurrentQuantity(e.target.value)}
                className={`w-full px-3 py-2 text-xs border border-slate-300 rounded-lg ${
                  isEditing ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-[#2c5aa0]'
                }`}
              />
              {isEditing && (
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Para alterar o saldo, utilize a aba de Movimentações (Entrada / Saída).
                </p>
              )}
            </div>
          </div>

          {/* Inventory Safety Levels */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Estoque Mínimo (Alerta Crítico)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={minQuantity}
                onChange={e => setMinQuantity(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Estoque Máximo
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={maxQuantity}
                onChange={e => setMaxQuantity(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Localização Física no Almoxarifado
            </label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Ex: Rua B - Prateleira 03 - Caixa 12"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0]"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              id="btn-submit-material"
              className="px-5 py-2 text-xs font-bold text-white bg-[#1a3a52] hover:bg-[#2c5aa0] rounded-lg transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-[#f4c430]" />
              <span>{saving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Cadastrar Material'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
