import { desc, eq } from 'drizzle-orm'
import { items } from '../db/schema'
import { withUserDb } from '../utils/db'
import { userStorageSigner } from '../utils/storage'

// S08: รายการทั้งตู้ — เซ็น signed URL ให้แต่ละชิ้นเพราะ bucket items เป็น private
export default defineEventHandler(async (event) => {
  const sign = await userStorageSigner(event)
  return withUserDb(event, async (tx, userId) => {
    const rows = await tx.select().from(items).where(eq(items.userId, userId)).orderBy(desc(items.createdAt))
    return Promise.all(rows.map(async r => ({
      id: r.id,
      imageUrl: await sign('items', r.imagePath),
      category: r.category,
      slot: r.slot,
      color: r.color,
      status: r.status,
      shopUrl: r.shopUrl,
      name: r.name,
      note: r.note,
    })))
  })
})
