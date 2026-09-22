import { describe, expect, it } from 'vitest'
import { CATEGORIES, CATEGORY_SLOT, saveItemSchema, slotForCategory } from '#shared/item'

const base = { storagePath: 'u1/a.jpg', originalStoragePath: 'u1/a.jpg', category: 'เสื้อ' as const }

describe('slotForCategory — หมวด → ช่อง (flow เพิ่มชิ้น)', () => {
  it('ครบทุกหมวดมีช่องที่ CATEGORY_SLOT รู้จัก', () => {
    for (const c of CATEGORIES) expect(slotForCategory(c)).toBe(CATEGORY_SLOT[c])
  })
  it('เสื้อ → top', () => expect(slotForCategory('เสื้อ')).toBe('top'))
  it('กางเกง และ กระโปรง → bottom', () => {
    expect(slotForCategory('กางเกง')).toBe('bottom')
    expect(slotForCategory('กระโปรง')).toBe('bottom')
  })
  it('แจ็กเก็ต และ คาร์ดิแกน → outer', () => {
    expect(slotForCategory('แจ็กเก็ต')).toBe('outer')
    expect(slotForCategory('คาร์ดิแกน')).toBe('outer')
  })
  it('เดรส และ จั๊มสูท → dress', () => {
    expect(slotForCategory('เดรส')).toBe('dress')
    expect(slotForCategory('จั๊มสูท')).toBe('dress')
  })
  it('รองเท้า กระเป๋า เครื่องประดับ → accessory (ไม่ render)', () => {
    expect(slotForCategory('รองเท้า')).toBe('accessory')
    expect(slotForCategory('กระเป๋า')).toBe('accessory')
    expect(slotForCategory('เครื่องประดับ')).toBe('accessory')
  })
})

describe('saveItemSchema', () => {
  it('มีแค่ path + หมวด ผ่าน (สถานะ default = owned)', () => {
    const r = saveItemSchema.safeParse(base)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.status).toBe('owned')
  })
  it('หมวดนอกลิสต์ ไม่ผ่าน', () => {
    expect(saveItemSchema.safeParse({ ...base, category: 'กางเต็นท์' }).success).toBe(false)
  })
  it('ลิงก์ร้านต้องเป็น URL ที่ใช้งานได้', () => {
    expect(saveItemSchema.safeParse({ ...base, shopUrl: 'not-a-url' }).success).toBe(false)
    expect(saveItemSchema.safeParse({ ...base, shopUrl: 'https://shop.example.com/a' }).success).toBe(true)
  })
})
