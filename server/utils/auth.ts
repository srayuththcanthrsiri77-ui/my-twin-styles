import type { H3Event } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

// ใช้ getUser() เสมอสำหรับการกันสิทธิ์ — ยิงถาม Auth server จริง (cookie ปลอมได้) · stack-setup
export async function requireUser(event: H3Event) {
  const t0 = Date.now() // TODO(perf-debug): ลบ timing log นี้หลังหาสาเหตุหน้าโหลดช้าเจอแล้ว
  const client = await serverSupabaseClient(event)
  const { data, error } = await client.auth.getUser()
  console.log(`[timing] auth.getUser ${event.path} ${Date.now() - t0}ms`)
  if (error || !data.user) throw createError({ statusCode: 401, statusMessage: 'unauthenticated' })
  return data.user
}
