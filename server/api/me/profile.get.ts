import { eq } from 'drizzle-orm'
import { profiles } from '../../db/schema'
import { withUserDb } from '../../utils/db'

// S15 โปรไฟล์ — display_name/locale เท่านั้น (email มาจาก useSupabaseUser() ฝั่ง client อยู่แล้ว)
export default defineEventHandler(event => withUserDb(event, async (tx, userId) => {
  const [profile] = await tx.select({ displayName: profiles.displayName, locale: profiles.locale })
    .from(profiles).where(eq(profiles.userId, userId))
  return { displayName: profile?.displayName ?? null, locale: profile?.locale ?? 'th' }
}))
