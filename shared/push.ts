import { z } from 'zod'

// S17: payload จาก PushSubscription.toJSON() ฝั่ง browser
export const pushSubscribeSchema = z.object({
  endpoint: z.url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
})

export const pushUnsubscribeSchema = z.object({ endpoint: z.url() })
