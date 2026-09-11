import React, { useState, useEffect, useCallback } from 'react';
import { AppTab, Material, Movement, Sector, Requisition, AppSettings, DashboardStats, User } from './types';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DashboardView from './components/DashboardView';
import MaterialsView from './components/MaterialsView';
import SectorsView from './components/SectorsView';
import MovementsView from './components/MovementsView';
import RequisitionsView from './components/RequisitionsView';
import ReportsView from './components/ReportsView';
import BestPracticesView from './components/BestPracticesView';
import EditResponsibleModal from './components/EditResponsibleModal';
import NewMovementModal from './components/NewMovementModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Core Data States
  const [materials, setMaterials] = useState<Material[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    id: 1,
    technical_responsible: 'Nicoly Vitória',
    technical_document: 'CRQ/CREA-SP 042891-D',
    company_name: 'INDÚSTRIA METALÚRGICA & OPERACIONAL S.A.',
    company_subtitle: 'Divisão de Suprimentos, Logística & Almoxarifado Central',
    contact_phone: '(11) 3450-8000',
    contact_email: 'almoxarifado@empresa.com.br',
    currency: 'BRL',
  } as any);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Active User Profile
  const [currentUser, setCurrentUser] = useState<User>({
    id: 1,
    username: 'admin',
    name: 'Nicoly Vitória',
    role: 'ADMIN',
    sector_id: null,
  });

  // Global Modals
  const [editResponsibleOpen, setEditResponsibleOpen] = useState(false);
  const [quickMovementOpen, setQuickMovementOpen] = useState(false);
  const [quickMovementType, setQuickMovementType] = useState<'ENTRADA' | 'SAIDA'>('ENTRADA');
  const [selectedKardexMaterialId, setSelectedKardexMaterialId] = useState<number | null>(null);

  // Fetch all initial data with resilient handling
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const safeFetch = async (url: string) => {
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} em ${url}`);
        }
        return res.json();
      };

      const [matsRes, movsRes, secsRes, reqsRes, settRes, statsRes] = await Promise.allSettled([
        safeFetch('/api/materials'),
        safeFetch('/api/movements'),
        safeFetch('/api/sectors'),
        safeFetch('/api/requisitions'),
        safeFetch('/api/settings'),
        safeFetch('/api/stats'),
      ]);

      if (matsRes.status === 'fulfilled' && Array.isArray(matsRes.value)) {
        setMaterials(matsRes.value);
      }
      if (movsRes.status === 'fulfilled' && Array.isArray(movsRes.value)) {
        setMovements(movsRes.value);
      }
      if (secsRes.status === 'fulfilled' && Array.isArray(secsRes.value)) {
        setSectors(secsRes.value);
      }
      if (reqsRes.status === 'fulfilled' && Array.isArray(reqsRes.value)) {
        setRequisitions(reqsRes.value);
      }
      if (settRes.status === 'fulfilled' && settRes.value?.technical_responsible) {
        setSettings(settRes.value);
      }
      if (statsRes.status === 'fulfilled' && statsRes.value && !statsRes.value.error) {
        setStats(statsRes.value);
      }

      // Check if all core requests failed (true server down)
      const allFailed = [matsRes, movsRes, secsRes, reqsRes, settRes, statsRes].every(
        r => r.status === 'rejected'
      );
      if (allFailed) {
        setError('Não foi possível conectar ao servidor de banco de dados. Tente recarregar a página.');
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('Houve uma falha momentânea de comunicação. Clique para tentar novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Material Actions
  const handleSaveMaterial = async (data: any, id?: number) => {
    const url = id ? `/api/materials/${id}` : '/api/materials';
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Erro ao salvar material.');
    }

    await fetchData();
  };

  const handleDeleteMaterial = async (id: number): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch(`/api/materials/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (!res.ok) {
        return { success: false, message: result.error || 'Erro ao excluir material.' };
      }
      await fetchData();
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  // Sector Actions
  const handleSaveSector = async (data: any, id?: number) => {
    const url = id ? `/api/sectors/${id}` : '/api/sectors';
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Erro ao salvar setor.');
    }

    await fetchData();
  };

  const handleDeleteSector = async (id: number): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch(`/api/sectors/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (!res.ok) {
        return { success: false, message: result.error || 'Erro ao excluir setor.' };
      }
      await fetchData();
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  // Movement Actions
  const handleSaveMovement = async (data: any) => {
    const res = await fetch('/api/movements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Erro ao registrar movimentação.');
    }

    await fetchData();
  };

  // Requisition Actions
  const handleSaveRequisition = async (data: any) => {
    const res = await fetch('/api/requisitions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Erro ao criar requisição.');
    }

    await fetchData();
  };

  const handleApproveRequisition = async (id: number, approvedBy: string) => {
    const res = await fetch(`/api/requisitions/${id}/approve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved_by: approvedBy }),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Erro ao aprovar requisição.');
    }

    await fetchData();
  };

  const handleRejectRequisition = async (id: number, reason: string) => {
    const res = await fetch(`/api/requisitions/${id}/reject`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Erro ao rejeitar requisição.');
    }

    await fetchData();
  };

  // Settings Actions
  const handleSaveSettings = async (data: any) => {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Erro ao salvar configurações.');
    }

    setSettings(result);
    // Also update current user if responsible name matches
    setCurrentUser(prev => ({
      ...prev,
      name: result.technical_responsible,
    }));
  };

  // Switch to Kardex from any component
  const handleSelectMaterialKardex = (materialId: number) => {
    setSelectedKardexMaterialId(materialId);
    setActiveTab('reports');
  };

  const criticalCount = materials.filter(m => m.current_quantity <= m.min_quantity).length;
  const pendingReqCount = requisitions.filter(r => r.status === 'PENDENTE').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 selection:bg-[#f4c430] selection:text-[#0f2438]">
      {/* Top Navigation */}
      <Navbar
        currentTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab as AppTab)}
        currentUser={currentUser}
        onSwitchUser={(user) => setCurrentUser(user)}
        criticalCount={criticalCount}
        pendingReqCount={pendingReqCount}
        settings={settings}
        onEditSettings={() => setEditResponsibleOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between no-print">
            <span>{error}</span>
            <button
              onClick={fetchData}
              className="px-3 py-1 bg-red-600 text-white rounded font-bold hover:bg-red-700"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {/* View Switcher */}
        {activeTab === 'dashboard' && (
          <DashboardView
            kpis={stats}
            loading={loading}
            onNavigate={(tab) => setActiveTab(tab as AppTab)}
            onSelectMaterialKardex={handleSelectMaterialKardex}
            onOpenNewMovement={(type) => {
              setQuickMovementType(type || 'ENTRADA');
              setQuickMovementOpen(true);
            }}
            onOpenNewRequisition={() => setActiveTab('requisitions')}
          />
        )}

        {activeTab === 'materials' && (
          <MaterialsView
            materials={materials}
            loading={loading}
            onRefresh={fetchData}
            onSelectMaterialKardex={handleSelectMaterialKardex}
            onSaveMaterial={handleSaveMaterial}
            onDeleteMaterial={handleDeleteMaterial}
          />
        )}

        {activeTab === 'sectors' && (
          <SectorsView
            sectors={sectors}
            loading={loading}
            onRefresh={fetchData}
            onSaveSector={handleSaveSector}
            onDeleteSector={handleDeleteSector}
          />
        )}

        {activeTab === 'movements' && (
          <MovementsView
            movements={movements}
            materials={materials}
            sectors={sectors}
            loading={loading}
            onRefresh={fetchData}
            currentUser={currentUser}
            onSaveMovement={handleSaveMovement}
          />
        )}

        {activeTab === 'requisitions' && (
          <RequisitionsView
            requisitions={requisitions}
            materials={materials}
            sectors={sectors}
            settings={settings}
            loading={loading}
            onRefresh={fetchData}
            currentUser={currentUser}
            onSaveRequisition={handleSaveRequisition}
            onApproveRequisition={handleApproveRequisition}
            onRejectRequisition={handleRejectRequisition}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            materials={materials}
            movements={movements}
            sectors={sectors}
            settings={settings}
            selectedKardexMaterialId={selectedKardexMaterialId}
          />
        )}

        {activeTab === 'best-practices' && (
          <BestPracticesView settings={settings} />
        )}
      </main>

      {/* Global Modals */}
      <EditResponsibleModal
        isOpen={editResponsibleOpen}
        onClose={() => setEditResponsibleOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      <NewMovementModal
        isOpen={quickMovementOpen}
        onClose={() => setQuickMovementOpen(false)}
        initialType={quickMovementType}
        materials={materials}
        sectors={sectors}
        currentUser={currentUser}
        onSave={async (data) => {
          await handleSaveMovement(data);
          await fetchData();
        }}
      />

      {/* Persistent Footer */}
      <Footer
        settings={settings}
        onEditSettings={() => setEditResponsibleOpen(true)}
      />
    </div>
  );
}
