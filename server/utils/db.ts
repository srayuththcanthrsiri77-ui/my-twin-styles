import { sql } from 'drizzle-orm'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type { H3Event } from 'h3'
import postgres from 'postgres'
import * as schema from '../db/schema'
import { requireUser } from './auth'

export type Db = PostgresJsDatabase<typeof schema>
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]

// ห้ามสร้าง client ที่ระดับ module — resolve ต่อ request (stack-setup)
// prepare: false เพราะใช้ Supabase pooler แบบ transaction mode
export function openDb(event: H3Event) {
  const client = postgres(useRuntimeConfig(event).databaseUrl, { prepare: false, max: 1 })
  return { db: drizzle({ client, schema }), close: () => client.end() }
}

// Drizzle ต่อด้วย role เจ้าของตาราง ซึ่งข้าม RLS — ทุก query ในนามผู้ใช้ต้องผ่าน helper นี้
// เพื่อสลับเป็น role authenticated + ตั้ง claims ให้ auth.uid() ทำงาน (set local ต้องอยู่ใน transaction)
export async function withUserDb<T>(event: H3Event, fn: (tx: Tx, userId: string) => Promise<T>): Promise<T> {
  const user = await requireUser(event)
  const { db, close } = openDb(event)
  try {
    const tTx0 = Date.now() // TODO(perf-debug): ลบ timing log นี้หลังหาสาเหตุหน้าโหลดช้าเจอแล้ว
    const result = await db.transaction(async (tx) => {
      const claims = JSON.stringify({ sub: user.id, role: 'authenticated' })
      await tx.execute(sql`select set_config('request.jwt.claims', ${claims}, true)`)
      await tx.execute(sql`set local role authenticated`)
      return fn(tx, user.id)
    })
    console.log(`[timing] db.transaction (รวม connect ครั้งแรก + query) ${event.path} ${Date.now() - tTx0}ms`)
    return result
  }
  finally {
    await close()
  }
}
