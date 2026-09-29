import { sql } from 'drizzle-orm'
import { adminError } from '../../utils/admin'
import { withUserDb } from '../../utils/db'

// S16 ตาราง "ผู้ใช้" — ค้นหาด้วยอีเมล (ว่าง = ทั้งหมด) เรียงสมัครล่าสุดก่อน
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const search = typeof q.q === 'string' ? q.q : ''

  return withUserDb(event, async (tx) => {
    try {
      const rows = await tx.execute<{
        user_id: string
        email: string
        created_at: string
        daily_quota: number
        used_today: number
      }>(sql`select * from public.admin_list_users(${search}, 50)`)
      return rows.map(r => ({
        userId: r.user_id,
        email: r.email,
        createdAt: r.created_at,
        dailyQuota: r.daily_quota,
        usedToday: r.used_today,
      }))
    }
    catch (err) {
      throw adminError(err)
    }
  })
})
