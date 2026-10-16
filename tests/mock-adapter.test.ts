import { describe, expect, it } from 'vitest'
import { InvalidWebhookSignature } from '../server/utils/try-on/adapter'
import { createMockAdapter, MOCK_SIGNATURE_HEADER } from '../server/utils/try-on/mock'
import { composeFlatLay } from '../server/utils/try-on/flat-lay'

// mock ทำภาพแบบ async หลัง schedule — รอให้ microtask ทั้งหมดจบก่อนตรวจผล
const flush = () => new Promise(r => setTimeout(r, 0))

function setup(random: number, fetchImage?: (url: string) => Promise<{ type: string, data: Uint8Array }>) {
  const sent: { url: string, body: string, headers: Record<string, string> }[] = []
  const fetched: string[] = []
  const adapter = createMockAdapter({
    webhookSecret: 'test-secret',
    placeholderImageUrl: 'http://localhost/mock/look-placeholder.svg',
    failRate: 0.5,
    random: () => random,
    schedule: fn => fn(),
    deliver: async (url, body, headers) => { sent.push({ url, body, headers }) },
    fetchImage: async (url) => {
      fetched.push(url)
      return fetchImage ? fetchImage(url) : { type: 'image/jpeg', data: new TextEncoder().encode(`img:${url}`) }
    },
  })
  return { adapter, sent, fetched }
}
async function lookSvg(body: string) {
  const { imageUrl } = JSON.parse(body) as { imageUrl: string }
  return (await fetch(imageUrl)).text()
}
const req = { tryOnId: 't1', poseImageUrl: 'https://signed/pose', garments: [], callbackUrl: 'http://localhost/api/webhooks/try-on' }
const withGarments = {
  ...req,
  garments: [{ slot: 'top' as const, imageUrl: 'https://signed/top' }, { slot: 'bottom' as const, imageUrl: 'https://signed/bottom' }],
}

describe('mock try-on adapter', () => {
  it('ยิง webhook ที่ลงลายเซ็น และ parse กลับได้', async () => {
    const { adapter, sent } = setup(0.9)
    const { providerJobId } = await adapter.submit(req)
    await flush()
    expect(sent).toHaveLength(1)
    const result = adapter.parseWebhook(sent[0]!.headers, sent[0]!.body)
    expect(result).toEqual({ providerJobId, status: 'succeeded', imageUrl: 'http://localhost/mock/look-placeholder.svg' })
  })
  it('ไม่คืนรูปท่าเป็นผลลัพธ์ (ADR-0003)', async () => {
    const { adapter, sent } = setup(0.9)
    await adapter.submit(req)
    await flush()
    expect(sent[0]!.body).not.toContain('signed/pose')
  })
  it('จำลองความล้มเหลวตาม failRate', async () => {
    const { adapter, sent } = setup(0.1)
    await adapter.submit(req)
    await flush()
    expect(JSON.parse(sent[0]!.body)).toMatchObject({ status: 'failed', errorCode: 'mock_failure' })
  })
  it('ลายเซ็นผิดหรือ body ถูกแก้ → ปฏิเสธ', async () => {
    const { adapter, sent } = setup(0.9)
    await adapter.submit(req)
    await flush()
    const { body, headers } = sent[0]!
    expect(() => adapter.parseWebhook({ [MOCK_SIGNATURE_HEADER]: 'nope' }, body)).toThrow(InvalidWebhookSignature)
    expect(() => adapter.parseWebhook(headers, body.replace('succeeded', 'failed'))).toThrow(InvalidWebhookSignature)
    expect(() => adapter.parseWebhook({}, body)).toThrow(InvalidWebhookSignature)
  })
  it('ผลลัพธ์เป็นภาพรวมชิ้นที่เลือก (flat-lay)', async () => {
    const { adapter, sent } = setup(0.9)
    await adapter.submit(withGarments)
    await flush()
    const svg = await lookSvg(sent[0]!.body)
    expect(svg).toContain(Buffer.from('img:https://signed/top').toString('base64'))
    expect(svg).toContain(Buffer.from('img:https://signed/bottom').toString('base64'))
  })
  it('ไม่ดึงรูปท่ามาทำภาพเลย (ADR-0003)', async () => {
    const { adapter, sent, fetched } = setup(0.9)
    await adapter.submit(withGarments)
    await flush()
    expect(fetched).not.toContain('https://signed/pose')
    expect(await lookSvg(sent[0]!.body)).not.toContain(Buffer.from('img:https://signed/pose').toString('base64'))
  })
  it('ดึงรูปชิ้นไม่ได้ → ยังสำเร็จด้วย placeholder', async () => {
    const { adapter, sent } = setup(0.9, async () => { throw new Error('404') })
    await adapter.submit(withGarments)
    await flush()
    expect(JSON.parse(sent[0]!.body)).toMatchObject({ status: 'succeeded', imageUrl: 'http://localhost/mock/look-placeholder.svg' })
  })
})

describe('composeFlatLay', () => {
  const img = (slot: 'top' | 'bottom' | 'outer' | 'dress') => ({ slot, type: 'image/jpeg', data: new Uint8Array([1, 2, 3]) })
  it('วางการ์ดครบทุกช่องที่ render', () => {
    expect(composeFlatLay([img('top'), img('bottom'), img('outer')]).match(/<image /g)).toHaveLength(3)
    expect(composeFlatLay([img('dress'), img('outer')]).match(/<image /g)).toHaveLength(2)
  })
  it('ชนิดรูปแปลก ๆ ไม่หลุดเข้า data URI', () => {
    const svg = composeFlatLay([{ slot: 'dress', type: 'text/html"><script>', data: new Uint8Array([1]) }])
    expect(svg).not.toContain('<script>')
    expect(svg).toContain('data:image/jpeg;base64,')
  })
})
