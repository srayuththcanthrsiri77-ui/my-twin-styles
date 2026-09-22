import { saveItemSchema, slotForCategory } from '#shared/item'
import { items } from '../db/schema'
import { withUserDb } from '../utils/db'
import { assertOwnPath } from '../utils/storage'

// S09: ผู้ใช้กดบันทึกชิ้น — path ทั้งสองต้องมาจาก /api/items/process ของผู้ใช้คนเดียวกัน
export default defineEventHandler(async (event) => {
  const parsed = saveItemSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'invalid_body', data: parsed.error.issues })
  const body = parsed.data

  return withUserDb(event, async (tx, userId) => {
    assertOwnPath(userId, body.storagePath)
    assertOwnPath(userId, body.originalStoragePath)
    const [item] = await tx.insert(items).values({
      userId,
      imagePath: body.storagePath,
      originalPath: body.originalStoragePath,
      category: body.category,
      slot: slotForCategory(body.category),
      color: body.color,
      status: body.status,
      shopUrl: body.shopUrl,
      name: body.name,
      note: body.note,
    }).returning({ id: items.id, slot: items.slot })
    return { item: item! }
  })
})
