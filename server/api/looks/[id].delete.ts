import { and, eq } from 'drizzle-orm'
import { looks } from '../../db/schema'
import { withUserDb } from '../../utils/db'
import { removeUserStorage } from '../../utils/storage'

// S07 "ลบลุคใหม่": ลบไฟล์จริงก่อนค่อยลบแถว (ADR-0003) — ถ้าลบไฟล์ไม่สำเร็จ ไม่ลบแถว กันไฟล์ค้างไม่มีใครลบซ้ำ
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'invalid_id' })

  const imagePath = await withUserDb(event, async (tx, userId) => {
    const [look] = await tx.select({ imagePath: looks.imagePath }).from(looks)
      .where(and(eq(looks.id, id), eq(looks.userId, userId)))
    if (!look) throw createError({ statusCode: 404, statusMessage: 'look_not_found' })
    return look.imagePath
  })

  const remove = await removeUserStorage(event)
  await remove('looks', imagePath)

  return withUserDb(event, async (tx, userId) => {
    await tx.delete(looks).where(and(eq(looks.id, id), eq(looks.userId, userId)))
    return { ok: true }
  })
})
