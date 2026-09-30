<script setup lang="ts">
// S17: การ์ดชวนติดตั้ง PWA + เปิดแจ้งเตือน — โผล่ครั้งแรกหลังมีลุคแรก ปิดแล้วไม่โผล่อีก (localStorage)
const DISMISS_KEY = 'install-push-dismissed'

const { isSupported, subscribe } = usePush()
const toast = useToast()

const dismissed = ref(true)
const isStandalone = ref(false)
const isIos = ref(false)
const deferredPrompt = ref<Event & { prompt: () => Promise<void> } | null>(null)
const subscribing = ref(false)
const subscribed = ref(false)

onMounted(() => {
  try { dismissed.value = localStorage.getItem(DISMISS_KEY) === '1' }
  catch { dismissed.value = false }
  isStandalone.value = window.matchMedia('(display-mode: standalone)').matches
  isIos.value = /iphone|ipad|ipod/i.test(navigator.userAgent)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt.value = e as typeof deferredPrompt.value
  })
  navigator.serviceWorker?.ready
    .then(r => r.pushManager.getSubscription())
    .then(s => (subscribed.value = !!s))
    .catch(() => {})
})

const visible = computed(() => !dismissed.value && !subscribed.value && isSupported())

function dismiss() {
  dismissed.value = true
  try { localStorage.setItem(DISMISS_KEY, '1') }
  catch { /* เก็บไม่ได้ก็แค่โผล่อีกครั้งหน้า — ไม่ critical */ }
}

async function installApp() {
  if (!deferredPrompt.value) return
  await deferredPrompt.value.prompt()
  deferredPrompt.value = null
}

async function enableNotifications() {
  subscribing.value = true
  try {
    const ok = await subscribe()
    if (ok) {
      subscribed.value = true
      toast.add({ title: 'เปิดการแจ้งเตือนแล้ว', color: 'success' })
    }
    else {
      toast.add({ title: 'เปิดการแจ้งเตือนไม่สำเร็จ', description: 'ตรวจสอบสิทธิ์การแจ้งเตือนของเบราว์เซอร์', color: 'warning' })
    }
  }
  finally {
    subscribing.value = false
  }
}
</script>

<template>
  <div v-if="visible" class="flex flex-col gap-2 rounded-xl bg-elevated p-3">
    <div class="flex items-start justify-between gap-2">
      <p class="text-sm font-semibold">
        เปิดแจ้งเตือนตอนลองชุดเสร็จ
      </p>
      <UButton icon="i-lucide-x" size="xs" variant="ghost" color="neutral" aria-label="ปิด" @click="dismiss" />
    </div>

    <p v-if="isIos && !isStandalone" class="text-xs text-muted">
      กดปุ่มแชร์ 􀈂 แล้วเลือก "เพิ่มไปยังหน้าจอโฮม" ก่อน ถึงจะเปิดแจ้งเตือนได้ (ข้อจำกัดของ iOS)
    </p>
    <template v-else>
      <p class="text-xs text-muted">
        ไม่ต้องเปิดแอปค้างไว้ก็รู้ทันทีว่าลุคเสร็จหรือยัง
      </p>
      <div class="flex gap-2">
        <UButton v-if="deferredPrompt" label="ติดตั้งแอป" size="sm" variant="outline" @click="installApp" />
        <UButton label="เปิดการแจ้งเตือน" size="sm" :loading="subscribing" @click="enableNotifications" />
      </div>
    </template>
  </div>
</template>
