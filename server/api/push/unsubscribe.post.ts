import { eq } from 'drizzle-orm'
import { pushSubscriptions } from '../../db/schema'
import { pushUnsubscribeSchema } from '#shared/push'
import { withUserDb } from '../../utils/db'

// S17: เลิกรับแจ้งเตือนจากอุปกรณ์นี้ — RLS กันลบได้แค่แถวของตัวเอง (ownerCrud)
export default defineEventHandler(async (event) => {
  const parsed = pushUnsubscribeSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'invalid_body', data: parsed.error.issues })

  return withUserDb(event, async (tx) => {
    await tx.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, parsed.data.endpoint))
    return { ok: true }
  })
})
