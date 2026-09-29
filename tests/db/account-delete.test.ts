import { drizzle } from 'drizzle-orm/postgres-js'
import { afterAll, describe, expect, it } from 'vitest'
import * as schema from '../../server/db/schema'
import type { TryOnAdapter } from '../../server/utils/try-on/adapter'
import { handleResult, type PrivilegedDeps } from '../../server/utils/try-on/lifecycle'
import { asUser, newUser, seedWardrobe, sql, startTryOn, url, withGlobalCapHeadroom } from './helpers'

// S15 "ลบ twin" / "ลบข้อมูลทั้งหมด" — ตรวจพฤติกรรมจริงระดับฐานข้อมูล (ADR-0003, ADR-0005 ผู้เรียกที่ 5)
describe.skipIf(!url)('ลบ twin / ลบข้อมูลทั้งหมด (S15)', () => {
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

  it('ลบ twin (ท่าทั้งหมด) ไม่กระทบลุคที่มีอยู่แล้ว — tryOns.poseId กลายเป็น null (ON DELETE SET NULL)', async () => {
    const uid = await newUser()
    const w = await seedWardrobe(uid)
    const lookId = await finishedLook(uid, w)
    await asUser(uid, tx => tx`delete from public.poses where user_id = ${uid}`)
    expect(await sql`select id from public.poses where user_id = ${uid}`).toHaveLength(0)
    expect(await sql`select id from public.looks where id = ${lookId}`).toHaveLength(1)
    const [tryOn] = await sql`select t.pose_id from public.try_ons t join public.looks l on l.try_on_id = t.id where l.id = ${lookId}`
    expect(tryOn!.pose_id).toBeNull()
  })

  it('ลบบัญชี (auth.users) → cascade ลบทุกอย่างของผู้ใช้นั้นหมดจริง ไม่กระทบผู้ใช้อื่น', async () => {
    const a = await newUser()
    const b = await newUser()
    const wa = await seedWardrobe(a)
    const wb = await seedWardrobe(b)
    const lookA = await finishedLook(a, wa)
    await finishedLook(b, wb)

    // แต่งข้อมูลรอบด้านของ a ให้ครบก่อนลบ: โอกาสตั้งเอง, ⭐, โน้ต, 👎, ลิงก์แชร์
    const [occasion] = await asUser(a, tx => tx`insert into public.occasions (user_id, name) values (${a}, 'ทดสอบ') returning id`)
    await asUser(a, tx => tx`insert into public.look_occasions (look_id, occasion_id) values (${lookA}, ${occasion!.id})`)
    await asUser(a, tx => tx`update public.looks set is_favorite = true, note = 'จำไว้' where id = ${lookA}`)
    await asUser(a, tx => tx`insert into public.look_dislikes (look_id, reason) values (${lookA}, 'face')`)
    await asUser(a, tx => tx`insert into public.share_links (look_id, token_hash) values (${lookA}, ${'hash-del-test'})`)

    await sql`delete from auth.users where id = ${a}`

    expect(await sql`select 1 from public.profiles where user_id = ${a}`).toHaveLength(0)
    expect(await sql`select 1 from public.poses where user_id = ${a}`).toHaveLength(0)
    expect(await sql`select 1 from public.items where user_id = ${a}`).toHaveLength(0)
    expect(await sql`select 1 from public.try_ons where user_id = ${a}`).toHaveLength(0)
    expect(await sql`select 1 from public.looks where user_id = ${a}`).toHaveLength(0)
    expect(await sql`select 1 from public.look_occasions where look_id = ${lookA}`).toHaveLength(0)
    expect(await sql`select 1 from public.look_dislikes where look_id = ${lookA}`).toHaveLength(0)
    expect(await sql`select 1 from public.share_links where look_id = ${lookA}`).toHaveLength(0)
    expect(await sql`select 1 from public.occasions where id = ${occasion!.id}`).toHaveLength(0)
    expect(await sql`select 1 from public.daily_usage where user_id = ${a}`).toHaveLength(0)

    // ผู้ใช้ b ไม่ถูกแตะเลย
    expect(await sql`select 1 from public.profiles where user_id = ${b}`).toHaveLength(1)
    expect(await sql`select 1 from public.poses where user_id = ${b}`).toHaveLength(1)
  })
})
