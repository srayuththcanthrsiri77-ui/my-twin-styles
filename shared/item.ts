import { z } from 'zod'
import { type Slot } from './outfit'

// หมวด → ช่อง ตาม flow เพิ่มชิ้น (docs/design/my-twin-styles.drawio หน้า 3) — คงที่ไว้ก่อนจนกว่าจะมี AI เดาหมวดจริง
export const CATEGORIES = ['เสื้อ', 'กางเกง', 'กระโปรง', 'แจ็กเก็ต', 'คาร์ดิแกน', 'เดรส', 'จั๊มสูท', 'รองเท้า', 'กระเป๋า', 'เครื่องประดับ'] as const
export type Category = typeof CATEGORIES[number]

export const CATEGORY_SLOT: Record<Category, Slot> = {
  เสื้อ: 'top',
  กางเกง: 'bottom',
  กระโปรง: 'bottom',
  แจ็กเก็ต: 'outer',
  คาร์ดิแกน: 'outer',
  เดรส: 'dress',
  จั๊มสูท: 'dress',
  รองเท้า: 'accessory',
  กระเป๋า: 'accessory',
  เครื่องประดับ: 'accessory',
}
export function slotForCategory(category: Category): Slot {
  return CATEGORY_SLOT[category]
}

export const COLORS = ['ขาว', 'ดำ', 'เทา', 'กรม', 'น้ำเงิน', 'แดง', 'เขียว', 'เหลือง', 'ส้ม', 'ชมพู', 'ม่วง', 'น้ำตาล', 'ครีม', 'ลายพิมพ์'] as const
export type Color = typeof COLORS[number]

export const ITEM_STATUSES = ['owned', 'wishlist'] as const
export type ItemStatus = typeof ITEM_STATUSES[number]

// S09: ผู้ใช้ยืนยัน/แก้ค่าที่ AI เดาไว้ก่อนบันทึกลงตู้
export const saveItemSchema = z.object({
  storagePath: z.string().min(1).max(300), // รูปที่ใช้ลองชุด — ลบพื้นหลังแล้ว หรือรูปเดิมถ้าลบไม่สำเร็จ
  originalStoragePath: z.string().min(1).max(300),
  category: z.enum(CATEGORIES),
  color: z.enum(COLORS).optional(),
  status: z.enum(ITEM_STATUSES).default('owned'),
  shopUrl: z.url().max(500).optional(),
  name: z.string().max(100).optional(),
  note: z.string().max(300).optional(),
})
export type SaveItem = z.infer<typeof saveItemSchema>
