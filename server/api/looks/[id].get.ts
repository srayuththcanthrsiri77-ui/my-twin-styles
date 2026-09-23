import { and, eq } from 'drizzle-orm'
import { items, lookDislikes, lookOccasions, looks, tryOnItems, tryOns } from '../../db/schema'
import { withUserDb } from '../../utils/db'
import { userStorageSigner } from '../../utils/storage'

// S06 รายละเอียดลุค — ชิ้นที่ใช้รวมส่วนประกอบด้วย (แนบดูคู่ แม้ไม่ถูก render — CONTEXT.md)
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'invalid_id' })
  const sign = await userStorageSigner(event)

  return withUserDb(event, async (tx, userId) => {
    const [look] = await tx.select({
      id: looks.id, tryOnId: looks.tryOnId, imagePath: looks.imagePath, isFavorite: looks.isFavorite,
      note: looks.note, createdAt: looks.createdAt, poseId: tryOns.poseId, remixOfLookId: tryOns.remixOfLookId,
    }).from(looks).innerJoin(tryOns, eq(tryOns.id, looks.tryOnId)).where(and(eq(looks.id, id), eq(looks.userId, userId)))
    if (!look) throw createError({ statusCode: 404, statusMessage: 'look_not_found' })

    const [usedItems, occasionRows, [dislike]] = await Promise.all([
      tx.select({ slot: tryOnItems.slot, position: tryOnItems.position, item: items })
        .from(tryOnItems).leftJoin(items, eq(items.id, tryOnItems.itemId))
        .where(eq(tryOnItems.tryOnId, look.tryOnId))
        .orderBy(tryOnItems.slot, tryOnItems.position),
      tx.select({ occasionId: lookOccasions.occasionId }).from(lookOccasions).where(eq(lookOccasions.lookId, look.id)),
      tx.select({ reason: lookDislikes.reason }).from(lookDislikes).where(eq(lookDislikes.lookId, look.id)),
    ])

    // เซ็นรูปลุค + รูปทุกชิ้นพร้อมกัน — ก่อนหน้านี้ `await sign()` ทีละ property ทำให้รูปลุครอเสร็จ
    // ก่อนถึงเริ่มเซ็นรูปชิ้นได้ (บั๊กเดียวกับ useFetch ต่อกันฝั่งหน้าเว็บ)
    const [imageUrl, itemsWithUrls] = await Promise.all([
      sign('looks', look.imagePath),
      Promise.all(usedItems.map(async u => ({
        slot: u.slot,
        id: u.item?.id ?? null,
        name: u.item?.name ?? null,
        category: u.item?.category ?? null,
        // ชิ้นที่ถูกลบไปแล้ว → item เป็น null (FK item_id set null on delete)
        imageUrl: u.item ? await sign('items', u.item.imagePath) : null,
      }))),
    ])

    return {
      id: look.id,
      imageUrl,
      isFavorite: look.isFavorite,
      note: look.note,
      createdAt: look.createdAt,
      poseId: look.poseId,
      remixOfLookId: look.remixOfLookId,
      occasionIds: occasionRows.map(o => o.occasionId),
      dislikeReason: dislike?.reason ?? null,
      items: itemsWithUrls,
    }
  })
})
