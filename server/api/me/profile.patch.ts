import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { profiles } from '../../db/schema'
import { withUserDb } from '../../utils/db'

const bodySchema = z.object({ displayName: z.string().trim().max(50).nullable() })

// S15 แก้ชื่อผู้ใช้ — column grant อนุญาตแค่ display_name/locale (drizzle/0001_functions_and_grants.sql)
export default defineEventHandler(async (event) => {
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'invalid_body', data: parsed.error.issues })

  return withUserDb(event, async (tx, userId) => {
    await tx.update(profiles).set({ displayName: parsed.data.displayName || null }).where(eq(profiles.userId, userId))
    return { ok: true }
  })
})
