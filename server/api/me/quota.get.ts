import { and, eq, sql } from 'drizzle-orm'
import { dailyUsage, profiles } from '../../db/schema'
import { withUserDb } from '../../utils/db'

// S11 Builder: แสดงโควต้าคงเหลือบนปุ่มลองชุด (ADR-0002)
export default defineEventHandler(event => withUserDb(event, async (tx, userId) => {
  const [profile] = await tx.select({ dailyQuota: profiles.dailyQuota }).from(profiles).where(eq(profiles.userId, userId))
  const [usage] = await tx.select({ used: dailyUsage.used }).from(dailyUsage)
    .where(and(eq(dailyUsage.userId, userId), eq(dailyUsage.day, sql`(now() at time zone 'Asia/Bangkok')::date`)))
  const dailyQuota = profile?.dailyQuota ?? 0
  const used = usage?.used ?? 0
  return { dailyQuota, used, remaining: Math.max(0, dailyQuota - used) }
}))
