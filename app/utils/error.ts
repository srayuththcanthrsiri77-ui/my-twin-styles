// แปลง error จาก Supabase/API (มักเป็นภาษาอังกฤษ) เป็นข้อความไทยให้ผู้ใช้อ่านเข้าใจ
// ใช้ร่วมกันทุกจุดที่โชว์ error เป็น toast — คงรายละเอียดที่เป็นประโยชน์ (เช่นเวลาที่ต้องรอ) ไว้ ที่เหลือ fallback ทั่วไป
export function friendlyErrorMessage(error: unknown): string {
  // error จาก $fetch ที่ server เราตั้งใจ createError() มาเป็นภาษาไทยแล้ว (เช่น "โควต้าวันนี้หมดแล้ว") ใช้ตรง ๆ ได้เลย
  const serverMessage = (error as { data?: { message?: string } })?.data?.message
  if (serverMessage) return serverMessage

  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : ''

  const rateLimit = message.match(/after (\d+) seconds/i)
  if (rateLimit) return `ขอถี่เกินไป กรุณารออีก ${rateLimit[1]} วินาทีแล้วลองใหม่`

  if (/expired|invalid/i.test(message)) return 'ลิงก์หรือรหัสหมดอายุหรือไม่ถูกต้อง กรุณาลองใหม่'

  return 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
}
