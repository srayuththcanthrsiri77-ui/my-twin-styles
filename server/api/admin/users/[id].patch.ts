import { sql } from 'drizzle-orm'
import { z } from 'zod'
import { adminError } from '../../../utils/admin'
import { withUserDb } from '../../../utils/db'

const bodySchema = z.object({ dailyQuota: z.number().int().min(0).max(1000) })

// S16 ตาราง "ผู้ใช้" คอลัมน์ "บันทึก" — ปรับโควต้ารายคน
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'invalid_id' })
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'invalid_body', data: parsed.error.issues })

  return withUserDb(event, async (tx) => {
    try {
      await tx.execute(sql`select public.admin_set_user_quota(${id}, ${parsed.data.dailyQuota})`)
      return { ok: true }
    }
    catch (err) {
      throw adminError(err)
    }
  })
})
