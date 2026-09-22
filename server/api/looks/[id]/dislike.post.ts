import { eq } from 'drizzle-orm'
import { dislikeSchema } from '#shared/look'
import { lookDislikes, looks } from '../../../db/schema'
import { withUserDb } from '../../../utils/db'

// S06 👎: ใช้วัดคุณภาพ ไม่คืนโควต้า (CONTEXT.md) — กดซ้ำ = แก้เหตุผลเดิม
export default defineEventHandler(async (event) => {
  const lookId = getRouterParam(event, 'id')
  if (!lookId) throw createError({ statusCode: 400, statusMessage: 'invalid_id' })
  const parsed = dislikeSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'invalid_body', data: parsed.error.issues })

  return withUserDb(event, async (tx) => {
    // select ผ่าน looks_select_own ก่อน — ลุคของคนอื่นจะไม่เจอแถวเลย ได้ 404 ที่อ่านง่ายกว่า RLS error ตรง ๆ
    const [look] = await tx.select({ id: looks.id }).from(looks).where(eq(looks.id, lookId))
    if (!look) throw createError({ statusCode: 404, statusMessage: 'look_not_found' })
    await tx.insert(lookDislikes).values({ lookId, reason: parsed.data.reason })
      .onConflictDoUpdate({ target: lookDislikes.lookId, set: { reason: parsed.data.reason } })
    return { ok: true }
  })
})
