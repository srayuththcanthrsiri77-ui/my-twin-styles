import { and, eq, isNull, sql } from 'drizzle-orm'
import { items, looks, shareLinks, tryOnItems } from '../../db/schema'
import { openPrivilegedDb, privilegedStorage } from '../../utils/privileged'
import { hashShareToken } from '../../utils/share'

// S14 หน้าแชร์สาธารณะ — ไม่มี session ผู้ใช้ (ADR-0005 ผู้เรียกที่ 4): ตรวจ hash token → ยังไม่ถูกเพิกถอน →
// เซ็นได้เฉพาะรูปของลุคนั้น ทีละรูป อายุสั้น · ห้ามอ่านหรือคืนข้อมูลท่า (ADR-0003) — ไม่แคชหน้านี้เลย (nuxt.config)
export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) throw createError({ statusCode: 400, statusMessage: 'invalid_token' })
  const tokenHash = hashShareToken(token)
  const db = openPrivilegedDb(event)

  const [link] = await db.select({ id: shareLinks.id, lookId: shareLinks.lookId })
    .from(shareLinks).where(and(eq(shareLinks.tokenHash, tokenHash), isNull(shareLinks.revokedAt)))
  if (!link) throw createError({ statusCode: 404, statusMessage: 'link_not_found' })

  const [look] = await db.select({ tryOnId: looks.tryOnId, imagePath: looks.imagePath }).from(looks).where(eq(looks.id, link.lookId))
  // ลุคถูกลบไปแล้ว — ปกติ FK cascade ลบแถว share_links ไปด้วยแล้ว กันไว้เผื่อ race condition
  if (!look) throw createError({ statusCode: 404, statusMessage: 'link_not_found' })

  await db.update(shareLinks).set({ viewCount: sql`${shareLinks.viewCount} + 1` }).where(eq(shareLinks.id, link.id))

  const usedItems = await db.select({ slot: tryOnItems.slot, item: items })
    .from(tryOnItems).leftJoin(items, eq(items.id, tryOnItems.itemId))
    .where(eq(tryOnItems.tryOnId, look.tryOnId))
    .orderBy(tryOnItems.slot, tryOnItems.position)

  const storage = privilegedStorage(event)
  const sign = async (bucket: 'looks' | 'items', path: string) => {
    const { data, error } = await storage.from(bucket).createSignedUrl(path, 300)
    if (error || !data) throw error ?? new Error('sign failed')
    return data.signedUrl
  }

  const [imageUrl, itemsWithUrls] = await Promise.all([
    sign('looks', look.imagePath),
    Promise.all(usedItems.map(async u => ({
      slot: u.slot,
      name: u.item?.name ?? null,
      category: u.item?.category ?? null,
      // ชิ้นที่ถูกลบไปแล้ว → item เป็น null
      imageUrl: u.item ? await sign('items', u.item.imagePath) : null,
    }))),
  ])

  return { imageUrl, items: itemsWithUrls }
})
