import { createHash, createPublicKey, verify as verifyEd25519 } from 'node:crypto'
import { fal } from '@fal-ai/client'
import { InvalidWebhookSignature, type TryOnAdapter, type TryOnRequest, type TryOnResult } from './adapter'
import type { RenderSlot } from '#shared/outfit'

// ADR-0008: OmniGen V2 ผ่าน fal.ai — รับรูปได้สูงสุด 3 ใบต่อครั้ง (ท่า + ชิ้นเสื้อผ้า)
// ชุดที่มี "ชั้นนอก" ครบ 3 ชิ้น (เสื้อ+ท่อนล่าง+ชั้นนอก) เกินโควตา — ตัด "ชั้นนอก" ออกจากภาพที่ส่งไป (ยอมรับข้อจำกัดนี้)
const MAX_GARMENTS = 2
const SLOT_PRIORITY: RenderSlot[] = ['dress', 'top', 'bottom', 'outer']

const GARMENT_PROMPT_LABEL: Record<RenderSlot, string> = {
  dress: 'the dress',
  top: 'the top',
  bottom: 'the pants/bottom',
  outer: 'the outer jacket',
}

// เลือกชิ้นที่ส่งเข้า API สูงสุด MAX_GARMENTS ชิ้น ตามลำดับความสำคัญ (เดรส/เสื้อ/ท่อนล่างมาก่อนชั้นนอกเสมอ)
export function selectGarments<T extends { slot: RenderSlot }>(garments: T[]) {
  return [...garments].sort(
    (a, b) => SLOT_PRIORITY.indexOf(a.slot) - SLOT_PRIORITY.indexOf(b.slot),
  ).slice(0, MAX_GARMENTS)
}

export function buildPrompt(garments: { slot: RenderSlot }[]) {
  const parts = garments.map((g, i) => `${GARMENT_PROMPT_LABEL[g.slot]} from image ${i + 2}`)
  return `Make the person in image 1 wear ${parts.join(' and ')}. Keep the person's face, body, pose, and `
    + `background exactly as in image 1. Photorealistic fashion photography, natural lighting, accurate fabric texture.`
}

const JWKS_URL = 'https://rest.fal.ai/.well-known/jwks.json'
const JWKS_TTL_MS = 24 * 60 * 60_000
const WEBHOOK_MAX_AGE_S = 5 * 60

interface Jwk { x: string }
let jwksCache: { keys: Jwk[], fetchedAt: number } | undefined

async function getJwks(): Promise<Jwk[]> {
  if (jwksCache && Date.now() - jwksCache.fetchedAt < JWKS_TTL_MS) return jwksCache.keys
  const res = await fetch(JWKS_URL)
  if (!res.ok) throw new Error(`โหลด fal.ai JWKS ไม่สำเร็จ: ${res.status}`)
  const { keys } = await res.json() as { keys: Jwk[] }
  jwksCache = { keys, fetchedAt: Date.now() }
  return keys
}

// ตรวจลายเซ็น ED25519 ตามสเปก fal.ai (ADR-0008) — https://fal.ai/docs/.../webhooks
export async function verifyFalWebhook(headers: Record<string, string | undefined>, rawBody: string) {
  const requestId = headers['x-fal-webhook-request-id']
  const userId = headers['x-fal-webhook-user-id']
  const timestamp = headers['x-fal-webhook-timestamp']
  const signatureHex = headers['x-fal-webhook-signature']
  if (!requestId || !userId || !timestamp || !signatureHex) throw new InvalidWebhookSignature()

  const age = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (!Number.isFinite(age) || age > WEBHOOK_MAX_AGE_S) throw new InvalidWebhookSignature()

  const bodyHash = createHash('sha256').update(rawBody, 'utf8').digest('hex')
  const message = Buffer.from(`${requestId}\n${userId}\n${timestamp}\n${bodyHash}`, 'utf8')
  let signature: Buffer
  try {
    signature = Buffer.from(signatureHex, 'hex')
  }
  catch {
    throw new InvalidWebhookSignature()
  }

  const keys = await getJwks()
  const ok = keys.some((k) => {
    try {
      const publicKey = createPublicKey({ key: { kty: 'OKP', crv: 'Ed25519', x: k.x }, format: 'jwk' })
      return verifyEd25519(null, message, publicKey, signature)
    }
    catch {
      return false
    }
  })
  if (!ok) throw new InvalidWebhookSignature()
}

interface FalWebhookBody {
  request_id: string
  status: 'OK' | 'ERROR'
  payload?: { images?: { url: string }[] }
}

export function createFalOmnigenAdapter(opts: { apiKey: string }): TryOnAdapter {
  fal.config({ credentials: opts.apiKey })

  return {
    name: 'fal-omnigen',
    async submit(req: TryOnRequest) {
      const garments = selectGarments(req.garments)
      const { request_id } = await fal.queue.submit('fal-ai/omnigen-v2', {
        input: {
          prompt: buildPrompt(garments),
          input_image_urls: [req.poseImageUrl, ...garments.map(g => g.imageUrl)],
          image_guidance_scale: 1.6,
        },
        webhookUrl: req.callbackUrl,
      })
      return { providerJobId: request_id }
    },
    async parseWebhook(headers, rawBody): Promise<TryOnResult> {
      await verifyFalWebhook(headers, rawBody)
      const body = JSON.parse(rawBody) as FalWebhookBody
      const imageUrl = body.payload?.images?.[0]?.url
      if (body.status === 'OK' && imageUrl) {
        return { providerJobId: body.request_id, status: 'succeeded', imageUrl }
      }
      return { providerJobId: body.request_id, status: 'failed', errorCode: 'fal_error' }
    },
  }
}
