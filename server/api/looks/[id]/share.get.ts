import { and, desc, eq, isNull } from 'drizzle-orm'
import { looks, shareLinks } from '../../../db/schema'
import { withUserDb } from '../../../utils/db'

// S13: สถานะลิงก์แชร์ปัจจุบันของลุคนี้ — ไม่มี token ดิบให้เห็น (เก็บแค่ hash — ADR-0007)
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'invalid_id' })

  return withUserDb(event, async (tx, userId) => {
    const [look] = await tx.select({ id: looks.id }).from(looks).where(and(eq(looks.id, id), eq(looks.userId, userId)))
    if (!look) throw createError({ statusCode: 404, statusMessage: 'look_not_found' })

    const [link] = await tx.select({ createdAt: shareLinks.createdAt, viewCount: shareLinks.viewCount })
      .from(shareLinks).where(and(eq(shareLinks.lookId, id), isNull(shareLinks.revokedAt)))
      .orderBy(desc(shareLinks.createdAt)).limit(1)

    return { active: !!link, createdAt: link?.createdAt ?? null, viewCount: link?.viewCount ?? 0 }
  })
})
