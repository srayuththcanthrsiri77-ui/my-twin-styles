// S17 Web Push — อยู่ในโซนสิทธิ์พิเศษ (ADR-0005) เพราะอ่าน push_subscriptions ของผู้ใช้อื่นได้ (ข้าม RLS)
// โดยไม่มี session ผู้ใช้เลย (เรียกจาก webhook/cron หลังลองชุดเสร็จ) — ตัว VAPID key เองไม่ใช่ของ Supabase
// แต่ผูกกับกฎเดียวกันเพราะต้องใช้ openPrivilegedDb() อ่านข้าม RLS
import webpush from 'web-push'
import type { H3Event } from 'h3'
import { eq } from 'drizzle-orm'
import * as t from '../db/schema'
import type { Db } from './db'

export interface PushMessage { title: string, body: string, url: string, tag?: string }

// ส่งหาทุกอุปกรณ์ที่ผู้ใช้เคย subscribe ไว้ — endpoint ที่ตายแล้ว (410/404) ลบทิ้งกันสะสมขยะ
export async function sendPushToUser(event: H3Event, db: Db, userId: string, message: PushMessage) {
  const config = useRuntimeConfig(event)
  if (!config.vapidPrivateKey || !config.public.vapidPublicKey) return // ยังไม่ตั้ง VAPID — ข้ามเงียบ ๆ
  webpush.setVapidDetails(config.vapidSubject, config.public.vapidPublicKey, config.vapidPrivateKey)

  const subs = await db.select().from(t.pushSubscriptions).where(eq(t.pushSubscriptions.userId, userId))
  const payload = JSON.stringify(message)
  await Promise.all(subs.map(async (sub) => {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload)
    }
    catch (err) {
      const statusCode = (err as { statusCode?: number }).statusCode
      if (statusCode === 404 || statusCode === 410) {
        await db.delete(t.pushSubscriptions).where(eq(t.pushSubscriptions.id, sub.id))
      }
      // อื่น ๆ (network/quota) ปล่อยผ่าน — ไม่ควรทำให้ webhook/cron ล้มเหลวเพราะแจ้งเตือนส่งไม่ออก
    }
  }))
}
