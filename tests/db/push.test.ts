import { afterAll, describe, expect, it } from 'vitest'
import { asUser, newUser, sql, url } from './helpers'

// S17 Web Push: push_subscriptions ใช้ ownerCrud ธรรมดา (ไม่มีฟังก์ชันพิเศษ) — เทสแค่ RLS + upsert ตาม endpoint
describe.skipIf(!url)('push_subscriptions RLS (S17)', () => {
  afterAll(async () => { await sql?.end() })

  it('subscribe ของตัวเองได้ เห็นแค่แถวตัวเอง', async () => {
    const uid = await newUser()
    await asUser(uid, tx => tx`insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
      values (${uid}, 'https://push.example/a', 'p', 'a')`)
    const rows = await asUser(uid, tx => tx`select endpoint from public.push_subscriptions`)
    expect(rows.map(r => r.endpoint)).toEqual(['https://push.example/a'])
  })

  it('คนอื่นมองไม่เห็น subscription ของเรา', async () => {
    const a = await newUser()
    const b = await newUser()
    await asUser(a, tx => tx`insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
      values (${a}, 'https://push.example/b', 'p', 'a')`)
    const rows = await asUser(b, tx => tx`select id from public.push_subscriptions where user_id = ${a}`)
    expect(rows).toHaveLength(0)
  })

  it('subscribe endpoint เดิมซ้ำ (คีย์ใหม่) → upsert ทับคีย์เดิมของตัวเอง ไม่สร้างแถวซ้ำ', async () => {
    const uid = await newUser()
    const insert = (p256dh: string) => asUser(uid, tx => tx`insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
      values (${uid}, 'https://push.example/c', ${p256dh}, 'a')
      on conflict (endpoint) do update set p256dh = excluded.p256dh, auth = excluded.auth`)
    await insert('p1')
    await insert('p2')
    const rows = await asUser(uid, tx => tx`select p256dh from public.push_subscriptions where endpoint = 'https://push.example/c'`)
    expect(rows).toHaveLength(1)
    expect(rows[0]!.p256dh).toBe('p2')
  })

  it('endpoint เดิมของคนอื่น upsert ทับไม่ได้ (RLS update policy เช็ก user_id เดิม)', async () => {
    const a = await newUser()
    const b = await newUser()
    await asUser(a, tx => tx`insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
      values (${a}, 'https://push.example/d', 'p1', 'a')`)
    await expect(asUser(b, tx => tx`insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
      values (${b}, 'https://push.example/d', 'p2', 'a')
      on conflict (endpoint) do update set p256dh = excluded.p256dh`)).rejects.toThrow(/row-level security|duplicate key/)
  })

  it('ลบ subscription ของตัวเองได้ ของคนอื่นไม่ได้', async () => {
    const a = await newUser()
    const b = await newUser()
    await asUser(a, tx => tx`insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
      values (${a}, 'https://push.example/e', 'p', 'a')`)
    await asUser(b, tx => tx`delete from public.push_subscriptions where endpoint = 'https://push.example/e'`)
    const stillThere = await sql`select id from public.push_subscriptions where endpoint = 'https://push.example/e'`
    expect(stillThere).toHaveLength(1)
    await asUser(a, tx => tx`delete from public.push_subscriptions where endpoint = 'https://push.example/e'`)
    const gone = await sql`select id from public.push_subscriptions where endpoint = 'https://push.example/e'`
    expect(gone).toHaveLength(0)
  })
})
