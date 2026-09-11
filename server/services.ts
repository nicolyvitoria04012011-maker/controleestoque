import { db } from './db.js';
import { Material, Sector, Movement, Requisition, AppSettings, DashboardKpis, AbcItem, TopMovedItem, SectorConsumption, MonthlyMovementSummary, KardexEntry } from '../src/types.js';

// Settings
export function getSettings(): AppSettings {
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  rows.forEach(r => { settings[r.key] = r.value; });
  return {
    company_name: settings['company_name'] || 'Almoxarifado Central & Gestão de Ativos',
    company_subtitle: settings['company_subtitle'] || 'Unidade de Controle Operacional de Suprimentos',
    technical_responsible: settings['technical_responsible'] || 'Nicoly Vitória',
    technical_document: settings['technical_document'] || 'CREA/CRQ: 104.829-SP',
    contact_email: settings['contact_email'] || 'almoxarifado@empresa.com.br',
    contact_phone: settings['contact_phone'] || '(11) 4002-8922',
    currency: settings['currency'] || 'BRL',
  };
}

export function updateSettings(data: Partial<AppSettings>): AppSettings {
  const updateStmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  Object.entries(data).forEach(([k, v]) => {
    if (v !== undefined) {
      updateStmt.run(k, String(v));
    }
  });
  return getSettings();
}

// Materials
export function getMaterials(search?: string, category?: string, status?: string): Material[] {
  let query = 'SELECT * FROM materials WHERE 1=1';
  const params: any[] = [];

  if (search && search.trim() !== '') {
    query += ' AND (code LIKE ? OR name LIKE ? OR location LIKE ?)';
    const s = `%${search.trim()}%`;
    params.push(s, s, s);
  }

  if (category && category !== 'ALL') {
    query += ' AND category = ?';
    params.push(category);
  }

  if (status === 'CRITICAL') {
    query += ' AND current_quantity <= min_quantity';
  } else if (status === 'NORMAL') {
    query += ' AND current_quantity > min_quantity AND current_quantity <= max_quantity';
  } else if (status === 'EXCESS') {
    query += ' AND current_quantity > max_quantity';
  }

  query += ' ORDER BY name ASC';
  return db.prepare(query).all(...params) as unknown as Material[];
}

export function getMaterialById(id: number): Material | undefined {
  return db.prepare('SELECT * FROM materials WHERE id = ?').get(id) as unknown as Material | undefined;
}

export function createMaterial(data: Omit<Material, 'id' | 'created_at'>): Material {
  const stmt = db.prepare(`
    INSERT INTO materials (code, name, category, unit, current_quantity, unit_price, min_quantity, max_quantity, location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const res = stmt.run(
    data.code.trim().toUpperCase(),
    data.name.trim(),
    data.category,
    data.unit,
    Number(data.current_quantity) || 0,
    Number(data.unit_price) || 0,
    Number(data.min_quantity) || 5,
    Number(data.max_quantity) || 100,
    data.location?.trim() || ''
  );

  const newId = Number(res.lastInsertRowid);

  // If initial quantity > 0, record an initial entrada movement
  if (Number(data.current_quantity) > 0) {
    const movStmt = db.prepare(`
      INSERT INTO movements (date_time, type, material_id, sector_id, quantity, previous_balance, new_balance, unit_price, total_price, reason, document_number, responsible_person)
      VALUES (datetime('now', 'localtime'), 'ENTRADA', ?, NULL, ?, 0, ?, ?, ?, 'Cadastro inicial de material em estoque', 'INVENTARIO-INICIAL', 'Sistema')
    `);
    const qty = Number(data.current_quantity);
    const price = Number(data.unit_price) || 0;
    movStmt.run(newId, qty, qty, price, qty * price);
  }

  return getMaterialById(newId)!;
}

export function updateMaterial(id: number, data: Partial<Material>): Material {
  const existing = getMaterialById(id);
  if (!existing) throw new Error('Material não encontrado');

  const stmt = db.prepare(`
    UPDATE materials SET
      code = ?,
      name = ?,
      category = ?,
      unit = ?,
      unit_price = ?,
      min_quantity = ?,
      max_quantity = ?,
      location = ?
    WHERE id = ?
  `);

  stmt.run(
    data.code ? data.code.trim().toUpperCase() : existing.code,
    data.name ? data.name.trim() : existing.name,
    data.category || existing.category,
    data.unit || existing.unit,
    data.unit_price !== undefined ? Number(data.unit_price) : existing.unit_price,
    data.min_quantity !== undefined ? Number(data.min_quantity) : existing.min_quantity,
    data.max_quantity !== undefined ? Number(data.max_quantity) : existing.max_quantity,
    data.location !== undefined ? data.location.trim() : existing.location,
    id
  );

  return getMaterialById(id)!;
}

export function deleteMaterial(id: number): { success: boolean; message?: string } {
  // Check if material has movements
  const hasMovements = db.prepare('SELECT COUNT(*) as count FROM movements WHERE material_id = ?').get(id) as { count: number };
  if (hasMovements.count > 0) {
    return { success: false, message: `Não é possível excluir: existem ${hasMovements.count} movimentação(ões) vinculadas a este material.` };
  }

  // Check if material has requisitions
  const hasReqs = db.prepare('SELECT COUNT(*) as count FROM requisition_items WHERE material_id = ?').get(id) as { count: number };
  if (hasReqs.count > 0) {
    return { success: false, message: `Não é possível excluir: o item consta em ${hasReqs.count} requisição(ões).` };
  }

  db.prepare('DELETE FROM materials WHERE id = ?').run(id);
  return { success: true };
}

// Sectors
export function getSectors(): Sector[] {
  const sectors = db.prepare(`
    SELECT s.*,
      (SELECT COUNT(DISTINCT m.material_id) FROM movements m WHERE m.sector_id = s.id AND m.type = 'SAIDA') as materials_consumed_count,
      (SELECT COALESCE(SUM(m.total_price), 0) FROM movements m WHERE m.sector_id = s.id AND m.type = 'SAIDA') as total_spent
    FROM sectors s
    ORDER BY s.name ASC
  `).all() as unknown as Sector[];
  return sectors;
}

export function getSectorById(id: number): Sector | undefined {
  return db.prepare('SELECT * FROM sectors WHERE id = ?').get(id) as unknown as Sector | undefined;
}

export function createSector(data: Omit<Sector, 'id' | 'created_at'>): Sector {
  const stmt = db.prepare(`
    INSERT INTO sectors (code, name, responsible, cost_center, email)
    VALUES (?, ?, ?, ?, ?)
  `);
  const res = stmt.run(
    data.code.trim().toUpperCase(),
    data.name.trim(),
    data.responsible.trim(),
    data.cost_center?.trim() || '',
    data.email?.trim() || ''
  );
  return getSectorById(Number(res.lastInsertRowid))!;
}

export function updateSector(id: number, data: Partial<Sector>): Sector {
  const existing = getSectorById(id);
  if (!existing) throw new Error('Setor não encontrado');

  const stmt = db.prepare(`
    UPDATE sectors SET
      code = ?,
      name = ?,
      responsible = ?,
      cost_center = ?,
      email = ?
    WHERE id = ?
  `);

  stmt.run(
    data.code ? data.code.trim().toUpperCase() : existing.code,
    data.name ? data.name.trim() : existing.name,
    data.responsible ? data.responsible.trim() : existing.responsible,
    data.cost_center !== undefined ? data.cost_center.trim() : existing.cost_center,
    data.email !== undefined ? data.email.trim() : existing.email,
    id
  );

  return getSectorById(id)!;
}

export function deleteSector(id: number): { success: boolean; message?: string } {
  const hasMovements = db.prepare('SELECT COUNT(*) as count FROM movements WHERE sector_id = ?').get(id) as { count: number };
  if (hasMovements.count > 0) {
    return { success: false, message: `Não é possível excluir: existem ${hasMovements.count} movimentações registradas para este setor.` };
  }

  const hasReqs = db.prepare('SELECT COUNT(*) as count FROM requisitions WHERE sector_id = ?').get(id) as { count: number };
  if (hasReqs.count > 0) {
    return { success: false, message: `Não é possível excluir: existem ${hasReqs.count} requisições vinculadas a este setor.` };
  }

  db.prepare('DELETE FROM sectors WHERE id = ?').run(id);
  return { success: true };
}

// Movements
export function recordMovement(data: {
  type: 'ENTRADA' | 'SAIDA';
  material_id: number;
  sector_id?: number | null;
  quantity: number;
  unit_price?: number;
  reason: string;
  document_number?: string;
  responsible_person: string;
  date_time?: string;
}): Movement {
  const material = getMaterialById(data.material_id);
  if (!material) throw new Error('Material não encontrado');

  const qty = Number(data.quantity);
  if (isNaN(qty) || qty <= 0) {
    throw new Error('Quantidade deve ser maior que zero');
  }

  const prevBalance = material.current_quantity;
  let newBalance: number;

  if (data.type === 'SAIDA') {
    if (prevBalance < qty) {
      throw new Error(`Saldo insuficiente para saída. Saldo atual: ${prevBalance} ${material.unit}, Solicitado: ${qty} ${material.unit}`);
    }
    newBalance = prevBalance - qty;
  } else {
    newBalance = prevBalance + qty;
  }

  const unitPrice = data.unit_price !== undefined && data.unit_price > 0 ? Number(data.unit_price) : material.unit_price;
  const totalPrice = qty * unitPrice;
  const now = data.date_time || new Date().toISOString().replace('T', ' ').slice(0, 19);

  // Run in a transaction
  db.exec('BEGIN TRANSACTION;');
  try {
    const insertMov = db.prepare(`
      INSERT INTO movements (date_time, type, material_id, sector_id, quantity, previous_balance, new_balance, unit_price, total_price, reason, document_number, responsible_person)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const movRes = insertMov.run(
      now,
      data.type,
      data.material_id,
      data.sector_id || null,
      qty,
      prevBalance,
      newBalance,
      unitPrice,
      totalPrice,
      data.reason.trim(),
      data.document_number?.trim() || null,
      data.responsible_person.trim()
    );

    // Update material balance and optionally unit price on entrada
    if (data.type === 'ENTRADA' && data.unit_price && data.unit_price > 0) {
      db.prepare('UPDATE materials SET current_quantity = ?, unit_price = ? WHERE id = ?').run(newBalance, unitPrice, data.material_id);
    } else {
      db.prepare('UPDATE materials SET current_quantity = ? WHERE id = ?').run(newBalance, data.material_id);
    }

    db.exec('COMMIT;');
    const newMov = db.prepare(`
      SELECT m.*, mat.name as material_name, mat.code as material_code, mat.unit as material_unit, s.name as sector_name
      FROM movements m
      JOIN materials mat ON m.material_id = mat.id
      LEFT JOIN sectors s ON m.sector_id = s.id
      WHERE m.id = ?
    `).get(Number(movRes.lastInsertRowid)) as unknown as Movement;

    return newMov;
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

export function getMovements(filters?: {
  material_id?: number;
  sector_id?: number;
  type?: 'ENTRADA' | 'SAIDA';
  startDate?: string;
  endDate?: string;
  search?: string;
}): Movement[] {
  let query = `
    SELECT m.*, mat.name as material_name, mat.code as material_code, mat.unit as material_unit, s.name as sector_name
    FROM movements m
    JOIN materials mat ON m.material_id = mat.id
    LEFT JOIN sectors s ON m.sector_id = s.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters?.material_id) {
    query += ' AND m.material_id = ?';
    params.push(filters.material_id);
  }

  if (filters?.sector_id) {
    query += ' AND m.sector_id = ?';
    params.push(filters.sector_id);
  }

  if (filters?.type) {
    query += ' AND m.type = ?';
    params.push(filters.type);
  }

  if (filters?.startDate) {
    query += ' AND m.date_time >= ?';
    params.push(filters.startDate + ' 00:00:00');
  }

  if (filters?.endDate) {
    query += ' AND m.date_time <= ?';
    params.push(filters.endDate + ' 23:59:59');
  }

  if (filters?.search) {
    query += ' AND (mat.name LIKE ? OR mat.code LIKE ? OR m.reason LIKE ? OR m.document_number LIKE ?)';
    const s = `%${filters.search.trim()}%`;
    params.push(s, s, s, s);
  }

  query += ' ORDER BY m.date_time DESC, m.id DESC';
  return db.prepare(query).all(...params) as unknown as Movement[];
}

// Requisitions
export function getRequisitions(): Requisition[] {
  const reqs = db.prepare(`
    SELECT r.*, s.name as sector_name, s.code as sector_code,
      (SELECT COUNT(*) FROM requisition_items ri WHERE ri.requisition_id = r.id) as items_count,
      (SELECT COALESCE(SUM(ri.quantity * ri.unit_price), 0) FROM requisition_items ri WHERE ri.requisition_id = r.id) as total_value
    FROM requisitions r
    JOIN sectors s ON r.sector_id = s.id
    ORDER BY r.id DESC
  `).all() as unknown as Requisition[];

  // Populate items for each requisition
  const getItemsStmt = db.prepare(`
    SELECT ri.*, m.name as material_name, m.code as material_code, m.unit as material_unit, m.current_quantity as current_stock,
      (ri.quantity * ri.unit_price) as total_price
    FROM requisition_items ri
    JOIN materials m ON ri.material_id = m.id
    WHERE ri.requisition_id = ?
  `);

  return reqs.map(r => ({
    ...r,
    items: getItemsStmt.all(r.id) as unknown as Requisition['items']
  }));
}

export function getRequisitionById(id: number): Requisition | undefined {
  const req = db.prepare(`
    SELECT r.*, s.name as sector_name, s.code as sector_code,
      (SELECT COUNT(*) FROM requisition_items ri WHERE ri.requisition_id = r.id) as items_count,
      (SELECT COALESCE(SUM(ri.quantity * ri.unit_price), 0) FROM requisition_items ri WHERE ri.requisition_id = r.id) as total_value
    FROM requisitions r
    JOIN sectors s ON r.sector_id = s.id
    WHERE r.id = ?
  `).get(id) as unknown as Requisition | undefined;

  if (!req) return undefined;

  req.items = db.prepare(`
    SELECT ri.*, m.name as material_name, m.code as material_code, m.unit as material_unit, m.current_quantity as current_stock,
      (ri.quantity * ri.unit_price) as total_price
    FROM requisition_items ri
    JOIN materials m ON ri.material_id = m.id
    WHERE ri.requisition_id = ?
  `).all(id) as unknown as Requisition['items'];

  return req;
}

export function createRequisition(data: {
  sector_id: number;
  requester_name: string;
  justification: string;
  items: Array<{ material_id: number; quantity: number; observation?: string }>;
}): Requisition {
  if (!data.items || data.items.length === 0) {
    throw new Error('A requisição deve conter pelo menos um item');
  }

  const today = new Date();
  const year = today.getFullYear();
  // Generate sequence number
  const countRow = db.prepare("SELECT COUNT(*) as count FROM requisitions WHERE date LIKE ?").get(`${year}-%`) as { count: number };
  const seq = String(countRow.count + 1).padStart(4, '0');
  const reqNumber = `REQ-${year}-${seq}`;
  const date = today.toISOString().slice(0, 10);

  db.exec('BEGIN TRANSACTION;');
  try {
    const insertReq = db.prepare(`
      INSERT INTO requisitions (requisition_number, date, sector_id, requester_name, status, justification)
      VALUES (?, ?, ?, ?, 'PENDENTE', ?)
    `);
    const reqRes = insertReq.run(reqNumber, date, data.sector_id, data.requester_name.trim(), data.justification?.trim() || '');
    const reqId = Number(reqRes.lastInsertRowid);

    const insertItem = db.prepare(`
      INSERT INTO requisition_items (requisition_id, material_id, quantity, unit_price, observation)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const item of data.items) {
      const mat = getMaterialById(item.material_id);
      if (!mat) throw new Error(`Material com ID ${item.material_id} não encontrado`);
      insertItem.run(reqId, item.material_id, Number(item.quantity), mat.unit_price, item.observation?.trim() || '');
    }

    db.exec('COMMIT;');
    return getRequisitionById(reqId)!;
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

export function approveRequisition(id: number, approvedBy: string): Requisition {
  const req = getRequisitionById(id);
  if (!req) throw new Error('Requisição não encontrada');
  if (req.status !== 'PENDENTE') throw new Error(`Esta requisição já está ${req.status}`);

  // Validate stock for all items
  for (const item of req.items) {
    const mat = getMaterialById(item.material_id);
    if (!mat) throw new Error(`Material ${item.material_code} não encontrado`);
    if (mat.current_quantity < item.quantity) {
      throw new Error(`Saldo insuficiente para o item "${mat.name}". Em estoque: ${mat.current_quantity} ${mat.unit}, Solicitado: ${item.quantity} ${mat.unit}`);
    }
  }

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  db.exec('BEGIN TRANSACTION;');
  try {
    // Record SAIDA movement for each item and deduct stock
    for (const item of req.items) {
      const mat = getMaterialById(item.material_id)!;
      const prevBal = mat.current_quantity;
      const newBal = prevBal - item.quantity;
      const totPrice = item.quantity * item.unit_price;

      db.prepare(`
        INSERT INTO movements (date_time, type, material_id, sector_id, quantity, previous_balance, new_balance, unit_price, total_price, reason, document_number, responsible_person)
        VALUES (?, 'SAIDA', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        now,
        item.material_id,
        req.sector_id,
        item.quantity,
        prevBal,
        newBal,
        item.unit_price,
        totPrice,
        `Atendimento da Requisição #${req.requisition_number} (${req.sector_name})`,
        req.requisition_number,
        approvedBy
      );

      db.prepare('UPDATE materials SET current_quantity = ? WHERE id = ?').run(newBal, item.material_id);
    }

    // Update requisition status
    db.prepare(`
      UPDATE requisitions SET status = 'APROVADA', approved_by = ?, approval_date = ? WHERE id = ?
    `).run(approvedBy, now, id);

    db.exec('COMMIT;');
    return getRequisitionById(id)!;
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

export function rejectRequisition(id: number, reason: string): Requisition {
  const req = getRequisitionById(id);
  if (!req) throw new Error('Requisição não encontrada');
  if (req.status !== 'PENDENTE') throw new Error(`Esta requisição já está ${req.status}`);

  db.prepare(`
    UPDATE requisitions SET status = 'REJEITADA', justification = justification || ' [REJEITADA: ' || ? || ']' WHERE id = ?
  `).run(reason, id);

  return getRequisitionById(id)!;
}

// Kardex / Traceability per Material
export function getMaterialKardex(materialId: number): { material: Material; entries: KardexEntry[] } {
  const material = getMaterialById(materialId);
  if (!material) throw new Error('Material não encontrado');

  const rows = db.prepare(`
    SELECT m.id, m.date_time, m.type, m.quantity, m.unit_price, m.total_price, m.previous_balance, m.new_balance,
           m.reason, COALESCE(m.document_number, '-') as document_number,
           COALESCE(s.name, 'Almoxarifado / Entrada') as sector_name,
           m.responsible_person
    FROM movements m
    LEFT JOIN sectors s ON m.sector_id = s.id
    WHERE m.material_id = ?
    ORDER BY m.date_time ASC, m.id ASC
  `).all(materialId) as unknown as KardexEntry[];

  return { material, entries: rows };
}

// Performance Indicators & Dashboard KPIs
export function getDashboardKpis(): DashboardKpis {
  // Total inventory value & materials count
  const matStats = db.prepare(`
    SELECT
      COUNT(*) as total_count,
      COALESCE(SUM(current_quantity * unit_price), 0) as total_value,
      SUM(CASE WHEN current_quantity <= min_quantity THEN 1 ELSE 0 END) as critical_count
    FROM materials
  `).get() as { total_count: number; total_value: number; critical_count: number };

  // Pending requisitions
  const pendingReqs = db.prepare("SELECT COUNT(*) as count FROM requisitions WHERE status = 'PENDENTE'").get() as { count: number };

  // Movements this month
  const currentMonth = new Date().toISOString().slice(0, 7);
  const movStats = db.prepare("SELECT COUNT(*) as count FROM movements WHERE date_time LIKE ?").get(`${currentMonth}%`) as { count: number };

  // Critical Materials list
  const criticalMaterials = db.prepare(`
    SELECT * FROM materials
    WHERE current_quantity <= min_quantity
    ORDER BY (current_quantity / NULLIF(min_quantity, 0)) ASC, name ASC
    LIMIT 10
  `).all() as unknown as Material[];

  // Top moved materials (Saídas)
  const topMoved = db.prepare(`
    SELECT m.material_id, mat.code, mat.name, mat.unit,
      SUM(m.quantity) as total_quantity,
      SUM(m.total_price) as total_value,
      COUNT(m.id) as movement_count
    FROM movements m
    JOIN materials mat ON m.material_id = mat.id
    WHERE m.type = 'SAIDA'
    GROUP BY m.material_id
    ORDER BY total_quantity DESC
    LIMIT 6
  `).all() as unknown as TopMovedItem[];

  // Stock Turnover (Giro de Estoque = Saídas totais no período / Estoque total atual)
  const totalSaidasRow = db.prepare("SELECT COALESCE(SUM(total_price), 0) as total_saidas FROM movements WHERE type = 'SAIDA'").get() as { total_saidas: number };
  const totalInvVal = matStats.total_value || 1;
  const stockTurnoverRate = Number((totalSaidasRow.total_saidas / totalInvVal).toFixed(2));

  // ABC Curve Analysis (Curva ABC baseada no valor total imobilizado)
  const allMats = db.prepare(`
    SELECT id as material_id, code, name, category, current_quantity, unit_price,
           (current_quantity * unit_price) as total_value
    FROM materials
    WHERE current_quantity > 0
    ORDER BY total_value DESC
  `).all() as unknown as Array<{ material_id: number; code: string; name: string; category: string; current_quantity: number; unit_price: number; total_value: number }>;

  const sumTotalValue = allMats.reduce((acc, it) => acc + it.total_value, 0) || 1;
  let runningSum = 0;

  const abcItems: AbcItem[] = allMats.map(item => {
    runningSum += item.total_value;
    const percentage = (item.total_value / sumTotalValue) * 100;
    const cumPercentage = (runningSum / sumTotalValue) * 100;

    let classification: 'A' | 'B' | 'C' = 'C';
    if (cumPercentage <= 80 || (cumPercentage - percentage < 80)) {
      classification = 'A';
    } else if (cumPercentage <= 95 || (cumPercentage - percentage < 95)) {
      classification = 'B';
    } else {
      classification = 'C';
    }

    return {
      ...item,
      percentage_of_total: Number(percentage.toFixed(2)),
      cumulative_percentage: Number(cumPercentage.toFixed(2)),
      classification
    };
  });

  const classA = abcItems.filter(i => i.classification === 'A');
  const classB = abcItems.filter(i => i.classification === 'B');
  const classC = abcItems.filter(i => i.classification === 'C');

  const abcClassification = {
    classA: {
      count: classA.length,
      totalValue: classA.reduce((s, i) => s + i.total_value, 0),
      percentageValue: Number((classA.reduce((s, i) => s + i.total_value, 0) / sumTotalValue * 100).toFixed(1))
    },
    classB: {
      count: classB.length,
      totalValue: classB.reduce((s, i) => s + i.total_value, 0),
      percentageValue: Number((classB.reduce((s, i) => s + i.total_value, 0) / sumTotalValue * 100).toFixed(1))
    },
    classC: {
      count: classC.length,
      totalValue: classC.reduce((s, i) => s + i.total_value, 0),
      percentageValue: Number((classC.reduce((s, i) => s + i.total_value, 0) / sumTotalValue * 100).toFixed(1))
    },
    items: abcItems
  };

  // Sector consumption distribution
  const sectorConsumption = db.prepare(`
    SELECT s.id as sector_id, s.name as sector_name, s.code as sector_code,
           COALESCE(SUM(m.total_price), 0) as total_value,
           COUNT(m.id) as items_count
    FROM sectors s
    LEFT JOIN movements m ON s.id = m.sector_id AND m.type = 'SAIDA'
    GROUP BY s.id
    ORDER BY total_value DESC
  `).all() as unknown as SectorConsumption[];

  // Monthly movements summary (last 6 months)
  const monthlyMovements: MonthlyMovementSummary[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const mStr = d.toISOString().slice(0, 7);
    const mLabel = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).toUpperCase();

    const row = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'ENTRADA' THEN total_price ELSE 0 END), 0) as ent_val,
        COALESCE(SUM(CASE WHEN type = 'SAIDA' THEN total_price ELSE 0 END), 0) as sai_val,
        COALESCE(SUM(CASE WHEN type = 'ENTRADA' THEN quantity ELSE 0 END), 0) as ent_qty,
        COALESCE(SUM(CASE WHEN type = 'SAIDA' THEN quantity ELSE 0 END), 0) as sai_qty
      FROM movements
      WHERE date_time LIKE ?
    `).get(`${mStr}%`) as { ent_val: number; sai_val: number; ent_qty: number; sai_qty: number };

    monthlyMovements.push({
      month: mLabel,
      entradas_val: row.ent_val,
      saidas_val: row.sai_val,
      entradas_qty: row.ent_qty,
      saidas_qty: row.sai_qty,
    });
  }

  return {
    totalInventoryValue: matStats.total_value,
    totalMaterialsCount: matStats.total_count,
    criticalItemsCount: matStats.critical_count,
    pendingRequisitionsCount: pendingReqs.count,
    monthMovementsCount: movStats.count,
    stockTurnoverRate,
    criticalMaterials,
    topMovedMaterials: topMoved,
    abcClassification,
    monthlyMovements,
    sectorConsumption
  };
}
