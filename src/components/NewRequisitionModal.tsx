import React, { useState } from 'react';
import { X, Plus, Trash2, Check, AlertCircle, ShoppingCart, Info } from 'lucide-react';
import { Material, Sector } from '../types';
import { formatCurrency } from '../utils/formatters';

interface NewRequisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: Material[];
  sectors: Sector[];
  currentUser: { name: string; sector_id?: number | null };
  onSave: (data: any) => Promise<void>;
}

interface ItemDraft {
  material_id: number;
  quantity: number;
  observation: string;
}

export default function NewRequisitionModal({
  isOpen,
  onClose,
  materials,
  sectors,
  currentUser,
  onSave,
}: NewRequisitionModalProps) {
  const [sectorId, setSectorId] = useState<number | ''>(currentUser.sector_id || (sectors[0]?.id || ''));
  const [requesterName, setRequesterName] = useState(currentUser.name || '');
  const [justification, setJustification] = useState('');
  const [items, setItems] = useState<ItemDraft[]>([
    { material_id: materials[0]?.id || 1, quantity: 1, observation: '' },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddItem = () => {
    const defaultMat = materials[0]?.id || 1;
    setItems([...items, { material_id: defaultMat, quantity: 1, observation: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: keyof ItemDraft, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const totalEstimatedValue = items.reduce((acc, it) => {
    const mat = materials.find(m => m.id === it.material_id);
    return acc + (it.quantity * (mat?.unit_price || 0));
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!sectorId) {
      setError('Selecione o setor solicitante.');
      return;
    }
    if (!requesterName.trim()) {
      setError('Informe o nome do solicitante.');
      return;
    }
    if (items.length === 0) {
      setError('Adicione pelo menos um item à requisição.');
      return;
    }

    // Check for invalid quantities
    for (let i = 0; i < items.length; i++) {
      if (items[i].quantity <= 0) {
        setError(`A quantidade do item #${i + 1} deve ser maior que zero.`);
        return;
      }
    }

    setSaving(true);
    try {
      await onSave({
        sector_id: Number(sectorId),
        requester_name: requesterName.trim(),
        justification: justification.trim(),
        items: items.map(it => ({
          material_id: Number(it.material_id),
          quantity: Number(it.quantity),
          observation: it.observation.trim(),
        })),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar requisição.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs no-print overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#1a3a52] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#f4c430]/20 text-[#f4c430] rounded-lg">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Nova Requisição de Material</h3>
              <p className="text-xs text-slate-300">Solicitação formal para liberação e baixa de almoxarifado</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Sector & Requester Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Setor Solicitante *
              </label>
              <select
                required
                id="select-req-sector"
                value={sectorId}
                onChange={e => setSectorId(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0] bg-white font-medium"
              >
                <option value="">Selecione o setor...</option>
                {sectors.map(s => (
                  <option key={s.id} value={s.id}>
                    [{s.code}] {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Nome do Solicitante *
              </label>
              <input
                type="text"
                required
                id="input-req-requester"
                value={requesterName}
                onChange={e => setRequesterName(e.target.value)}
                placeholder="Ex: Carlos Eduardo"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0]"
              />
            </div>
          </div>

          {/* Justification */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Finalidade / Justificativa *
            </label>
            <input
              type="text"
              required
              id="input-req-justification"
              value={justification}
              onChange={e => setJustification(e.target.value)}
              placeholder="Ex: Manutenção preventiva no sistema de exaustão do setor de solda"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0]"
            />
          </div>

          {/* Items Section */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Itens Solicitados ({items.length})
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-[#2c5aa0] hover:text-[#1a3a52] font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Outro Item
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {items.map((item, idx) => {
                const mat = materials.find(m => m.id === item.material_id);
                const hasStock = mat ? mat.current_quantity >= item.quantity : false;
                return (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 relative"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>Item #{idx + 1}</span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-red-500 hover:text-red-700 p-0.5 rounded"
                          title="Remover item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      {/* Material Select */}
                      <div className="sm:col-span-7">
                        <select
                          value={item.material_id}
                          onChange={e => handleItemChange(idx, 'material_id', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                        >
                          {materials.map(m => (
                            <option key={m.id} value={m.id}>
                              [{m.code}] {m.name} ({m.current_quantity} {m.unit} em estoque)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="sm:col-span-3">
                        <div className="relative">
                          <input
                            type="number"
                            step="any"
                            min="0.1"
                            required
                            value={item.quantity}
                            onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))}
                            placeholder="Qtd"
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md"
                          />
                          <span className="absolute right-2 top-1.5 text-[10px] text-slate-400 font-mono">
                            {mat?.unit || 'UN'}
                          </span>
                        </div>
                      </div>

                      {/* Total line item preview */}
                      <div className="sm:col-span-2 text-right self-center text-xs font-mono font-bold text-slate-700">
                        {formatCurrency(item.quantity * (mat?.unit_price || 0))}
                      </div>
                    </div>

                    {/* Stock indicator info */}
                    {mat && (
                      <div className="flex items-center justify-between text-[10px]">
                        <span className={`font-medium ${hasStock ? 'text-emerald-700' : 'text-amber-700 font-bold'}`}>
                          Saldo disponível: {mat.current_quantity} {mat.unit}
                          {!hasStock && ' (Atenção: Saldo insuficiente no estoque físico!)'}
                        </span>
                        <span className="text-slate-400 font-mono">
                          Unit: {formatCurrency(mat.unit_price)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total Value Summary */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600">Total Previsto da Requisição:</span>
            <span className="font-mono text-base font-black text-[#1a3a52]">
              {formatCurrency(totalEstimatedValue)}
            </span>
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              id="btn-create-requisition-submit"
              className="px-5 py-2 text-xs font-bold text-white bg-[#1a3a52] hover:bg-[#2c5aa0] rounded-lg flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-[#f4c430]" />
              <span>{saving ? 'Gerando Requisição...' : 'Criar Requisição Formal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
