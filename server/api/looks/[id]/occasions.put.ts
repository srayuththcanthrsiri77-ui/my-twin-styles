import { and, eq } from 'drizzle-orm'
import { lookOccasionsSchema } from '#shared/look'
import { lookOccasions, looks } from '../../../db/schema'
import { withUserDb } from '../../../utils/db'

// S06: แทนที่ทั้งชุดโอกาสของลุคนี้ — chip เลือกไม่กี่ตัว ไม่ต้องกดยืนยันแยก
export default defineEventHandler(async (event) => {
  const lookId = getRouterParam(event, 'id')
  if (!lookId) throw createError({ statusCode: 400, statusMessage: 'invalid_id' })
  const parsed = lookOccasionsSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'invalid_body', data: parsed.error.issues })

  return withUserDb(event, async (tx, userId) => {
    const [look] = await tx.select({ id: looks.id }).from(looks).where(and(eq(looks.id, lookId), eq(looks.userId, userId)))
    if (!look) throw createError({ statusCode: 404, statusMessage: 'look_not_found' })

    await tx.delete(lookOccasions).where(eq(lookOccasions.lookId, lookId))
    if (parsed.data.occasionIds.length) {
      await tx.insert(lookOccasions).values(parsed.data.occasionIds.map(occasionId => ({ lookId, occasionId })))
    }
    return { ok: true }
  })
})
