import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initDatabase } from './server/db.js';
import * as svc from './server/services.js';

// Initialize the database tables and seed data
initDatabase();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Settings
  app.get('/api/settings', (req, res) => {
    try {
      const settings = svc.getSettings();
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/settings', (req, res) => {
    try {
      const updated = svc.updateSettings(req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Materials
  app.get('/api/materials', (req, res) => {
    try {
      const { search, category, status } = req.query as { search?: string; category?: string; status?: string };
      const materials = svc.getMaterials(search, category, status);
      res.json(materials);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/materials/:id', (req, res) => {
    try {
      const mat = svc.getMaterialById(Number(req.params.id));
      if (!mat) return res.status(404).json({ error: 'Material não encontrado' });
      res.json(mat);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/materials', (req, res) => {
    try {
      const created = svc.createMaterial(req.body);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/materials/:id', (req, res) => {
    try {
      const updated = svc.updateMaterial(Number(req.params.id), req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/materials/:id', (req, res) => {
    try {
      const result = svc.deleteMaterial(Number(req.params.id));
      if (!result.success) {
        return res.status(409).json({ error: result.message });
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Sectors
  app.get('/api/sectors', (req, res) => {
    try {
      const sectors = svc.getSectors();
      res.json(sectors);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/sectors', (req, res) => {
    try {
      const created = svc.createSector(req.body);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/sectors/:id', (req, res) => {
    try {
      const updated = svc.updateSector(Number(req.params.id), req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/sectors/:id', (req, res) => {
    try {
      const result = svc.deleteSector(Number(req.params.id));
      if (!result.success) {
        return res.status(409).json({ error: result.message });
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Movements
  app.get('/api/movements', (req, res) => {
    try {
      const { material_id, sector_id, type, startDate, endDate, search } = req.query as any;
      const movements = svc.getMovements({
        material_id: material_id ? Number(material_id) : undefined,
        sector_id: sector_id ? Number(sector_id) : undefined,
        type: type ? (type as 'ENTRADA' | 'SAIDA') : undefined,
        startDate,
        endDate,
        search,
      });
      res.json(movements);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/movements', (req, res) => {
    try {
      const movement = svc.recordMovement(req.body);
      res.status(201).json(movement);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Requisitions
  app.get('/api/requisitions', (req, res) => {
    try {
      const reqs = svc.getRequisitions();
      res.json(reqs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/requisitions/:id', (req, res) => {
    try {
      const reqItem = svc.getRequisitionById(Number(req.params.id));
      if (!reqItem) return res.status(404).json({ error: 'Requisição não encontrada' });
      res.json(reqItem);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/requisitions', (req, res) => {
    try {
      const created = svc.createRequisition(req.body);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Requisition approval & rejection (support both POST and PUT)
  const handleApprove = (req: express.Request, res: express.Response) => {
    try {
      const { approved_by } = req.body;
      const approved = svc.approveRequisition(Number(req.params.id), approved_by || 'Administrador');
      res.json(approved);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };
  app.post('/api/requisitions/:id/approve', handleApprove);
  app.put('/api/requisitions/:id/approve', handleApprove);

  const handleReject = (req: express.Request, res: express.Response) => {
    try {
      const { reason } = req.body;
      const rejected = svc.rejectRequisition(Number(req.params.id), reason || 'Motivo não informado');
      res.json(rejected);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };
  app.post('/api/requisitions/:id/reject', handleReject);
  app.put('/api/requisitions/:id/reject', handleReject);

  // KPIs & Dashboards
  const handleKpis = (req: express.Request, res: express.Response) => {
    try {
      const kpis = svc.getDashboardKpis();
      res.json(kpis);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
  app.get('/api/kpis', handleKpis);
  app.get('/api/stats', handleKpis);

  // Kardex
  app.get('/api/reports/kardex/:materialId', (req, res) => {
    try {
      const kardex = svc.getMaterialKardex(Number(req.params.materialId));
      res.json(kardex);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Stock Report
  app.get('/api/reports/stock', (req, res) => {
    try {
      const materials = svc.getMaterials();
      const settings = svc.getSettings();
      const totalValue = materials.reduce((acc, m) => acc + (m.current_quantity * m.unit_price), 0);
      res.json({
        materials,
        settings,
        totalValue,
        totalItems: materials.length,
        generatedAt: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for dev / static for prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
