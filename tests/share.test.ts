import { describe, expect, it } from 'vitest'
import { generateShareToken, hashShareToken } from '../server/utils/share'

describe('generateShareToken / hashShareToken (ADR-0007: เก็บแค่ hash ไม่เก็บ token ดิบ)', () => {
  it('token แต่ละครั้งไม่ซ้ำกัน (เดาไม่ได้ — ADR-0003)', () => {
    const a = generateShareToken()
    const b = generateShareToken()
    expect(a.token).not.toBe(b.token)
    expect(a.tokenHash).not.toBe(b.tokenHash)
  })
  it('hash ของ token เดียวกัน คำนวณซ้ำได้ค่าเดิมเสมอ (ใช้ตรวจตอนเปิดลิงก์)', () => {
    const { token, tokenHash } = generateShareToken()
    expect(hashShareToken(token)).toBe(tokenHash)
  })
  it('hash ไม่ใช่ token ดิบ และไม่มีทางย้อนกลับได้ตรง ๆ', () => {
    const { token, tokenHash } = generateShareToken()
    expect(tokenHash).not.toBe(token)
    expect(tokenHash).not.toContain(token)
  })
})
