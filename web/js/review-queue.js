import { reviewAPI, isReviewDemo } from './review-api.js';
const labels = { submitted: 'ส่งแล้ว', in_progress: 'กำลังแก้ไข', recheck: 'รอตรวจซ้ำ', closed: 'ปิดแล้ว' };
const actions = { submitted: 'ส่งข้อเสนอ', start: 'เริ่มแก้ไข', resubmit: 'ส่งให้ตรวจซ้ำ', approve: 'รับรองและปิดงาน', request_changes: 'ขอแก้ไขเพิ่มเติม', comment: 'ตอบกลับ' };
const $ = (id) => document.getElementById(id);
let user, tickets = [];
function el(tag, text) { const node = document.createElement(tag); node.textContent = text; return node; }
function snapshotText(snapshot) {
  if (!snapshot) return 'ไม่พบเนื้อหาปัจจุบัน';
  try { return JSON.stringify(JSON.parse(snapshot), null, 2); } catch { return snapshot; }
}
function render() {
  $('review-tickets').replaceChildren();
  const shown = tickets.filter((t) => $('review-filter').value === 'all' || t.status === $('review-filter').value);
  if (!shown.length) $('review-tickets').append(el('p', 'ยังไม่มีรายการในสถานะนี้'));
  for (const ticket of shown) {
    const card = el('article', ''); card.className = 'review-ticket';
    card.append(el('h2', `#${ticket.id} · ${ticket.title}`), el('p', `${labels[ticket.status]} · ${ticket.target}`));
    if (ticket.current_snapshot !== ticket.snapshot) card.append(el('p', 'เนื้อหาปัจจุบันต่างจากฉบับที่ส่งตรวจ · ต้องส่งตรวจฉบับใหม่ก่อนรับรอง'));
    const source = el('details', '');
    source.append(el('summary', 'เปิดอ่านเนื้อหาฉบับที่ส่งตรวจและฉบับปัจจุบัน'), el('h3', 'ฉบับที่ส่งตรวจ'), el('pre', snapshotText(ticket.snapshot)), el('h3', 'ฉบับปัจจุบัน'), el('pre', snapshotText(ticket.current_snapshot)));
    card.append(source);
    const history = el('ol', '');
    for (const event of ticket.events) {
      const row = el('li', `${event.name} · ${event.role === 'expert' ? 'ผู้เชี่ยวชาญ' : 'ผู้พัฒนา'} · ${actions[event.action]} · ${new Date(event.created * 1000).toLocaleString('th-TH')}\n${event.comment}`);
      const original = el('details', '');
      original.append(el('summary', 'เนื้อหา ณ เวลานั้น'), el('pre', snapshotText(event.snapshot)));
      row.append(original); history.append(row);
    }
    card.append(history);
    const form = el('form', ''); form.className = 'review-form';
    const label = el('label', 'คำตอบ / รายละเอียดการแก้ไข / เหตุผลประกอบ');
    const comment = el('textarea', ''); comment.required = true; comment.maxLength = 10000; label.append(comment);
    const selectLabel = el('label', 'ดำเนินการ'); const select = el('select', '');
    let available = ['comment'];
    if (user.role === 'developer' && ticket.status === 'submitted') available.push('start');
    if (user.role === 'developer' && ['in_progress', 'recheck'].includes(ticket.status)) available.push('resubmit');
    if (user.role === 'expert' && ticket.status === 'recheck') {
      available.push('request_changes');
      if (ticket.current_snapshot && ticket.current_snapshot === ticket.snapshot) available.push('approve');
    }
    for (const action of available) { const option = el('option', actions[action]); option.value = action; select.append(option); }
    selectLabel.append(select);
    let demoText;
    if (isReviewDemo && user.role === 'developer' && ['in_progress', 'recheck'].includes(ticket.status)) {
      const editLabel = el('label', 'แก้ข้อความจำลอง (ใช้เมื่อเลือกส่งให้ตรวจซ้ำ ไม่แก้บทความจริง)');
      demoText = el('textarea', ''); demoText.maxLength = 20000;
      const content = JSON.parse(ticket.current_snapshot);
      demoText.value = content.region?.patient_blurb_th ?? content.text ?? '';
      editLabel.append(demoText); form.append(editLabel);
    }
    const button = el('button', isReviewDemo ? 'บันทึกขั้นตอนเดโม' : 'บันทึกและส่ง'); button.type = 'submit';
    const message = el('p', ''); message.setAttribute('role', 'status');
    form.append(label, selectLabel, button, message);
    form.addEventListener('submit', async (event) => {
      event.preventDefault(); if (!comment.value.trim()) return;
      button.disabled = true;
      try {
        await reviewAPI(`tickets/${ticket.id}`, { version: ticket.version, action: select.value, comment: comment.value.trim(), snapshot: ticket.current_snapshot, ...(demoText ? { demo_text: demoText.value } : {}) });
        message.textContent = 'ส่งแล้ว';
        await refresh();
      } catch (err) { message.textContent = err.message; }
      finally { button.disabled = false; }
    });
    card.append(form); $('review-tickets').append(card);
  }
}
async function refresh() {
  const me = await reviewAPI('me'); user = me.user;
  $('review-login').hidden = true; $('review-account').hidden = false;
  $('review-identity').textContent = `${user.name} · ${user.role === 'developer' ? 'ผู้พัฒนา (เห็นข้อเสนอทั้งหมด)' : 'ผู้เชี่ยวชาญ (เห็นข้อเสนอของตนเอง)'}`;
  const result = await reviewAPI('tickets'); tickets = result.tickets;
  render(); $('review-message').textContent = `อัปเดตล่าสุด ${new Date().toLocaleTimeString('th-TH')} · ${tickets.length} รายการ`;
}
$('review-login').addEventListener('submit', async (event) => {
  event.preventDefault(); const form = event.currentTarget; const button = form.querySelector('button'); button.disabled = true;
  try {
    await reviewAPI('login', Object.fromEntries(new FormData(form)));
    form.reset(); await refresh();
  } catch (err) { $('review-message').textContent = err.message; }
  finally { button.disabled = false; }
});
$('review-logout').addEventListener('click', async () => {
  try { await reviewAPI('logout', {}); location.reload(); }
  catch (err) { $('review-message').textContent = err.message; }
});
$('review-refresh').addEventListener('click', () => refresh().catch((err) => { $('review-message').textContent = err.message; }));
$('review-filter').addEventListener('change', render);
if (isReviewDemo) {
  $('review-demo').hidden = false;
  $('review-login').hidden = true;
  $('review-logout').hidden = true;
  $('review-home').href = './?demo=1';
  for (const role of ['expert', 'developer']) {
    $(`demo-${role}`).addEventListener('click', async () => {
      try { await reviewAPI('login', { role }); await refresh(); }
      catch (err) { $('review-message').textContent = err.message; }
    });
  }
  $('demo-seed').addEventListener('click', async () => {
    $('demo-seed').disabled = true;
    try { await reviewAPI('seed', {}); await refresh(); }
    catch (err) { $('review-message').textContent = err.message; }
    finally { $('demo-seed').disabled = false; }
  });
}
refresh().catch((err) => { $('review-message').textContent = err.message; });
