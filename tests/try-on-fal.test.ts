import { createHash, generateKeyPairSync, sign as signEd25519 } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { InvalidWebhookSignature } from '../server/utils/try-on/adapter'
import { buildPrompt, selectGarments, verifyFalWebhook } from '../server/utils/try-on/fal-omnigen'

// ADR-0008: fal.ai (OmniGen V2) รับรูปได้สูงสุด 2 ชิ้นเสื้อผ้า (+ ท่า) ต่อครั้ง
describe('selectGarments', () => {
  it('เดรส + ชั้นนอก ไม่เกิน 2 — เก็บครบ', () => {
    const picked = selectGarments([{ slot: 'outer' }, { slot: 'dress' }])
    expect(picked.map(g => g.slot)).toEqual(['dress', 'outer'])
  })

  it('เสื้อ + ท่อนล่าง + ชั้นนอก เกิน 2 — ตัดชั้นนอกออก เหลือเสื้อ+ท่อนล่าง', () => {
    const picked = selectGarments([{ slot: 'outer' }, { slot: 'bottom' }, { slot: 'top' }])
    expect(picked.map(g => g.slot)).toEqual(['top', 'bottom'])
  })
})

describe('buildPrompt', () => {
  it('อ้าง index รูปถูกต้องเริ่มจาก image 2 (image 1 = ท่า)', () => {
    const prompt = buildPrompt([{ slot: 'top' }, { slot: 'bottom' }])
    expect(prompt).toContain('the top from image 2')
    expect(prompt).toContain('the pants/bottom from image 3')
  })
})

describe('verifyFalWebhook', () => {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519')
  const jwk = publicKey.export({ format: 'jwk' }) as { x: string }
  const originalFetch = globalThis.fetch

  beforeAll(() => {
    globalThis.fetch = (async (url: string | URL) => {
      if (String(url) === 'https://rest.fal.ai/.well-known/jwks.json') {
        return new Response(JSON.stringify({ keys: [jwk] }), { status: 200 })
      }
      throw new Error(`unexpected fetch: ${url}`)
    }) as typeof fetch
  })

  afterAll(() => {
    globalThis.fetch = originalFetch
  })

  function sign(requestId: string, userId: string, timestamp: string, rawBody: string) {
    const bodyHash = createHash('sha256').update(rawBody, 'utf8').digest('hex')
    const message = Buffer.from(`${requestId}\n${userId}\n${timestamp}\n${bodyHash}`, 'utf8')
    return signEd25519(null, message, privateKey).toString('hex')
  }

  it('ลายเซ็นถูกต้อง + เวลาปัจจุบัน → ผ่าน', async () => {
    const rawBody = JSON.stringify({ request_id: 'r1', status: 'OK' })
    const timestamp = String(Math.floor(Date.now() / 1000))
    const signature = sign('r1', 'u1', timestamp, rawBody)
    await expect(verifyFalWebhook({
      'x-fal-webhook-request-id': 'r1',
      'x-fal-webhook-user-id': 'u1',
      'x-fal-webhook-timestamp': timestamp,
      'x-fal-webhook-signature': signature,
    }, rawBody)).resolves.toBeUndefined()
  })

  it('ลายเซ็นผิด → throw InvalidWebhookSignature', async () => {
    const rawBody = JSON.stringify({ request_id: 'r1', status: 'OK' })
    const timestamp = String(Math.floor(Date.now() / 1000))
    await expect(verifyFalWebhook({
      'x-fal-webhook-request-id': 'r1',
      'x-fal-webhook-user-id': 'u1',
      'x-fal-webhook-timestamp': timestamp,
      'x-fal-webhook-signature': 'ff'.repeat(64),
    }, rawBody)).rejects.toThrow(InvalidWebhookSignature)
  })

  it('timestamp เก่าเกิน 5 นาที (replay) → throw InvalidWebhookSignature', async () => {
    const rawBody = JSON.stringify({ request_id: 'r1', status: 'OK' })
    const staleTimestamp = String(Math.floor(Date.now() / 1000) - 600)
    const signature = sign('r1', 'u1', staleTimestamp, rawBody)
    await expect(verifyFalWebhook({
      'x-fal-webhook-request-id': 'r1',
      'x-fal-webhook-user-id': 'u1',
      'x-fal-webhook-timestamp': staleTimestamp,
      'x-fal-webhook-signature': signature,
    }, rawBody)).rejects.toThrow(InvalidWebhookSignature)
  })

  it('ขาด header ไหนไป → throw InvalidWebhookSignature', async () => {
    await expect(verifyFalWebhook({}, '{}')).rejects.toThrow(InvalidWebhookSignature)
  })
})
