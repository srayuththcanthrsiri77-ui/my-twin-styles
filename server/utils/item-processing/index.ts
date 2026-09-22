import type { H3Event } from 'h3'
import type { Category, Color } from '#shared/item'

// ลบพื้นหลัง + เดาหมวด/สี ของรูปชิ้นที่อัปโหลด (flow เพิ่มชิ้น หน้า 3) — ห่อไว้หลัง adapter เหมือน pose-check (ADR-0001)
// ยังไม่เลือกเจ้า → mock จำลองว่าลบพื้นหลังไม่สำเร็จเสมอ (ใช้รูปเดิม + เตือน) ผู้ใช้ยืนยัน/แก้หมวดสีเองใน S09
export interface ItemProcessResult {
  backgroundRemoved: boolean
  processedPath?: string // มีค่าเฉพาะตอน backgroundRemoved = true
  suggestedCategory: Category
  suggestedColor?: Color
}

export interface ItemProcessAdapter {
  readonly name: string
  process(imageUrl: string): Promise<ItemProcessResult>
}

export const mockItemProcess: ItemProcessAdapter = {
  name: 'mock',
  async process() {
    return { backgroundRemoved: false, suggestedCategory: 'เสื้อ', suggestedColor: 'ขาว' }
  },
}

export function getItemProcessAdapter(event: H3Event): ItemProcessAdapter {
  const provider = useRuntimeConfig(event).tryOnProvider
  if (provider === 'mock') return mockItemProcess
  throw new Error(`ยังไม่รองรับ item process provider: ${provider}`)
}
