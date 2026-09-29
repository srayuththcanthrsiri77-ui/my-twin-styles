import { and, eq, isNull } from 'drizzle-orm'
import { shareLinks } from '../../../db/schema'
import { withUserDb } from '../../../utils/db'

// S13 "เพิกถอนลิงก์" — ปิด token ทันที (column grant อนุญาตแค่ revoked_at — drizzle/0001_functions_and_grants.sql)
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'invalid_id' })

  return withUserDb(event, async (tx) => {
    // update ผ่าน share_links_update_own (ownsLook) เสมอ — ลุคของคนอื่นจะไม่มีแถวให้แก้เลย
    await tx.update(shareLinks).set({ revokedAt: new Date() })
      .where(and(eq(shareLinks.lookId, id), isNull(shareLinks.revokedAt)))
    return { ok: true }
  })
})
