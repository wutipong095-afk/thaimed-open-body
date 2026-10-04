import { isReviewDemo, demoAPI } from './review-demo.js';
export { isReviewDemo };
export async function reviewAPI(path, data) {
  if (isReviewDemo) return demoAPI(path, data);
  const res = await fetch(`/api/reviews/${path}`, {
    method: data === undefined ? 'GET' : 'POST',
    credentials: 'same-origin', cache: 'no-store',
    headers: data === undefined ? {} : { 'Content-Type': 'application/json', 'X-Review-Request': '1' },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
  let result;
  try { result = await res.json(); } catch { throw new Error('ระบบกลางยังไม่พร้อมใช้งาน กรุณาเปิดผ่านเซิร์ฟเวอร์ของโครงการ'); }
  if (!res.ok || !result.ok) throw new Error(result.error || 'ติดต่อระบบกลางไม่ได้');
  return result;
}
