/// <reference lib="webworker" />
// S17 Web Push — ไม่ precache หน้าไหนเลย (ทุกหน้าผูก session, ดู nuxt.config.ts) มีไว้แค่ installability + push
import { precacheAndRoute } from 'workbox-precaching'

declare let self: ServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)

self.skipWaiting()
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))

interface PushPayload { title: string, body: string, url: string, tag?: string }

self.addEventListener('push', (event) => {
  if (!event.data) return
  const payload = event.data.json() as PushPayload
  event.waitUntil(self.registration.showNotification(payload.title, {
    body: payload.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: payload.tag,
    data: { url: payload.url },
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data as { url?: string } | undefined)?.url ?? '/'
  event.waitUntil((async () => {
    const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const existing = clientsList.find(c => new URL(c.url).pathname === url)
    if (existing) return existing.focus()
    return self.clients.openWindow(url)
  })())
})
