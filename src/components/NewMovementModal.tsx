import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, ArrowUpRight, Check, AlertCircle, Calendar } from 'lucide-react';
import { Material, Sector, MovementType } from '../types';
import { formatCurrency } from '../utils/formatters';

interface NewMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: MovementType;
  materials: Material[];
  sectors: Sector[];
  currentUser: { name: string };
  onSave: (data: any) => Promise<void>;
}

export default function NewMovementModal({
  isOpen,
  onClose,
  initialType = 'ENTRADA',
  materials,
  sectors,
  currentUser,
  onSave,
}: NewMovementModalProps) {
  const [type, setType] = useState<MovementType>(initialType);
  const [materialId, setMaterialId] = useState<number | ''>('');
  const [sectorId, setSectorId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number | string>('');
  const [unitPrice, setUnitPrice] = useState<number | string>('');
  const [reason, setReason] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [responsiblePerson, setResponsiblePerson] = useState(currentUser.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setType(initialType);
    const now = new Date();
    // format YYYY-MM-DDTHH:mm
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setDateTime(localIso);
    setQuantity('');
    setReason('');
    setDocumentNumber('');
    setError(null);
    setResponsiblePerson(currentUser.name);

    if (materials.length > 0 && !materialId) {
      setMaterialId(materials[0].id);
      setUnitPrice(materials[0].unit_price);
    }
  }, [isOpen, initialType]);

  const selectedMaterial = materials.find(m => m.id === Number(materialId));

  const handleMaterialChange = (id: number) => {
    setMaterialId(id);
    const mat = materials.find(m => m.id === id);
    if (mat) {
      setUnitPrice(mat.unit_price);
    }
  };

  const qtyNumber = Number(quantity) || 0;
  const currentStock = selectedMaterial ? selectedMaterial.current_quantity : 0;
  const projectedBalance =
    type === 'ENTRADA' ? currentStock + qtyNumber : currentStock - qtyNumber;
  const isInsufficient = type === 'SAIDA' && qtyNumber > currentStock;
  const totalPrice = qtyNumber * (Number(unitPrice) || 0);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!materialId) {
      setError('Selecione um material.');
      return;
    }
    if (qtyNumber <= 0) {
      setError('A quantidade deve ser maior que zero.');
      return;
    }
    if (type === 'SAIDA' && isInsufficient) {
      setError(`Saldo insuficiente! Estoque atual: ${currentStock} ${selectedMaterial?.unit}, solicitado: ${qtyNumber} ${selectedMaterial?.unit}`);
      return;
    }
    if (type === 'SAIDA' && !sectorId) {
      setError('Selecione o setor de destino responsável pela saída.');
      return;
    }
    if (!reason.trim()) {
      setError('Informe o motivo ou justificativa da movimentação.');
      return;
    }

    setSaving(true);
    try {
      const formattedDate = dateTime.replace('T', ' ') + ':00';
      await onSave({
        type,
        material_id: Number(materialId),
        sector_id: sectorId ? Number(sectorId) : null,
        quantity: qtyNumber,
        unit_price: Number(unitPrice) || selectedMaterial?.unit_price || 0,
        reason: reason.trim(),
        document_number: documentNumber.trim(),
        responsible_person: responsiblePerson.trim(),
        date_time: formattedDate,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar movimentação.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between text-white ${
          type === 'ENTRADA' ? 'bg-[#1a3a52]' : 'bg-[#0f2438]'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${type === 'ENTRADA' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-[#f4c430]'}`}>
              {type === 'ENTRADA' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base">
                {type === 'ENTRADA' ? 'Registrar Entrada de Material' : 'Registrar Saída de Material'}
              </h3>
              <p className="text-xs text-slate-300">
                {type === 'ENTRADA' ? 'Adição de saldo por compra, reposição ou devolução' : 'Baixa de estoque por atendimento, consumo ou descarte'}
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

        {/* Type Switcher Tab */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            type="button"
            onClick={() => setType('ENTRADA')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-2 transition ${
              type === 'ENTRADA'
                ? 'bg-white text-emerald-800 border-b-2 border-emerald-600 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ArrowDownRight className="w-4 h-4 text-emerald-600" />
            <span>ENTRADA (Reposição / Compra)</span>
          </button>
          <button
            type="button"
            onClick={() => setType('SAIDA')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-2 transition ${
              type === 'SAIDA'
                ? 'bg-white text-blue-900 border-b-2 border-[#2c5aa0] shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-[#2c5aa0]" />
            <span>SAÍDA (Consumo / Baixa)</span>
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

          {/* Material Select */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Material a Movimentar *
            </label>
            <select
              required
              id="select-movement-material"
              value={materialId}
              onChange={e => handleMaterialChange(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0] bg-white font-medium"
            >
              <option value="">Selecione um material...</option>
              {materials.map(m => (
                <option key={m.id} value={m.id}>
                  [{m.code}] {m.name} — Saldo: {m.current_quantity} {m.unit}
                </option>
              ))}
            </select>
          </div>

          {/* Live Balance Calculator Box */}
          {selectedMaterial && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-600">
                <span>Saldo Físico Atual:</span>
                <span className="font-mono font-bold text-slate-900">
                  {currentStock} {selectedMaterial.unit}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Movimento ({type}):</span>
                <span className={`font-mono font-bold ${type === 'ENTRADA' ? 'text-emerald-600' : 'text-blue-700'}`}>
                  {type === 'ENTRADA' ? '+' : '-'}{qtyNumber || 0} {selectedMaterial.unit}
                </span>
              </div>
              <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between font-bold">
                <span className="text-slate-700">Saldo Resultante Calculado:</span>
                <span className={`font-mono text-sm ${
                  isInsufficient ? 'text-red-600 bg-red-50 px-2 py-0.5 rounded' : 'text-[#1a3a52]'
                }`}>
                  {projectedBalance} {selectedMaterial.unit}
                </span>
              </div>
              {isInsufficient && (
                <div className="text-[11px] text-red-600 font-medium">
                  Aviso: A quantidade requisitada excede o saldo disponível em estoque!
                </div>
              )}
            </div>
          )}

          {/* Quantity & Unit Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Quantidade *
              </label>
              <input
                type="number"
                step="any"
                min="0.001"
                required
                id="input-movement-quantity"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="Ex: 10"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Valor Unitário (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={unitPrice}
                onChange={e => setUnitPrice(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0]"
              />
            </div>
          </div>

          {/* Total Movement Value Preview */}
          <div className="text-right text-xs text-slate-500 font-medium">
            Valor Total do Movimento: <strong className="text-[#1a3a52] font-mono">{formatCurrency(totalPrice)}</strong>
          </div>

          {/* Sector (Required for Saída, optional for Entrada) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                {type === 'SAIDA' ? 'Setor Destino *' : 'Setor de Origem / Destino'}
              </label>
              <select
                value={sectorId}
                onChange={e => setSectorId(e.target.value ? Number(e.target.value) : '')}
                required={type === 'SAIDA'}
                id="select-movement-sector"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0] bg-white"
              >
                <option value="">{type === 'SAIDA' ? 'Selecione o setor...' : 'Almoxarifado / Fornecedor'}</option>
                {sectors.map(s => (
                  <option key={s.id} value={s.id}>
                    [{s.code}] {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Nº Documento / NF / REQ
              </label>
              <input
                type="text"
                value={documentNumber}
                onChange={e => setDocumentNumber(e.target.value)}
                placeholder="Ex: NF-12948 ou REQ-04"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0]"
              />
            </div>
          </div>

          {/* Date / Time & Operator */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Data & Hora *
              </label>
              <input
                type="datetime-local"
                required
                value={dateTime}
                onChange={e => setDateTime(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Operador Responsável *
              </label>
              <input
                type="text"
                required
                value={responsiblePerson}
                onChange={e => setResponsiblePerson(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0]"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Motivo / Descrição da Operação *
            </label>
            <input
              type="text"
              required
              id="input-movement-reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={type === 'ENTRADA' ? 'Ex: Aquisição emergencial de EPIs conforme pedido #902' : 'Ex: Atendimento preventiva no compressor de ar #01'}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0]"
            />
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
              disabled={saving || (type === 'SAIDA' && isInsufficient)}
              id="btn-confirm-movement"
              className={`px-5 py-2 text-xs font-bold text-white rounded-lg transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 ${
                type === 'ENTRADA' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-[#1a3a52] hover:bg-[#2c5aa0]'
              }`}
            >
              <Check className="w-4 h-4 text-[#f4c430]" />
              <span>{saving ? 'Registrando...' : 'Confirmar Movimentação'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
