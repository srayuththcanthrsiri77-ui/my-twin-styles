import { describe, expect, it } from 'vitest'
import { DISLIKE_REASONS, DISLIKE_REASON_LABEL, dislikeSchema, lookOccasionsSchema, lookPatchSchema, occasionCreateSchema } from '#shared/look'

describe('DISLIKE_REASON_LABEL — ครบทุกเหตุผล 👎 (CONTEXT.md)', () => {
  it('มีป้ายภาษาไทยครบทุกค่าใน DISLIKE_REASONS', () => {
    for (const r of DISLIKE_REASONS) expect(DISLIKE_REASON_LABEL[r]).toBeTruthy()
  })
})

describe('dislikeSchema', () => {
  it('เหตุผลนอกลิสต์ ไม่ผ่าน', () => {
    expect(dislikeSchema.safeParse({ reason: 'ugly' }).success).toBe(false)
  })
  it('เหตุผลในลิสต์ ผ่าน', () => {
    expect(dislikeSchema.safeParse({ reason: 'face' }).success).toBe(true)
  })
})

describe('lookPatchSchema', () => {
  it('ไม่มีทั้ง isFavorite และ note ไม่ผ่าน', () => {
    expect(lookPatchSchema.safeParse({}).success).toBe(false)
  })
  it('มีอย่างใดอย่างหนึ่ง ผ่าน', () => {
    expect(lookPatchSchema.safeParse({ isFavorite: true }).success).toBe(true)
    expect(lookPatchSchema.safeParse({ note: 'ใส่ไปงานเลี้ยง' }).success).toBe(true)
  })
  it('note ลบได้ด้วยการส่ง null', () => {
    expect(lookPatchSchema.safeParse({ note: null }).success).toBe(true)
  })
  it('note ยาวเกิน 300 ตัวอักษร ไม่ผ่าน', () => {
    expect(lookPatchSchema.safeParse({ note: 'ก'.repeat(301) }).success).toBe(false)
  })
})

describe('lookOccasionsSchema', () => {
  it('เกิน 10 โอกาส ไม่ผ่าน', () => {
    const ids = Array.from({ length: 11 }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`)
    expect(lookOccasionsSchema.safeParse({ occasionIds: ids }).success).toBe(false)
  })
  it('ว่างเปล่า (เอาโอกาสออกหมด) ผ่าน', () => {
    expect(lookOccasionsSchema.safeParse({ occasionIds: [] }).success).toBe(true)
  })
})

describe('occasionCreateSchema', () => {
  it('ชื่อว่าง ไม่ผ่าน', () => {
    expect(occasionCreateSchema.safeParse({ name: '  ' }).success).toBe(false)
  })
  it('ชื่อยาวเกิน 30 ตัวอักษร ไม่ผ่าน', () => {
    expect(occasionCreateSchema.safeParse({ name: 'ก'.repeat(31) }).success).toBe(false)
  })
  it('ชื่อปกติ ผ่าน', () => {
    expect(occasionCreateSchema.safeParse({ name: 'ไปเที่ยวทะเล' }).success).toBe(true)
  })
})
