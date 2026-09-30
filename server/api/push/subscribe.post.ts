import { pushSubscriptions } from '../../db/schema'
import { pushSubscribeSchema } from '#shared/push'
import { withUserDb } from '../../utils/db'

// S17: บันทึก PushSubscription ของอุปกรณ์นี้ — endpoint เดิมอัปเดตคีย์ใหม่ทับได้ (browser คืน endpoint เดิมถ้ายัง subscribe อยู่)
export default defineEventHandler(async (event) => {
  const parsed = pushSubscribeSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'invalid_body', data: parsed.error.issues })

  return withUserDb(event, async (tx, userId) => {
    await tx.insert(pushSubscriptions)
      .values({ userId, endpoint: parsed.data.endpoint, p256dh: parsed.data.keys.p256dh, auth: parsed.data.keys.auth })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: { p256dh: parsed.data.keys.p256dh, auth: parsed.data.keys.auth },
      })
    return { ok: true }
  })
})
