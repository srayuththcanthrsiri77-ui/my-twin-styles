import { eq } from 'drizzle-orm'
import { poses } from '../db/schema'
import { withUserDb } from '../utils/db'
import { removeUserStorage } from '../utils/storage'

// S15 "ลบ twin" — ลบท่าทั้งหมด · ลุคที่มีอยู่แล้วไม่กระทบ (poses ไม่ผูกกับ looks โดยตรง — ADR-0003)
// ลบไฟล์จริงก่อนค่อยลบแถว (เหมือน /api/looks/[id].delete.ts) กันไฟล์ค้างไม่มีใครลบซ้ำถ้าลบไฟล์พลาด
export default defineEventHandler(async (event) => {
  const paths = await withUserDb(event, async (tx, userId) => {
    const rows = await tx.select({ storagePath: poses.storagePath }).from(poses).where(eq(poses.userId, userId))
    return rows.map(r => r.storagePath)
  })

  const remove = await removeUserStorage(event)
  await Promise.all(paths.map(p => remove('poses', p)))

  return withUserDb(event, async (tx, userId) => {
    await tx.delete(poses).where(eq(poses.userId, userId))
    return { ok: true, removed: paths.length }
  })
})
