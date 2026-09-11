import React, { useState } from 'react';
import { X, UserCheck, Check, Building, Phone, Mail } from 'lucide-react';
import { AppSettings } from '../types';

interface EditResponsibleModalProps {
  settings: AppSettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Partial<AppSettings>) => Promise<void>;
}

export default function EditResponsibleModal({ settings, isOpen, onClose, onSave }: EditResponsibleModalProps) {
  const [techResp, setTechResp] = useState(settings.technical_responsible);
  const [techDoc, setTechDoc] = useState(settings.technical_document);
  const [companyName, setCompanyName] = useState(settings.company_name);
  const [companySubtitle, setCompanySubtitle] = useState(settings.company_subtitle);
  const [contactPhone, setContactPhone] = useState(settings.contact_phone);
  const [contactEmail, setContactEmail] = useState(settings.contact_email);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!techResp.trim()) return;
    setSaving(true);
    try {
      await onSave({
        technical_responsible: techResp.trim(),
        technical_document: techDoc.trim(),
        company_name: companyName.trim(),
        company_subtitle: companySubtitle.trim(),
        contact_phone: contactPhone.trim(),
        contact_email: contactEmail.trim(),
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-[#1a3a52] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#f4c430]/20 text-[#f4c430] rounded-lg">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Configurar Responsável Técnico</h3>
              <p className="text-xs text-slate-300">Atualize os dados que constam no rodapé e nas requisições</p>
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
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-start gap-2">
            <span className="font-bold text-amber-700">Atenção:</span>
            <span>O nome do Responsável Técnico informado abaixo será impresso formalmente em todas as requisições de material, relatórios e no rodapé do sistema.</span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Nome do Responsável Técnico *
            </label>
            <input
              type="text"
              required
              id="input-tech-resp-name"
              value={techResp}
              onChange={e => setTechResp(e.target.value)}
              placeholder="Ex: Nicoly Vitória"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c5aa0] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Registro Profissional / Documento (Opcional)
            </label>
            <input
              type="text"
              value={techDoc}
              onChange={e => setTechDoc(e.target.value)}
              placeholder="Ex: CREA 104.829-SP / Matrícula 4092"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c5aa0] focus:border-transparent"
            />
          </div>

          <div className="pt-2 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" />
              <span>Dados da Organização</span>
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nome da Empresa / Almoxarifado</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Subtítulo / Unidade</label>
                <input
                  type="text"
                  value={companySubtitle}
                  onChange={e => setCompanySubtitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2c5aa0]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                Telefone de Contato
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" />
                E-mail Operacional
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>
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
              disabled={saving || !techResp.trim()}
              id="btn-save-responsible"
              className="px-5 py-2 text-xs font-bold text-white bg-[#1a3a52] hover:bg-[#2c5aa0] rounded-lg transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-[#f4c430]" />
              <span>{saving ? 'Salvando...' : 'Salvar Informações'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
