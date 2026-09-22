import { and, desc, eq, inArray } from 'drizzle-orm'
import { lookOccasions, looks, tryOns } from '../db/schema'
import { withUserDb } from '../utils/db'
import { userStorageSigner } from '../utils/storage'

// S05 Lookbook: การลองที่ค้างอยู่ (queued/running) ขึ้นก่อน · ลุคที่สำเร็จแล้วเรียงใหม่สุดก่อน
export default defineEventHandler(async (event) => {
  const sign = await userStorageSigner(event)
  return withUserDb(event, async (tx, userId) => {
    const pending = await tx.select({ id: tryOns.id, status: tryOns.status, createdAt: tryOns.createdAt })
      .from(tryOns)
      .where(and(eq(tryOns.userId, userId), inArray(tryOns.status, ['queued', 'running'])))
      .orderBy(desc(tryOns.createdAt))

    const rows = await tx.select().from(looks).where(eq(looks.userId, userId)).orderBy(desc(looks.createdAt))
    const lookIds = rows.map(r => r.id)
    const occasionRows = lookIds.length
      ? await tx.select().from(lookOccasions).where(inArray(lookOccasions.lookId, lookIds))
      : []
    const occasionsByLook = new Map<string, string[]>()
    for (const o of occasionRows) occasionsByLook.set(o.lookId, [...(occasionsByLook.get(o.lookId) ?? []), o.occasionId])

    const list = await Promise.all(rows.map(async r => ({
      id: r.id,
      imageUrl: await sign('looks', r.imagePath),
      isFavorite: r.isFavorite,
      note: r.note,
      createdAt: r.createdAt,
      occasionIds: occasionsByLook.get(r.id) ?? [],
    })))
    return { pending, looks: list }
  })
})
