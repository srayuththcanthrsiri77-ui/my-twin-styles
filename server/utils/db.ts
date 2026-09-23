import { sql } from 'drizzle-orm'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type { H3Event } from 'h3'
import postgres from 'postgres'
import * as schema from '../db/schema'
import { requireUser } from './auth'

export type Db = PostgresJsDatabase<typeof schema>
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]

// ต่อ connection ใหม่ทุก request วัดได้ 600ms–2 วิ/ครั้งจากเครื่อง dev ไป Supabase pooler (จับมือ TLS ใหม่
// หมดทุกครั้ง) — ใช้ pool เดียวกันทั้ง process แทน สร้างครั้งแรกที่ต้องใช้จริงแล้ว cache ไว้ที่ module scope
// ปลอดภัยเพราะ role/claims ตั้งด้วย `set local` ซึ่งอยู่ในขอบเขต transaction เดียวเท่านั้น ไม่รั่วข้าม request
// prepare: false เพราะใช้ Supabase pooler แบบ transaction mode
let pooledClient: postgres.Sql | undefined
function getClient(event: H3Event) {
  pooledClient ??= postgres(useRuntimeConfig(event).databaseUrl, { prepare: false, max: 10 })
  return pooledClient
}

export function openDb(event: H3Event) {
  return drizzle({ client: getClient(event), schema })
}

// Drizzle ต่อด้วย role เจ้าของตาราง ซึ่งข้าม RLS — ทุก query ในนามผู้ใช้ต้องผ่าน helper นี้
// เพื่อสลับเป็น role authenticated + ตั้ง claims ให้ auth.uid() ทำงาน (set local ต้องอยู่ใน transaction)
export async function withUserDb<T>(event: H3Event, fn: (tx: Tx, userId: string) => Promise<T>): Promise<T> {
  const user = await requireUser(event)
  const db = openDb(event)
  return db.transaction(async (tx) => {
    const claims = JSON.stringify({ sub: user.id, role: 'authenticated' })
    await tx.execute(sql`select set_config('request.jwt.claims', ${claims}, true)`)
    await tx.execute(sql`set local role authenticated`)
    return fn(tx, user.id)
  })
}
