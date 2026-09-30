// S17 Web Push — ฝั่ง client: ขอสิทธิ์ + subscribe ผ่าน service worker ที่ @vite-pwa/nuxt ลงทะเบียนให้แล้ว
function urlBase64ToUint8Array(base64: string) {
  const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=')
  const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export function usePush() {
  const config = useRuntimeConfig()

  const isSupported = () => import.meta.client && 'serviceWorker' in navigator && 'PushManager' in window

  async function subscribe() {
    if (!isSupported() || !config.public.vapidPublicKey) return false
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(config.public.vapidPublicKey),
    })
    await $fetch('/api/push/subscribe', { method: 'POST', body: subscription.toJSON() })
    return true
  }

  async function unsubscribe() {
    if (!isSupported()) return
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (!subscription) return
    await $fetch('/api/push/unsubscribe', { method: 'POST', body: { endpoint: subscription.endpoint } })
    await subscription.unsubscribe()
  }

  return { isSupported, subscribe, unsubscribe }
}
