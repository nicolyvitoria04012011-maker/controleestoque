import React from 'react';
import { UserCheck, ShieldCheck, Database, Edit3, Phone, Mail, Award } from 'lucide-react';
import { AppSettings } from '../types';

interface FooterProps {
  settings: AppSettings;
  onEditSettings: () => void;
}

export default function Footer({ settings, onEditSettings }: FooterProps) {
  return (
    <footer className="bg-[#0f2438] text-slate-300 border-t border-slate-800 text-xs py-8 mt-12 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-800/80">
          {/* Col 1: System and Company */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-white">{settings.company_name}</span>
              <span className="text-[10px] bg-[#f4c430] text-[#0f2438] font-bold px-1.5 py-0.5 rounded">
                OPERACIONAL
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              {settings.company_subtitle}. Controle patrimonial, gestão de níveis de segurança e rastreabilidade total de materiais.
            </p>
            <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>SQLite Relacional Persistente</span>
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#f4c430]" />
                <span>Auditoria & Kardex</span>
              </span>
            </div>
          </div>

          {/* Col 2: Technical Responsible (PROMINENT REQUIREMENT) */}
          <div className="bg-[#1a3a52]/60 rounded-xl p-4 border border-[#2c5aa0]/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#f4c430] flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                Responsável Técnico Homologado
              </span>
              <button
                id="btn-footer-edit-responsible"
                onClick={onEditSettings}
                className="text-[11px] text-amber-300 hover:text-white flex items-center gap-1 transition"
                title="Editar Nome do Responsável Técnico"
              >
                <Edit3 className="w-3 h-3" />
                <span>Alterar</span>
              </button>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="w-9 h-9 rounded-full bg-[#f4c430] text-[#0f2438] flex items-center justify-center font-bold text-sm shadow-md">
                <UserCheck className="w-5 h-5 text-[#0f2438]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-wide">
                  {settings.technical_responsible || 'Nicoly Vitória'}
                </h4>
                <p className="text-[11px] text-slate-300">
                  {settings.technical_document || 'Gestão e Supervisão de Almoxarifado'}
                </p>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 leading-tight pt-1">
              Responsável técnico designado para validação operacional de saldos, aprovação de relatórios oficiais e auditorias periódicas de estoque.
            </p>
          </div>

          {/* Col 3: Contact and Support */}
          <div className="space-y-2">
            <h4 className="font-semibold text-xs text-white uppercase tracking-wider">Suporte Operacional</h4>
            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#f4c430]" />
                <span>{settings.contact_email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#f4c430]" />
                <span>{settings.contact_phone}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 pt-2">
              Em caso de divergências físicas no inventário, comunique imediatamente a supervisão do almoxarifado antes de novas baixas.
            </p>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <div>
            © {new Date().getFullYear()} Sistema de Controle de Estoques • Versão 2.4 Production-Ready
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Desenvolvido com padrão corporativo industrial</span>
            <span>•</span>
            <button
              onClick={onEditSettings}
              className="text-[#f4c430] hover:underline"
            >
              Configurações do Sistema
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
