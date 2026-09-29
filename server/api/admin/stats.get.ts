import { sql } from 'drizzle-orm'
import { adminError } from '../../utils/admin'
import { withUserDb } from '../../utils/db'

interface AdminStats {
  try_ons_today: number
  global_daily_cap: number
  new_users_today: number
  failed_today: number
  dislikes_today: number
  dislike_reasons_7d: Record<string, number>
}

// S16 สถิติภาพรวม — admin_stats() เช็ก role เองข้างใน (drizzle/0001) ไม่มีรูปท่า/รูปลุคเลย (ADR-0003)
export default defineEventHandler(event => withUserDb(event, async (tx) => {
  try {
    const [row] = await tx.execute<{ s: AdminStats }>(sql`select public.admin_stats() as s`)
    return row!.s
  }
  catch (err) {
    throw adminError(err)
  }
}))
