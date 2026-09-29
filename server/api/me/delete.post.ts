import { eq } from 'drizzle-orm'
import { items, looks, poses } from '../../db/schema'
import { withUserDb } from '../../utils/db'
import { deleteAuthUser } from '../../utils/privileged'
import { removeUserStorage } from '../../utils/storage'

// S15 "ลบข้อมูลทั้งหมด" (ADR-0003: การลบต้องลบไฟล์จริงใน storage)
// 1) เก็บ path รูปทั้งหมด + ลบไฟล์จริงในนามผู้ใช้เอง — storage RLS ให้สิทธิ์เจ้าของลบทั้ง 3 bucket อยู่แล้ว
//    ไม่ต้องใช้ secret key ตรงนี้เลย (ต้องทำตอนนี้ ก่อนบัญชีหาย ไม่งั้นจะ authenticate มาลบเองทีหลังไม่ได้)
// 2) ลบบัญชีจริงผ่านโซนสิทธิ์พิเศษ (ผู้เรียกที่ 5 — ADR-0005) — DB ที่เหลือ cascade ลบตามอัตโนมัติ
export default defineEventHandler(async (event) => {
  const { userId, posePaths, itemPaths, lookPaths } = await withUserDb(event, async (tx, uid) => {
    const [poseRows, itemRows, lookRows] = await Promise.all([
      tx.select({ storagePath: poses.storagePath }).from(poses).where(eq(poses.userId, uid)),
      tx.select({ imagePath: items.imagePath, originalPath: items.originalPath }).from(items).where(eq(items.userId, uid)),
      tx.select({ imagePath: looks.imagePath }).from(looks).where(eq(looks.userId, uid)),
    ])
    return {
      userId: uid,
      posePaths: poseRows.map(r => r.storagePath),
      itemPaths: [...new Set(itemRows.flatMap(r => [r.imagePath, r.originalPath]))],
      lookPaths: lookRows.map(r => r.imagePath),
    }
  })

  const remove = await removeUserStorage(event)
  await Promise.all([
    ...posePaths.map(p => remove('poses', p)),
    ...itemPaths.map(p => remove('items', p)),
    ...lookPaths.map(p => remove('looks', p)),
  ])

  await deleteAuthUser(event, userId)
  return { ok: true }
})
