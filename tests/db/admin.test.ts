import { afterAll, describe, expect, it } from 'vitest'
import { asUser, newUser, sql, url } from './helpers'

// S16 แอดมิน — ฟังก์ชันทุกตัวต้องเช็ก role = 'admin' เองก่อนทำงาน (drizzle/0003_admin_functions.sql)
describe.skipIf(!url)('Admin functions (S16)', () => {
  afterAll(async () => { await sql?.end() })

  async function makeAdmin(uid: string) {
    await sql`update public.profiles set role = 'admin' where user_id = ${uid}`
  }

  it('ผู้ใช้ทั่วไปเรียก admin_set_global_cap ไม่ได้ — ได้ forbidden', async () => {
    const uid = await newUser()
    await expect(asUser(uid, tx => tx`select public.admin_set_global_cap(100)`)).rejects.toThrow(/forbidden/)
  })

  it('แอดมินปรับเพดานรวมได้ และค่าถูกบันทึกจริง', async () => {
    const uid = await newUser()
    await makeAdmin(uid)
    const [{ cap: before }] = await sql`select global_daily_cap as cap from public.app_settings where id = 1` as unknown as [{ cap: number }]
    await asUser(uid, tx => tx`select public.admin_set_global_cap(${before + 1})`)
    const [{ cap: after }] = await sql`select global_daily_cap as cap from public.app_settings where id = 1` as unknown as [{ cap: number }]
    expect(after).toBe(before + 1)
    await sql`update public.app_settings set global_daily_cap = ${before} where id = 1`
  })

  it('ผู้ใช้ทั่วไปเรียก admin_set_user_quota ไม่ได้ — ได้ forbidden', async () => {
    const uid = await newUser()
    const target = await newUser()
    await expect(asUser(uid, tx => tx`select public.admin_set_user_quota(${target}, 20)`)).rejects.toThrow(/forbidden/)
  })

  it('แอดมินปรับโควต้ารายคนได้', async () => {
    const admin = await newUser()
    await makeAdmin(admin)
    const target = await newUser(5)
    await asUser(admin, tx => tx`select public.admin_set_user_quota(${target}, 42)`)
    const [row] = await sql`select daily_quota from public.profiles where user_id = ${target}`
    expect(row?.daily_quota).toBe(42)
  })

  it('แอดมินค้นหาผู้ใช้ด้วยอีเมลได้ และเห็น used_today', async () => {
    const admin = await newUser()
    await makeAdmin(admin)
    const target = await newUser()
    const [row] = await asUser(admin, tx => tx`select * from public.admin_list_users(${target}, 10)`)
    expect(row?.user_id).toBe(target)
    expect(row?.used_today).toBe(0)
  })

  it('ผู้ใช้ทั่วไปเรียก admin_list_users ไม่ได้ — ได้ forbidden', async () => {
    const uid = await newUser()
    await expect(asUser(uid, tx => tx`select * from public.admin_list_users(null, 10)`)).rejects.toThrow(/forbidden/)
  })

  it('แอดมินดูรายการ 👎 ล่าสุดได้ — ไม่มีรูปติดมาด้วย (ADR-0003)', async () => {
    const admin = await newUser()
    await makeAdmin(admin)
    const rows = await asUser(admin, tx => tx`select * from public.admin_recent_dislikes(5)`)
    expect(Array.isArray(rows)).toBe(true)
    if (rows[0]) {
      expect(Object.keys(rows[0]).sort()).toEqual(['created_at', 'look_id', 'reason'])
    }
  })

  it('ผู้ใช้ทั่วไปเรียก admin_recent_dislikes ไม่ได้ — ได้ forbidden', async () => {
    const uid = await newUser()
    await expect(asUser(uid, tx => tx`select * from public.admin_recent_dislikes(5)`)).rejects.toThrow(/forbidden/)
  })
})
