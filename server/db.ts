import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'estoque.db');
export const db = new DatabaseSync(DB_PATH);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

// Initialize tables
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      sector_id INTEGER,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS sectors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      responsible TEXT NOT NULL,
      cost_center TEXT,
      email TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit TEXT NOT NULL,
      current_quantity REAL NOT NULL DEFAULT 0,
      unit_price REAL NOT NULL DEFAULT 0,
      min_quantity REAL NOT NULL DEFAULT 5,
      max_quantity REAL NOT NULL DEFAULT 100,
      location TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date_time TEXT NOT NULL,
      type TEXT NOT NULL, -- 'ENTRADA' | 'SAIDA'
      material_id INTEGER NOT NULL,
      sector_id INTEGER,
      quantity REAL NOT NULL,
      previous_balance REAL NOT NULL,
      new_balance REAL NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      reason TEXT NOT NULL,
      document_number TEXT,
      responsible_person TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (material_id) REFERENCES materials (id) ON DELETE RESTRICT,
      FOREIGN KEY (sector_id) REFERENCES sectors (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS requisitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requisition_number TEXT UNIQUE NOT NULL,
      date TEXT NOT NULL,
      sector_id INTEGER NOT NULL,
      requester_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDENTE', -- 'PENDENTE', 'APROVADA', 'REJEITADA', 'CANCELADA'
      justification TEXT,
      approved_by TEXT,
      approval_date TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (sector_id) REFERENCES sectors (id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS requisition_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requisition_id INTEGER NOT NULL,
      material_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      observation TEXT,
      FOREIGN KEY (requisition_id) REFERENCES requisitions (id) ON DELETE CASCADE,
      FOREIGN KEY (material_id) REFERENCES materials (id) ON DELETE RESTRICT
    );
  `);

  // Initialize seed settings if empty
  const hasSettings = db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number };
  if (hasSettings.count === 0) {
    seedInitialData();
  }
}

function seedInitialData() {
  // Settings
  const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  insertSetting.run('company_name', 'Almoxarifado Central & Gestão de Ativos');
  insertSetting.run('company_subtitle', 'Unidade de Controle Operacional de Suprimentos');
  insertSetting.run('technical_responsible', 'Nicoly Vitória');
  insertSetting.run('technical_document', 'CREA/CRQ: 104.829-SP');
  insertSetting.run('contact_email', 'almoxarifado.central@operacoes.com.br');
  insertSetting.run('contact_phone', '(11) 4002-8922');
  insertSetting.run('currency', 'BRL');

  // Sectors
  const insertSector = db.prepare('INSERT INTO sectors (code, name, responsible, cost_center, email) VALUES (?, ?, ?, ?, ?)');
  insertSector.run('MAN', 'Manutenção Industrial & Mecânica', 'Carlos Eduardo Silva', 'CC-1010', 'manutencao@empresa.com.br');
  insertSector.run('PROD', 'Linha de Produção 01', 'Juliana Fernandes', 'CC-2020', 'producao01@empresa.com.br');
  insertSector.run('LOG', 'Logística & Expedição', 'Roberto Mendes', 'CC-3030', 'logistica@empresa.com.br');
  insertSector.run('SEG', 'Segurança do Trabalho (SESMT)', 'Amanda Costa', 'CC-4040', 'seguranca@empresa.com.br');
  insertSector.run('QUAL', 'Controle e Garantia da Qualidade', 'Fernando Albuquerque', 'CC-5050', 'qualidade@empresa.com.br');
  insertSector.run('ADM', 'Administração & Recursos Humanos', 'Mariana Rocha', 'CC-6060', 'adm@empresa.com.br');

  // Users
  const insertUser = db.prepare('INSERT INTO users (username, name, role, sector_id) VALUES (?, ?, ?, ?)');
  insertUser.run('admin', 'Nicoly Vitória', 'ADMIN', null);
  insertUser.run('almoxarife', 'Marcos Vinícius (Almoxarife Chefe)', 'ALMOXARIFE', null);
  insertUser.run('requisitante', 'Carlos Eduardo (Enc. Manutenção)', 'SOLICITANTE', 1);

  // Materials
  const insertMat = db.prepare(`
    INSERT INTO materials (code, name, category, unit, current_quantity, unit_price, min_quantity, max_quantity, location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Seed sample materials across categories with realistic stock and pricing
  insertMat.run('EPI-001', 'Capacete de Segurança com Carneira Jugular MSA', 'EPIs', 'UN', 42, 38.50, 15, 80, 'Rua A - Prateleira 01');
  insertMat.run('EPI-002', 'Óculos de Proteção Antirrisco e Antiembaçante', 'EPIs', 'UN', 8, 14.90, 20, 100, 'Rua A - Prateleira 02'); // Crítico!
  insertMat.run('EPI-003', 'Luva de Vaqueta Cano Curto para Soldador', 'EPIs', 'PAR', 65, 29.80, 25, 120, 'Rua A - Prateleira 03');
  insertMat.run('EPI-004', 'Protetor Auricular Tipo Concha 24dB 3M', 'EPIs', 'UN', 4, 45.00, 10, 50, 'Rua A - Prateleira 04'); // Crítico!
  insertMat.run('FER-101', 'Jogo de Chaves Combinadas 6mm a 32mm Gedore', 'Ferramentas', 'CX', 12, 349.90, 5, 25, 'Rua B - Gaveteiro 01');
  insertMat.run('FER-102', 'Disco de Corte Inox 4.1/2" x 1,0mm Norton', 'Ferramentas', 'UN', 180, 6.50, 50, 300, 'Rua B - Prateleira 02');
  insertMat.run('FER-103', 'Alicate Universal Isolado 1000V 8" Tramontina PRO', 'Ferramentas', 'UN', 19, 58.00, 8, 40, 'Rua B - Gaveteiro 02');
  insertMat.run('ELE-201', 'Cabo Flexível 2,5mm² 750V Rolo com 100m Azul', 'Elétrica', 'ROLO', 14, 189.00, 6, 30, 'Rua C - Estante 01');
  insertMat.run('ELE-202', 'Disjuntor Bipolar Termomagnético 32A Curva C', 'Elétrica', 'UN', 3, 42.50, 10, 45, 'Rua C - Gaveteiro 03'); // Crítico!
  insertMat.run('ELE-203', 'Fita Isolante de Alta Fusão 19mm x 20m 3M', 'Elétrica', 'UN', 52, 12.80, 15, 80, 'Rua C - Gaveteiro 01');
  insertMat.run('MEC-301', 'Rolamento Rígido de Esferas 6205-2RS SKF', 'Mecânica', 'UN', 28, 48.90, 10, 60, 'Rua D - Prateleira 01');
  insertMat.run('MEC-302', 'Óleo Lubrificante Sintético ISO VG 68 Balde 20L', 'Mecânica', 'UN', 6, 420.00, 4, 15, 'Almoxarifado Químico - Palete 03');
  insertMat.run('MEC-303', 'Graxa Azul para Rolamentos Múltiplas Aplicações 1kg', 'Mecânica', 'UN', 2, 65.00, 8, 30, 'Almoxarifado Químico - Prateleira 02'); // Crítico!
  insertMat.run('CON-401', 'Fita Crepe Industrial 48mm x 50m Adelbras', 'Consumíveis', 'ROLO', 36, 9.20, 12, 70, 'Rua E - Prateleira 01');
  insertMat.run('CON-402', 'Desengripante e Lubrificante Spray WD-40 300ml', 'Consumíveis', 'UN', 24, 28.50, 10, 60, 'Rua E - Prateleira 02');
  insertMat.run('LIM-501', 'Detergente Desengraxante Alcalino Concentrado 5L', 'Limpeza', 'UN', 15, 62.00, 8, 40, 'DML - Prateleira 01');

  // Movements (initial entries and sector outputs)
  const insertMov = db.prepare(`
    INSERT INTO movements (date_time, type, material_id, sector_id, quantity, previous_balance, new_balance, unit_price, total_price, reason, document_number, responsible_person)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const today = new Date();
  const dateStr = (daysAgo: number, time = '09:30') => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    return `${d.toISOString().slice(0, 10)} ${time}:00`;
  };

  // Initial purchases (Entradas)
  insertMov.run(dateStr(20, '08:15'), 'ENTRADA', 1, null, 50, 0, 50, 38.50, 1925.00, 'Aquisição de Estoque - NF 9823', 'NF-9823', 'Marcos Vinícius');
  insertMov.run(dateStr(18, '10:00'), 'ENTRADA', 2, null, 30, 0, 30, 14.90, 447.00, 'Reposição de EPIs - NF 9845', 'NF-9845', 'Marcos Vinícius');
  insertMov.run(dateStr(15, '11:20'), 'ENTRADA', 5, null, 15, 0, 15, 349.90, 5248.50, 'Aquisição Ferramental - NF 9890', 'NF-9890', 'Marcos Vinícius');
  insertMov.run(dateStr(14, '14:00'), 'ENTRADA', 6, null, 250, 0, 250, 6.50, 1625.00, 'Lote Discos Abrasivos - NF 9912', 'NF-9912', 'Marcos Vinícius');
  insertMov.run(dateStr(12, '09:40'), 'ENTRADA', 12, null, 10, 0, 10, 420.00, 4200.00, 'Lubrificantes Maquinário - NF 9934', 'NF-9934', 'Marcos Vinícius');

  // Sector outputs (Saídas)
  insertMov.run(dateStr(8, '14:15'), 'SAIDA', 1, 1, 8, 50, 42, 38.50, 308.00, 'Atendimento de Requisição para Equipe Mecânica', 'REQ-2026-0001', 'Marcos Vinícius');
  insertMov.run(dateStr(7, '16:30'), 'SAIDA', 2, 2, 22, 30, 8, 14.90, 327.80, 'Entrega de EPIs para Turno de Produção', 'REQ-2026-0002', 'Marcos Vinícius');
  insertMov.run(dateStr(5, '10:45'), 'SAIDA', 5, 1, 3, 15, 12, 349.90, 1049.70, 'Kits de Chaves para Bancadas de Manutenção', 'REQ-2026-0003', 'Marcos Vinícius');
  insertMov.run(dateStr(3, '11:00'), 'SAIDA', 6, 1, 70, 250, 180, 6.50, 455.00, 'Corte de Estruturas Metálicas na Caldeiraria', 'REQ-2026-0004', 'Marcos Vinícius');
  insertMov.run(dateStr(2, '15:20'), 'SAIDA', 12, 2, 4, 10, 6, 420.00, 1680.00, 'Troca de Óleo Preventiva Prensa Hidráulica 03', 'REQ-2026-0005', 'Marcos Vinícius');

  // Sample Requisitions
  const insertReq = db.prepare(`
    INSERT INTO requisitions (requisition_number, date, sector_id, requester_name, status, justification, approved_by, approval_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertReqItem = db.prepare(`
    INSERT INTO requisition_items (requisition_id, material_id, quantity, unit_price, observation)
    VALUES (?, ?, ?, ?, ?)
  `);

  // Req 1: Atendida
  const r1 = insertReq.run('REQ-2026-0001', dateStr(8).slice(0, 10), 1, 'Carlos Eduardo Silva', 'APROVADA', 'Substituição de capacetes danificados em obra mecânica', 'Nicoly Vitória', dateStr(8));
  insertReqItem.run(r1.lastInsertRowid, 1, 8, 38.50, 'Urgente para equipe de caldeiraria');

  // Req 2: Atendida
  const r2 = insertReq.run('REQ-2026-0002', dateStr(7).slice(0, 10), 2, 'Juliana Fernandes', 'APROVADA', 'Óculos de proteção para novos operadores admitidos', 'Nicoly Vitória', dateStr(7));
  insertReqItem.run(r2.lastInsertRowid, 2, 22, 14.90, 'Lote para integração de novos colaboradores');

  // Req 3: Pendente (para demonstração imediata do fluxo)
  const r3 = insertReq.run('REQ-2026-0006', dateStr(0).slice(0, 10), 1, 'Carlos Eduardo Silva', 'PENDENTE', 'Manutenção corretiva no painel de comando do Britador 02', null, null);
  insertReqItem.run(r3.lastInsertRowid, 8, 2, 189.00, 'Fiação azul para relés');
  insertReqItem.run(r3.lastInsertRowid, 10, 5, 12.80, 'Fitas isolantes');
  insertReqItem.run(r3.lastInsertRowid, 15, 2, 28.50, 'Lubrificante elétrico');

  // Req 4: Pendente
  const r4 = insertReq.run('REQ-2026-0007', dateStr(0).slice(0, 10), 3, 'Roberto Mendes', 'PENDENTE', 'Material de proteção para conferência no pátio de carretas', null, null);
  insertReqItem.run(r4.lastInsertRowid, 3, 6, 29.80, 'Luvas de vaqueta para operadores de empilhadeira');
}
