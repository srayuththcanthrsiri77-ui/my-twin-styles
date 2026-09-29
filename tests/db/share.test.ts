import { drizzle } from 'drizzle-orm/postgres-js'
import { afterAll, describe, expect, it } from 'vitest'
import * as schema from '../../server/db/schema'
import type { TryOnAdapter } from '../../server/utils/try-on/adapter'
import { handleResult, type PrivilegedDeps } from '../../server/utils/try-on/lifecycle'
import { asAnon, asUser, newUser, seedWardrobe, sql, startTryOn, url, withGlobalCapHeadroom } from './helpers'

// S13/S14 แชร์ลุค (ADR-0003 · ADR-0005 ผู้เรียกที่ 4 · ADR-0007): token เก็บแค่ hash · เพิกถอนแล้วปิดทันที ·
// anon อ่าน share_links ตรงไม่ได้เลย (ต้องผ่านโซนสิทธิ์พิเศษที่ตรวจ hash ก่อนเสมอ)
describe.skipIf(!url)('แชร์ลุค (S13/S14)', () => {
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

  it('เจ้าของสร้างลิงก์แชร์ให้ลุคตัวเองได้ · เห็นแถวที่สร้างเอง', async () => {
    const uid = await newUser()
    const w = await seedWardrobe(uid)
    const lookId = await finishedLook(uid, w)
    const [row] = await asUser(uid, tx => tx`
      insert into public.share_links (look_id, token_hash) values (${lookId}, ${'hash1'}) returning id, view_count`)
    expect(row?.view_count).toBe(0)
    expect(await asUser(uid, tx => tx`select id from public.share_links where look_id = ${lookId}`)).toHaveLength(1)
  })

  it('สร้างลิงก์ให้ลุคของคนอื่นไม่ได้ (RLS insert ต้องเป็นเจ้าของลุค)', async () => {
    const a = await newUser()
    const b = await newUser()
    const wa = await seedWardrobe(a)
    const lookId = await finishedLook(a, wa)
    await expect(asUser(b, tx => tx`insert into public.share_links (look_id, token_hash) values (${lookId}, ${'hash2'})`))
      .rejects.toThrow(/row-level security/)
  })

  it('คนอื่นและ anon มองไม่เห็นแถว share_links ของเราเลย (ต้องผ่านโซนสิทธิ์พิเศษเท่านั้น)', async () => {
    const a = await newUser()
    const b = await newUser()
    const wa = await seedWardrobe(a)
    const lookId = await finishedLook(a, wa)
    await asUser(a, tx => tx`insert into public.share_links (look_id, token_hash) values (${lookId}, ${'hash3'})`)
    expect(await asUser(b, tx => tx`select id from public.share_links where look_id = ${lookId}`)).toHaveLength(0)
    expect(await asAnon(tx => tx`select id from public.share_links where look_id = ${lookId}`)).toHaveLength(0)
  })

  it('เจ้าของแก้ได้แค่ revoked_at — แก้ view_count หรือ token_hash ตรง ๆ ไม่ได้ (column grant)', async () => {
    const uid = await newUser()
    const w = await seedWardrobe(uid)
    const lookId = await finishedLook(uid, w)
    await asUser(uid, tx => tx`insert into public.share_links (look_id, token_hash) values (${lookId}, ${'hash4'})`)

    await asUser(uid, tx => tx`update public.share_links set revoked_at = now() where look_id = ${lookId}`)
    const [row] = await sql`select revoked_at from public.share_links where look_id = ${lookId}`
    expect(row!.revoked_at).not.toBeNull()

    await expect(asUser(uid, tx => tx`update public.share_links set view_count = 999 where look_id = ${lookId}`))
      .rejects.toThrow(/permission denied/)
    await expect(asUser(uid, tx => tx`update public.share_links set token_hash = 'hacked' where look_id = ${lookId}`))
      .rejects.toThrow(/permission denied/)
  })

  it('ลบลุค → ลิงก์แชร์ของลุคนั้นหายไปด้วย (ON DELETE CASCADE — "ลบลุค = ลิงก์ตายด้วย")', async () => {
    const uid = await newUser()
    const w = await seedWardrobe(uid)
    const lookId = await finishedLook(uid, w)
    await asUser(uid, tx => tx`insert into public.share_links (look_id, token_hash) values (${lookId}, ${'hash5'})`)
    await asUser(uid, tx => tx`delete from public.looks where id = ${lookId}`)
    expect(await sql`select id from public.share_links where look_id = ${lookId}`).toHaveLength(0)
  })
})
