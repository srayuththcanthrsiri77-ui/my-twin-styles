import { occasionCreateSchema } from '#shared/look'
import { occasions } from '../db/schema'
import { withUserDb } from '../utils/db'

// S06: ผู้ใช้ตั้งโอกาสเอง (CONTEXT.md: โอกาส "ตั้งเอง")
export default defineEventHandler(async (event) => {
  const parsed = occasionCreateSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'invalid_body', data: parsed.error.issues })
  return withUserDb(event, async (tx, userId) => {
    const [row] = await tx.insert(occasions).values({ userId, name: parsed.data.name }).returning({ id: occasions.id, name: occasions.name })
    return { occasion: { id: row!.id, name: row!.name, custom: true } }
  })
})
