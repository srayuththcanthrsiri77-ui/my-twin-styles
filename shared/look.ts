import { z } from 'zod'

// เหตุผล 👎 (CONTEXT.md) — ใช้วัดคุณภาพ ไม่คืนโควต้า
export const DISLIKE_REASONS = ['wrong_item', 'face', 'proportion', 'other'] as const
export type DislikeReason = typeof DISLIKE_REASONS[number]
export const DISLIKE_REASON_LABEL: Record<DislikeReason, string> = {
  wrong_item: 'ชุดผิด',
  face: 'หน้าเพี้ยน',
  proportion: 'สัดส่วนแปลก',
  other: 'อื่น ๆ',
}

export const dislikeSchema = z.object({ reason: z.enum(DISLIKE_REASONS) })

// S06: แก้ได้แค่ is_favorite/note (column grant — drizzle/0001_functions_and_grants.sql)
export const lookPatchSchema = z.object({
  isFavorite: z.boolean().optional(),
  note: z.string().trim().max(300).nullable().optional(),
}).refine(b => b.isFavorite !== undefined || b.note !== undefined, { message: 'ต้องมีอย่างน้อยหนึ่งค่า' })

export const lookOccasionsSchema = z.object({ occasionIds: z.array(z.uuid()).max(10) })

// โอกาสตั้งเอง (CONTEXT.md) — ระบบมี 4 ค่าเริ่มต้น (user_id null)
export const occasionCreateSchema = z.object({ name: z.string().trim().min(1).max(30) })
