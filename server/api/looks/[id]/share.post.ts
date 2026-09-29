import { and, desc, eq, isNull } from 'drizzle-orm'
import { looks, shareLinks } from '../../../db/schema'
import { withUserDb } from '../../../utils/db'
import { generateShareToken } from '../../../utils/share'

// S13 กด "แชร์": ลุคเดียวใช้ลิงก์เดียว — ถ้ามีลิงก์ยังไม่เพิกถอนอยู่แล้วคืนอันเดิม (ไม่มี token ให้อีกเพราะ
// เก็บแค่ hash — ADR-0007) ไม่งั้นสร้างใหม่แล้วคืน token ดิบครั้งเดียว (เจ้าของต้อง copy เก็บไว้เอง)
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'invalid_id' })
  const config = useRuntimeConfig(event)

  return withUserDb(event, async (tx, userId) => {
    const [look] = await tx.select({ id: looks.id }).from(looks).where(and(eq(looks.id, id), eq(looks.userId, userId)))
    if (!look) throw createError({ statusCode: 404, statusMessage: 'look_not_found' })

    const [existing] = await tx.select({ createdAt: shareLinks.createdAt, viewCount: shareLinks.viewCount })
      .from(shareLinks).where(and(eq(shareLinks.lookId, id), isNull(shareLinks.revokedAt)))
      .orderBy(desc(shareLinks.createdAt)).limit(1)
    if (existing) return { token: null, url: null, createdAt: existing.createdAt, viewCount: existing.viewCount }

    const { token, tokenHash } = generateShareToken()
    const [row] = await tx.insert(shareLinks).values({ lookId: id, tokenHash }).returning({ createdAt: shareLinks.createdAt })
    return { token, url: `${config.public.siteUrl}/l/${token}`, createdAt: row!.createdAt, viewCount: 0 }
  })
})
