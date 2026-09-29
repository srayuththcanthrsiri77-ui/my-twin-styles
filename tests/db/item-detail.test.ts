import { drizzle } from 'drizzle-orm/postgres-js'
import { afterAll, describe, expect, it } from 'vitest'
import * as schema from '../../server/db/schema'
import type { TryOnAdapter } from '../../server/utils/try-on/adapter'
import { handleResult, type PrivilegedDeps } from '../../server/utils/try-on/lifecycle'
import { asUser, newUser, seedWardrobe, sql, startTryOn, url, withGlobalCapHeadroom } from './helpers'

// S10 รายละเอียดชิ้น — ค้นย้อนลุคที่ใช้ชิ้นนี้ ต้องเห็นแค่ลุค/ชิ้นของตัวเอง (join try_on_items → looks)
describe.skipIf(!url)('รายละเอียดชิ้น (S10)', () => {
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

  async function finishedLook(uid: string, w: { poseId: string, topId: string, bottomId: string }) {
    const id = await withGlobalCapHeadroom(5, () => startTryOn(uid, w))
    await sql`update public.try_ons set status = 'running', attempts = 1, provider_job_id = ${`job_${id}`}, submitted_at = now() where id = ${id}`
    await handleResult(deps(), { providerJobId: `job_${id}`, status: 'succeeded', imageUrl: 'https://provider/out.png' })
    const [look] = await sql`select id from public.looks where try_on_id = ${id}`
    return look!.id as string
  }

  it('ชิ้นที่ใช้ 2 ลุค เจอครบทั้ง 2 ลุคผ่าน join try_on_items → looks', async () => {
    const uid = await newUser()
    const w = await seedWardrobe(uid)
    const look1 = await finishedLook(uid, w)
    const look2 = await finishedLook(uid, w)
    const rows = await asUser(uid, tx => tx`
      select distinct l.id from public.try_on_items ti
      join public.looks l on l.try_on_id = ti.try_on_id
      where ti.item_id = ${w.topId}`)
    expect(rows.map(r => r.id).sort()).toEqual([look1, look2].sort())
  })

  it('มองไม่เห็นลุคของคนอื่นแม้จะรู้ item_id ของเขา (RLS ของ looks/try_on_items)', async () => {
    const a = await newUser()
    const b = await newUser()
    const wa = await seedWardrobe(a)
    await finishedLook(a, wa)
    const rows = await asUser(b, tx => tx`
      select distinct l.id from public.try_on_items ti
      join public.looks l on l.try_on_id = ti.try_on_id
      where ti.item_id = ${wa.topId}`)
    expect(rows).toHaveLength(0)
  })
})
