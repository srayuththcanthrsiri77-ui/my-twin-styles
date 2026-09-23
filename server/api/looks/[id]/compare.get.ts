import { eq } from 'drizzle-orm'
import { diffOutfits, type OutfitItemRef } from '#shared/look'
import { items, looks, tryOnItems, tryOns } from '../../../db/schema'
import { withUserDb } from '../../../utils/db'
import { userStorageSigner } from '../../../utils/storage'

async function loadOutfitItems(tx: Parameters<Parameters<typeof withUserDb>[1]>[0], tryOnId: string): Promise<OutfitItemRef[]> {
  const rows = await tx.select({ slot: tryOnItems.slot, item: items })
    .from(tryOnItems).leftJoin(items, eq(items.id, tryOnItems.itemId))
    .where(eq(tryOnItems.tryOnId, tryOnId))
  return rows.map(r => ({ slot: r.slot, id: r.item?.id ?? null, name: r.item?.name ?? null, category: r.item?.category ?? null }))
}

// S07 เทียบคู่ — id ในพารามิเตอร์คือลุคใหม่จาก Remix ต้องมี remix_of_look_id ถึงจะเทียบได้
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'invalid_id' })
  const sign = await userStorageSigner(event)

  return withUserDb(event, async (tx) => {
    // select ผ่าน looks_select_own/try_ons_select_own เสมอ — ลุคของคนอื่นจะไม่เจอแถวเลย ไม่ต้องกรอง userId ซ้ำ
    const [remixLook] = await tx.select({ id: looks.id, imagePath: looks.imagePath, tryOnId: looks.tryOnId, remixOfLookId: tryOns.remixOfLookId })
      .from(looks).innerJoin(tryOns, eq(tryOns.id, looks.tryOnId))
      .where(eq(looks.id, id))
    if (!remixLook) throw createError({ statusCode: 404, statusMessage: 'look_not_found' })
    if (!remixLook.remixOfLookId) throw createError({ statusCode: 400, statusMessage: 'not_a_remix' })

    const [sourceLook] = await tx.select({ id: looks.id, imagePath: looks.imagePath, tryOnId: looks.tryOnId })
      .from(looks).where(eq(looks.id, remixLook.remixOfLookId))
    if (!sourceLook) throw createError({ statusCode: 404, statusMessage: 'source_look_not_found' })

    const [sourceItems, remixItems, sourceImageUrl, remixImageUrl] = await Promise.all([
      loadOutfitItems(tx, sourceLook.tryOnId),
      loadOutfitItems(tx, remixLook.tryOnId),
      sign('looks', sourceLook.imagePath),
      sign('looks', remixLook.imagePath),
    ])

    return {
      source: { id: sourceLook.id, imageUrl: sourceImageUrl },
      remix: { id: remixLook.id, imageUrl: remixImageUrl },
      changes: diffOutfits(sourceItems, remixItems),
    }
  })
})
