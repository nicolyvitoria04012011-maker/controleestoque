import React, { useState } from 'react';
import {
  Boxes,
  LayoutDashboard,
  Package,
  Building2,
  ArrowLeftRight,
  ClipboardList,
  FileBarChart,
  BookOpen,
  UserCheck,
  Menu,
  X,
  AlertTriangle,
  Clock,
  Edit3
} from 'lucide-react';
import { User, AppSettings } from '../types';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: User;
  onSwitchUser: (user: User) => void;
  criticalCount: number;
  pendingReqCount: number;
  settings: AppSettings;
  onEditSettings: () => void;
}

export const USERS_LIST: User[] = [
  { id: 1, username: 'admin', name: 'Nicoly Vitória', role: 'ADMIN' },
  { id: 2, username: 'almoxarife', name: 'Marcos Vinícius', role: 'ALMOXARIFE' },
  { id: 3, username: 'solicitante', name: 'Carlos Eduardo', role: 'SOLICITANTE', sector_id: 1, sector_name: 'Manutenção' },
];

export default function Navbar({
  currentTab,
  onSelectTab,
  currentUser,
  onSwitchUser,
  criticalCount,
  pendingReqCount,
  settings,
  onEditSettings
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Indicadores', icon: LayoutDashboard },
    { id: 'materials', label: 'Materiais', icon: Package, badge: criticalCount > 0 ? criticalCount : null, badgeColor: 'bg-amber-500' },
    { id: 'sectors', label: 'Setores', icon: Building2 },
    { id: 'movements', label: 'Movimentações', icon: ArrowLeftRight },
    { id: 'requisitions', label: 'Requisições', icon: ClipboardList, badge: pendingReqCount > 0 ? pendingReqCount : null, badgeColor: 'bg-amber-500' },
    { id: 'reports', label: 'Relatórios & Kardex', icon: FileBarChart },
    { id: 'best-practices', label: 'Boas Práticas', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#1a3a52] text-white shadow-md border-b border-[#2c5aa0]/40 no-print">
      {/* Top micro-bar for Technical Responsible & Quick Info */}
      <div className="bg-[#0f2438] text-xs text-slate-300 px-4 py-1.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium text-slate-200">{settings.company_name}</span>
          <span className="hidden sm:inline text-slate-500">|</span>
          <span className="hidden sm:inline text-slate-400">{settings.company_subtitle}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#1a3a52] hover:bg-[#2c5aa0]/70 transition-colors px-2.5 py-0.5 rounded text-amber-300 font-medium">
            <UserCheck className="w-3.5 h-3.5 text-[#f4c430]" />
            <span>Resp. Técnico: <strong className="text-white">{settings.technical_responsible}</strong></span>
            <button
              id="btn-edit-responsible-top"
              onClick={onEditSettings}
              className="text-xs text-amber-200 hover:text-white underline ml-1 cursor-pointer flex items-center gap-0.5"
              title="Clique para alterar o nome do Responsável Técnico"
            >
              <Edit3 className="w-3 h-3" />
              <span>Editar</span>
            </button>
          </div>

          <div className="relative">
            <button
              id="btn-user-switcher"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-1.5 text-slate-200 hover:text-white bg-white/10 hover:bg-white/15 px-2 py-0.5 rounded transition"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{currentUser.name}</span>
              <span className="text-[10px] bg-[#f4c430] text-[#0f2438] font-bold px-1.5 rounded uppercase tracking-wider">
                {currentUser.role}
              </span>
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-1 w-56 bg-white text-slate-800 rounded-lg shadow-xl border border-slate-200 py-1.5 z-50">
                <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-600 border-b border-slate-100">
                  Alternar Usuário
                </div>
                {USERS_LIST.map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      onSwitchUser(u);
                      setUserDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-100 transition ${
                      currentUser.id === u.id ? 'bg-blue-50 font-semibold text-[#1a3a52]' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-[10px] text-slate-600">{u.role === 'ADMIN' ? 'Gestão Total' : u.role === 'ALMOXARIFE' ? 'Almoxarife' : 'Solicitante'}</div>
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                      {u.role}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
            <div className="w-10 h-10 rounded-lg bg-[#2c5aa0] flex items-center justify-center border border-white/20 shadow-inner">
              <Boxes className="w-6 h-6 text-[#f4c430]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">ESTOQUE</span>
                <span className="text-xs font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#f4c430] text-[#1a3a52]">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-300 tracking-wide font-normal">Controle de Estoques & Suprimentos</p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => onSelectTab(item.id)}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#2c5aa0] text-white shadow-sm'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#f4c430]' : 'text-slate-300'}`} />
                  <span>{item.label}</span>
                  {item.badge !== null && item.badge !== undefined && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full text-slate-950 ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#f4c430] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center gap-2">
            {criticalCount > 0 && (
              <span className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs px-2 py-1 rounded">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>{criticalCount}</span>
              </span>
            )}
            <button
              id="btn-mobile-menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-300 hover:text-white hover:bg-white/10"
              aria-label="Abrir Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#162f44] border-t border-white/10 px-4 pt-2 pb-4 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-item-${item.id}`}
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition ${
                  isActive ? 'bg-[#2c5aa0] text-white' : 'text-slate-200 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#f4c430]' : 'text-slate-300'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && item.badge !== undefined && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-slate-950 ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
