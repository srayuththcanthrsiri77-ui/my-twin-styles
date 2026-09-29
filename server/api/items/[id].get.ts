import { and, desc, eq } from 'drizzle-orm'
import { items, looks, tryOnItems } from '../../db/schema'
import { withUserDb } from '../../utils/db'
import { userStorageSigner } from '../../utils/storage'

// S10 รายละเอียดชิ้น — ค้นย้อน: ลุคทั้งหมดที่เคยใช้ชิ้นนี้ (ช่วยผู้ใช้ตัดสินใจซื้อชิ้น "อยากได้")
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'invalid_id' })
  const sign = await userStorageSigner(event)

  return withUserDb(event, async (tx, userId) => {
    const [item] = await tx.select().from(items).where(and(eq(items.id, id), eq(items.userId, userId)))
    if (!item) throw createError({ statusCode: 404, statusMessage: 'item_not_found' })

    const lookRows = await tx.selectDistinct({ id: looks.id, imagePath: looks.imagePath, createdAt: looks.createdAt })
      .from(tryOnItems).innerJoin(looks, eq(looks.tryOnId, tryOnItems.tryOnId))
      .where(eq(tryOnItems.itemId, id))
      .orderBy(desc(looks.createdAt))

    const [imageUrl, lookThumbs] = await Promise.all([
      sign('items', item.imagePath),
      Promise.all(lookRows.map(async l => ({ id: l.id, imageUrl: await sign('looks', l.imagePath) }))),
    ])

    return {
      id: item.id,
      imageUrl,
      category: item.category,
      slot: item.slot,
      color: item.color,
      status: item.status,
      shopUrl: item.shopUrl,
      name: item.name,
      note: item.note,
      looks: lookThumbs,
    }
  })
})
