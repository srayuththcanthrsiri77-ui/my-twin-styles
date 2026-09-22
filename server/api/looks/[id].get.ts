import { and, eq } from 'drizzle-orm'
import { items, lookDislikes, lookOccasions, looks, tryOnItems } from '../../db/schema'
import { withUserDb } from '../../utils/db'
import { userStorageSigner } from '../../utils/storage'

// S06 รายละเอียดลุค — ชิ้นที่ใช้รวมส่วนประกอบด้วย (แนบดูคู่ แม้ไม่ถูก render — CONTEXT.md)
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'invalid_id' })
  const sign = await userStorageSigner(event)

  return withUserDb(event, async (tx, userId) => {
    const [look] = await tx.select().from(looks).where(and(eq(looks.id, id), eq(looks.userId, userId)))
    if (!look) throw createError({ statusCode: 404, statusMessage: 'look_not_found' })

    const [usedItems, occasionRows, [dislike]] = await Promise.all([
      tx.select({ slot: tryOnItems.slot, position: tryOnItems.position, item: items })
        .from(tryOnItems).leftJoin(items, eq(items.id, tryOnItems.itemId))
        .where(eq(tryOnItems.tryOnId, look.tryOnId))
        .orderBy(tryOnItems.slot, tryOnItems.position),
      tx.select({ occasionId: lookOccasions.occasionId }).from(lookOccasions).where(eq(lookOccasions.lookId, look.id)),
      tx.select({ reason: lookDislikes.reason }).from(lookDislikes).where(eq(lookDislikes.lookId, look.id)),
    ])

    return {
      id: look.id,
      imageUrl: await sign('looks', look.imagePath),
      isFavorite: look.isFavorite,
      note: look.note,
      createdAt: look.createdAt,
      occasionIds: occasionRows.map(o => o.occasionId),
      dislikeReason: dislike?.reason ?? null,
      // ชิ้นที่ถูกลบไปแล้ว → item เป็น null (FK item_id set null on delete)
      items: await Promise.all(usedItems.map(async u => ({
        slot: u.slot,
        id: u.item?.id ?? null,
        name: u.item?.name ?? null,
        category: u.item?.category ?? null,
        imageUrl: u.item ? await sign('items', u.item.imagePath) : null,
      }))),
    }
  })
})
