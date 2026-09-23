import { drizzle } from 'drizzle-orm/postgres-js'
import { afterAll, describe, expect, it } from 'vitest'
import * as schema from '../../server/db/schema'
import type { TryOnAdapter } from '../../server/utils/try-on/adapter'
import { handleResult, type PrivilegedDeps } from '../../server/utils/try-on/lifecycle'
import { asUser, newUser, seedWardrobe, sql, startTryOn, url, withGlobalCapHeadroom } from './helpers'

// S07 Remix: remix_of_look_id ต้องอ้างถึงลุคของเจ้าของเองเท่านั้น (start_try_on) และไม่ cascade
// ทำลายลุคลูกเมื่อลุคต้นทางถูกลบ (ON DELETE SET NULL — ดู drizzle/0001_functions_and_grants.sql)
describe.skipIf(!url)('Remix (S07)', () => {
  afterAll(async () => { await sql?.end() })

  function deps(): PrivilegedDeps {
    let n = 0
    const adapter: TryOnAdapter = {
      name: 'fake',
      async submit(req) { return { providerJobId: `job_${req.tryOnId}_${++n}` } },
      parseWebhook() { throw new Error('unused') },
    }
    return {
      db: drizzle({ client: sql, schema }),
      adapter,
      callbackUrl: 'http://localhost/api/webhooks/try-on',
      sign: async (bucket, path) => `https://signed/${bucket}/${path}`,
      storeLook: async (userId, tryOnId) => `${userId}/${tryOnId}.png`,
    }
  }

  async function finishedLook(uid: string, w: { poseId: string, topId: string, bottomId: string }, remixOf?: string) {
    const id = await withGlobalCapHeadroom(5, () => startTryOn(uid, w, remixOf))
    await sql`update public.try_ons set status = 'running', attempts = 1, provider_job_id = ${`job_${id}`}, submitted_at = now() where id = ${id}`
    await handleResult(deps(), { providerJobId: `job_${id}`, status: 'succeeded', imageUrl: 'https://provider/out.png' })
    const [look] = await sql`select id from public.looks where try_on_id = ${id}`
    return { tryOnId: id, lookId: look!.id as string }
  }

  it('ลุคใหม่จาก remix อ้างถึงลุคต้นทาง — join แบบที่ /api/looks/[id]/compare ใช้เจอแถวจริง', async () => {
    const uid = await newUser()
    const w = await seedWardrobe(uid)
    const source = await finishedLook(uid, w)
    const remix = await finishedLook(uid, w, source.lookId)
    const [row] = await asUser(uid, tx => tx`
      select l.id from public.looks l join public.try_ons t on t.id = l.try_on_id
      where l.id = ${remix.lookId} and t.remix_of_look_id = ${source.lookId}`)
    expect(row?.id).toBe(remix.lookId)
  })

  it('remix จากลุคของคนอื่นไม่ได้ — start_try_on เช็ก ownership ของ remix_of ด้วย', async () => {
    const a = await newUser()
    const b = await newUser()
    const wa = await seedWardrobe(a)
    const wb = await seedWardrobe(b)
    const source = await finishedLook(a, wa)
    await withGlobalCapHeadroom(5, async () => {
      await expect(startTryOn(b, wb, source.lookId)).rejects.toThrow(/look_not_found/)
    })
  })

  it('ลบลุคต้นทาง → remix_of_look_id ของลุคลูกกลายเป็น null · ลุคลูกไม่ถูกลบตาม', async () => {
    const uid = await newUser()
    const w = await seedWardrobe(uid)
    const source = await finishedLook(uid, w)
    const remix = await finishedLook(uid, w, source.lookId)
    await asUser(uid, tx => tx`delete from public.looks where id = ${source.lookId}`)
    const [row] = await sql`select remix_of_look_id from public.try_ons where id = ${remix.tryOnId}`
    expect(row!.remix_of_look_id).toBeNull()
    expect(await sql`select id from public.looks where id = ${remix.lookId}`).toHaveLength(1)
  })

  it('ลบลุค ไม่ลบ try_on ที่สร้างลุคนั้น (ความสัมพันธ์เป็นทิศเดียว)', async () => {
    const uid = await newUser()
    const w = await seedWardrobe(uid)
    const { tryOnId, lookId } = await finishedLook(uid, w)
    await asUser(uid, tx => tx`delete from public.looks where id = ${lookId}`)
    expect(await sql`select id from public.try_ons where id = ${tryOnId}`).toHaveLength(1)
  })
})
