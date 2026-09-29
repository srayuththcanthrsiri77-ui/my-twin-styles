import { createHash, randomBytes } from 'node:crypto'

// token เดาไม่ได้ (ADR-0003) — เก็บแค่ hash ไม่เก็บ token ดิบ (ADR-0007) จึงโชว์ให้เจ้าของเห็นได้แค่ตอนสร้างครั้งแรก
export function generateShareToken() {
  const token = randomBytes(32).toString('base64url')
  return { token, tokenHash: hashShareToken(token) }
}

export function hashShareToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}
