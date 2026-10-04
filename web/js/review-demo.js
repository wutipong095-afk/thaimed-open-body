/** Isolated static demo: never calls the shared review API or changes source files. */
export const isReviewDemo = typeof location !== 'undefined' &&
  (location.hostname.endsWith('.github.io') || new URLSearchParams(location.search).get('demo') === '1');
const KEY = `body-pain-review-demo-v1:${new URL('../', import.meta.url).pathname}`;
const users = {
  expert: { id: 1, name: 'ผู้เชี่ยวชาญตัวอย่าง', role: 'expert' },
  developer: { id: 2, name: 'ผู้พัฒนาตัวอย่าง', role: 'developer' },
};
export function demoTransition(ticket, user, data) {
  if (data.version !== ticket.version) throw new Error('รายการเปลี่ยนแล้ว กรุณารีเฟรชคิว');
  const transitions = {
    start: ['developer', ['submitted'], 'in_progress'],
    resubmit: ['developer', ['in_progress', 'recheck'], 'recheck'],
    request_changes: ['expert', ['recheck'], 'in_progress'],
    approve: ['expert', ['recheck'], 'closed'],
  };
  if (data.action !== 'comment') {
    const rule = transitions[data.action];
    if (!rule || rule[0] !== user.role || !rule[1].includes(ticket.status)) throw new Error('บทบาทหรือสถานะไม่ตรงกับขั้นตอนนี้');
    if (data.action === 'approve' && ticket.snapshot !== ticket.current_snapshot) throw new Error('ต้องส่งฉบับปัจจุบันให้ตรวจใหม่ก่อนรับรอง');
    if (data.action === 'resubmit') {
      if (typeof data.demo_text === 'string') {
        const source = JSON.parse(ticket.current_snapshot);
        if (source.region) source.region.patient_blurb_th = data.demo_text;
        else source.text = data.demo_text;
        ticket.current_snapshot = JSON.stringify(source);
      }
      ticket.snapshot = ticket.current_snapshot;
    }
    ticket.status = rule[2];
  }
  ticket.version++;
  ticket.events.push({ name: user.name, role: user.role, action: data.action, comment: data.comment,
    snapshot: ticket.snapshot, created: Date.now() / 1000 });
  return ticket;
}
function read() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return { role: 'expert', tickets: [], next: 1 };
  const state = JSON.parse(raw);
  if (!Array.isArray(state.tickets) || !users[state.role] || !Number.isInteger(state.next)) throw new Error('อ่านข้อมูลเดโมไม่ได้');
  return state;
}
function createTicket(state, data) {
  if (!data.comment?.trim() || !data.snapshot || !data.target) throw new Error('กรอกความเห็นและเลือกเนื้อหาก่อนส่ง');
  const id = state.next++;
  state.tickets.unshift({ id, author: 1, target: data.target, title: data.title, snapshot: data.snapshot,
    current_snapshot: data.snapshot, status: 'submitted', version: 1, created: Date.now() / 1000,
    events: [{ name: users.expert.name, role: 'expert', action: 'submitted', comment: data.comment,
      snapshot: data.snapshot, created: Date.now() / 1000 }] });
  return id;
}
export async function demoAPI(path, data) {
  try {
    let seed;
    if (path === 'seed') {
      const response = await fetch(new URL('../../data/knowledge.json', import.meta.url));
      if (!response.ok) throw new Error('โหลดตัวอย่างไม่สำเร็จ');
      seed = (await response.json()).chunks[0];
    }
    const state = read();
    let result = { ok: true };
    if (path === 'me') result.user = users[state.role];
    else if (path === 'login' && users[data?.role]) state.role = data.role;
    else if (path === 'tickets' && data === undefined) result.tickets = state.tickets;
    else if (path === 'seed') {
      const source = seed;
      result.id = createTicket(state, { target: `knowledge:${source.id}`, title: `[เดโม] ${source.title}`, snapshot: JSON.stringify(source), comment: 'ข้อเสนอจำลอง: ช่วยตรวจความชัดเจนของคำอธิบายและแหล่งอ้างอิง แล้วส่งกลับให้ตรวจซ้ำ' });
    } else if (path === 'tickets' && data) {
      if (state.role !== 'expert') throw new Error('สลับเป็นผู้เชี่ยวชาญในหน้าเดโมก่อนส่ง');
      result.id = createTicket(state, data);
    } else if (/^tickets\/\d+$/.test(path) && data) {
      if (!data.comment?.trim()) throw new Error('กรอกเหตุผลประกอบ');
      const ticket = state.tickets.find((t) => t.id === Number(path.split('/')[1]));
      if (!ticket) throw new Error('ไม่พบรายการเดโม');
      demoTransition(ticket, users[state.role], data);
    } else throw new Error('คำสั่งเดโมไม่ถูกต้อง');
    localStorage.setItem(KEY, JSON.stringify(state));
    return result;
  } catch (err) {
    if (err.name === 'QuotaExceededError' || err.name === 'SecurityError') throw new Error('เก็บข้อมูลเดโมไม่ได้ โปรดอนุญาตพื้นที่เก็บข้อมูลของเบราว์เซอร์');
    throw err;
  }
}
