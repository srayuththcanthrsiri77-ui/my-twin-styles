import { describe, expect, it } from 'vitest'
import { DISLIKE_REASONS, DISLIKE_REASON_LABEL, diffOutfits, dislikeSchema, lookOccasionsSchema, lookPatchSchema, occasionCreateSchema, type OutfitItemRef } from '#shared/look'

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

describe('diffOutfits — S07 เทียบคู่ (CONTEXT.md: Remix เปลี่ยนหนึ่งช่องหรือท่า)', () => {
  const top = (id: string): OutfitItemRef => ({ slot: 'top', id, name: null, category: 'เสื้อ' })
  const bottom = (id: string): OutfitItemRef => ({ slot: 'bottom', id, name: null, category: 'กางเกง' })
  const acc = (id: string): OutfitItemRef => ({ slot: 'accessory', id, name: null, category: 'กระเป๋า' })

  it('ชุดเดียวกันทุกช่อง ไม่มีอะไรเปลี่ยน', () => {
    const outfit = [top('1'), bottom('2')]
    expect(diffOutfits(outfit, outfit)).toEqual([])
  })
  it('เปลี่ยนเสื้อช่องเดียว รายงานแค่ช่องนั้น', () => {
    const changes = diffOutfits([top('1'), bottom('2')], [top('3'), bottom('2')])
    expect(changes).toEqual([{ slot: 'top', before: 'เสื้อ', after: 'เสื้อ' }])
  })
  it('ช่องที่ลุคใหม่ไม่มีเลย (ว่าง) เทียบกับลุคเดิมที่มี ก็ถือว่าเปลี่ยน', () => {
    const changes = diffOutfits([top('1'), bottom('2')], [bottom('2')])
    expect(changes).toEqual([{ slot: 'top', before: 'เสื้อ', after: 'ว่าง' }])
  })
  it('ส่วนประกอบเปลี่ยนจำนวน รายงานเป็นช่อง accessory', () => {
    const changes = diffOutfits([top('1'), bottom('2'), acc('9')], [top('1'), bottom('2')])
    expect(changes).toEqual([{ slot: 'accessory', before: '1 ชิ้น', after: '0 ชิ้น' }])
  })
  it('ส่วนประกอบจำนวนเท่ากันแต่คนละชิ้น ก็ถือว่าเปลี่ยน', () => {
    const changes = diffOutfits([top('1'), acc('9')], [top('1'), acc('10')])
    expect(changes).toEqual([{ slot: 'accessory', before: '1 ชิ้น', after: '1 ชิ้น' }])
  })
})
