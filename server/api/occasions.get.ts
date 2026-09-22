import { eq, isNull, or } from 'drizzle-orm'
import { occasions } from '../db/schema'
import { withUserDb } from '../utils/db'

// S05/S06: โอกาสของระบบ (user_id null) + ที่ผู้ใช้ตั้งเอง — ใช้เป็นตัวกรองและ tag ของลุค
export default defineEventHandler(event => withUserDb(event, async (tx, userId) => {
  const rows = await tx.select().from(occasions).where(or(isNull(occasions.userId), eq(occasions.userId, userId)))
  return rows.map(r => ({ id: r.id, name: r.name, custom: r.userId !== null }))
}))
