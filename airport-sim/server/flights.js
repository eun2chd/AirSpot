import { db } from './db.js';

export const CAPACITY = 50;
const CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // 0/O/1/I 제외

export function getKSTDateString(d = new Date()) {
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

function genUniqueCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const s = Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
    const code = `HL-${s}`;
    const exists = db.prepare('SELECT 1 FROM flights WHERE code = ?').get(code);
    if (!exists) return code;
  }
  throw new Error('code generation failed');
}

// 대기열에서 오늘 남은 슬롯만큼 오래된 순으로 승격 (전날 대기분이 오늘 우선 배정됨)
function claimSlots(today) {
  const activeCount = db.prepare('SELECT COUNT(*) c FROM flights WHERE slot_date = ?').get(today).c;
  const remaining = CAPACITY - activeCount;
  if (remaining <= 0) return;

  const queued = db.prepare('SELECT id FROM flights WHERE status = ? ORDER BY created_at ASC LIMIT ?').all('queued', remaining);
  const update = db.prepare('UPDATE flights SET status = ?, slot_date = ?, slot_no = ? WHERE id = ?');
  let slotNo = activeCount;
  for (const row of queued) {
    slotNo++;
    update.run('active', today, slotNo, row.id);
  }
}

export function registerFlight({ name, desc, link }) {
  const today = getKSTDateString();
  claimSlots(today);

  const activeCount = db.prepare('SELECT COUNT(*) c FROM flights WHERE slot_date = ?').get(today).c;
  const code = genUniqueCode();
  const now = Date.now();

  if (activeCount < CAPACITY) {
    const slotNo = activeCount + 1;
    db.prepare(
      'INSERT INTO flights (code, name, tagline, link, status, slot_date, slot_no, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(code, name, desc, link ?? null, 'active', today, slotNo, now);
    return { code, status: 'active', slotNo, capacity: CAPACITY };
  }

  db.prepare(
    'INSERT INTO flights (code, name, tagline, link, status, slot_date, slot_no, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(code, name, desc, link ?? null, 'queued', null, null, now);
  const queuePosition = db.prepare('SELECT COUNT(*) c FROM flights WHERE status = ? AND created_at <= ?').get('queued', now).c;
  return { code, status: 'queued', queuePosition, capacity: CAPACITY };
}

export function getTodayStatus() {
  const today = getKSTDateString();
  claimSlots(today);

  const activeCount = db.prepare('SELECT COUNT(*) c FROM flights WHERE slot_date = ?').get(today).c;
  const queuedCount = db.prepare('SELECT COUNT(*) c FROM flights WHERE status = ?').get('queued').c;
  const flights = db
    .prepare('SELECT code, name, tagline AS "desc", link, slot_no FROM flights WHERE slot_date = ? ORDER BY slot_no ASC')
    .all(today);

  return { date: today, capacity: CAPACITY, activeCount, remaining: CAPACITY - activeCount, queuedCount, flights };
}
