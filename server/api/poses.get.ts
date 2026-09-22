import { asc, eq } from 'drizzle-orm'
import { poses } from '../db/schema'
import { withUserDb } from '../utils/db'
import { userStorageSigner } from '../utils/storage'

// S11 Builder: รายการท่าให้เลือก
export default defineEventHandler(async (event) => {
  const sign = await userStorageSigner(event)
  return withUserDb(event, async (tx, userId) => {
    const rows = await tx.select().from(poses).where(eq(poses.userId, userId)).orderBy(asc(poses.sortOrder))
    return Promise.all(rows.map(async r => ({
      id: r.id,
      imageUrl: await sign('poses', r.storagePath),
      quality: r.quality,
    })))
  })
})
