import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { InvalidWebhookSignature, type TryOnAdapter, type TryOnRequest, type TryOnResult } from './adapter'
import { type FlatLayImage, flatLayDataUrl } from './flat-lay'

export const MOCK_SIGNATURE_HEADER = 'x-mock-signature'

export interface MockOptions {
  webhookSecret: string
  placeholderImageUrl: string
  delayMs?: number
  failRate?: number // 0–1 ใช้ทดสอบ flow ล้มเหลว → retry → คืนโควต้า
  random?: () => number
  deliver?: (url: string, body: string, headers: Record<string, string>) => Promise<void>
  fetchImage?: (url: string) => Promise<{ type: string, data: Uint8Array }>
  schedule?: (fn: () => void, ms: number) => void
}

export function signMockBody(secret: string, body: string) {
  return createHmac('sha256', secret).update(body).digest('hex')
}

const MAX_GARMENT_BYTES = 5 * 1024 * 1024

async function defaultFetchImage(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`ดึงรูปชิ้นไม่ได้: ${res.status}`)
  const data = new Uint8Array(await res.arrayBuffer())
  if (data.byteLength > MAX_GARMENT_BYTES) throw new Error('รูปชิ้นใหญ่เกิน')
  return { type: res.headers.get('content-type') ?? 'image/jpeg', data }
}

// จำลอง provider แบบ async: รับงาน → หน่วงเวลา → ยิง webhook ที่ลงลายเซ็นกลับมา
// ผลลัพธ์เป็นภาพรวมชิ้นแบบวางราบ (ไม่มี AI ฟรีให้ใช้ — WORKLOG 2026-10-02) · ไม่แตะรูปท่าเลย (ADR-0003)
export function createMockAdapter(opts: MockOptions): TryOnAdapter {
  const random = opts.random ?? Math.random
  const schedule = opts.schedule ?? ((fn, ms) => { setTimeout(fn, ms) })
  const deliver = opts.deliver ?? (async (url, body, headers) => {
    await fetch(url, { method: 'POST', body, headers: { 'content-type': 'application/json', ...headers } })
  })
  const fetchImage = opts.fetchImage ?? defaultFetchImage

  // ดึงรูปชิ้นไม่ได้ก็ยังคืน placeholder — mock มีไว้ให้ flow เดินต่อได้ ไม่ควรเป็นจุดที่ทำให้ลองไม่สำเร็จ
  async function lookImageUrl(req: TryOnRequest) {
    if (req.garments.length === 0) return opts.placeholderImageUrl
    try {
      const images: FlatLayImage[] = await Promise.all(req.garments.map(async g => ({ slot: g.slot, ...await fetchImage(g.imageUrl) })))
      return flatLayDataUrl(images)
    }
    catch (err) {
      console.warn('[mock try-on] ทำภาพรวมชิ้นไม่สำเร็จ ใช้ placeholder แทน', { tryOnId: req.tryOnId, err })
      return opts.placeholderImageUrl
    }
  }

  return {
    name: 'mock',
    async submit(req: TryOnRequest) {
      const providerJobId = `mock_${randomUUID()}`
      const fail = random() < (opts.failRate ?? 0)
      // ทำภาพหลังตอบ submit แล้ว — route สั่งลองจะได้ไม่ต้องรอดึงรูปชิ้น
      schedule(() => {
        void (async () => {
          const result: TryOnResult = fail
            ? { providerJobId, status: 'failed', errorCode: 'mock_failure' }
            : { providerJobId, status: 'succeeded', imageUrl: await lookImageUrl(req) }
          const body = JSON.stringify(result)
          await deliver(req.callbackUrl, body, { [MOCK_SIGNATURE_HEADER]: signMockBody(opts.webhookSecret, body) })
        })().catch(err => console.error('[mock try-on] ส่ง webhook ไม่สำเร็จ', err))
      }, opts.delayMs ?? 3000)
      return { providerJobId }
    },
    parseWebhook(headers, rawBody) {
      const got = headers[MOCK_SIGNATURE_HEADER] ?? ''
      const want = signMockBody(opts.webhookSecret, rawBody)
      const a = Buffer.from(got)
      const b = Buffer.from(want)
      if (a.length !== b.length || !timingSafeEqual(a, b)) throw new InvalidWebhookSignature()
      return JSON.parse(rawBody) as TryOnResult
    },
  }
}
