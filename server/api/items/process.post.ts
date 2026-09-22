import { z } from 'zod'
import { requireUser } from '../../utils/auth'
import { getItemProcessAdapter } from '../../utils/item-processing'
import { assertOwnPath, userStorageSigner } from '../../utils/storage'

const bodySchema = z.object({ storagePath: z.string().min(1).max(300) })

// S09: รูปอัปโหลดแล้ว → ลบพื้นหลัง + เดาหมวด/สี ก่อนโชว์ฟอร์มให้ผู้ใช้ยืนยัน — ยังไม่บันทึกลงตู้
export default defineEventHandler(async (event) => {
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'invalid_body', data: parsed.error.issues })
  const user = await requireUser(event)
  assertOwnPath(user.id, parsed.data.storagePath)
  const sign = await userStorageSigner(event)
  const adapter = getItemProcessAdapter(event)
  return adapter.process(await sign('items', parsed.data.storagePath))
})
