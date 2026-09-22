import { and, eq } from 'drizzle-orm'
import { lookPatchSchema } from '#shared/look'
import { looks } from '../../db/schema'
import { withUserDb } from '../../utils/db'

// S06: ผู้ใช้แก้ได้แค่ ⭐ กับโน้ต — คอลัมน์อื่นถูก REVOKE UPDATE ไว้แล้ว (drizzle/0001_functions_and_grants.sql)
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'invalid_id' })
  const parsed = lookPatchSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'invalid_body', data: parsed.error.issues })

  return withUserDb(event, async (tx, userId) => {
    const patch: { isFavorite?: boolean, note?: string | null } = {}
    if (parsed.data.isFavorite !== undefined) patch.isFavorite = parsed.data.isFavorite
    if (parsed.data.note !== undefined) patch.note = parsed.data.note
    const [row] = await tx.update(looks).set(patch)
      .where(and(eq(looks.id, id), eq(looks.userId, userId)))
      .returning({ id: looks.id })
    if (!row) throw createError({ statusCode: 404, statusMessage: 'look_not_found' })
    return { ok: true }
  })
})
