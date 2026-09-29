import { sql } from 'drizzle-orm'
import { z } from 'zod'
import { adminError } from '../../utils/admin'
import { withUserDb } from '../../utils/db'

const bodySchema = z.object({ globalDailyCap: z.number().int().min(0) })

// S16 "เพดานรวม / วัน" + บันทึก
export default defineEventHandler(async (event) => {
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'invalid_body', data: parsed.error.issues })

  return withUserDb(event, async (tx) => {
    try {
      await tx.execute(sql`select public.admin_set_global_cap(${parsed.data.globalDailyCap})`)
      return { ok: true }
    }
    catch (err) {
      throw adminError(err)
    }
  })
})
