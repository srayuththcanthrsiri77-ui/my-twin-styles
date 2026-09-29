import { sql } from 'drizzle-orm'
import { adminError } from '../../utils/admin'
import { withUserDb } from '../../utils/db'

// S16 "รายการ 👎 ล่าสุด" — ไม่มีรูปลุคเลย (ADR-0003) เห็นแค่ id/เหตุผล/เวลา
export default defineEventHandler(event => withUserDb(event, async (tx) => {
  try {
    const rows = await tx.execute<{
      look_id: string
      reason: string
      created_at: string
    }>(sql`select * from public.admin_recent_dislikes(20)`)
    return rows.map(r => ({
      lookId: r.look_id,
      reason: r.reason,
      createdAt: r.created_at,
    }))
  }
  catch (err) {
    throw adminError(err)
  }
}))
