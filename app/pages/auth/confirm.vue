<script setup lang="ts">
// ปลายทางหลังล็อกอิน (@nuxtjs/supabase callback)
// module ไม่แลก code เป็น session ให้เอง — ต้องเรียก exchangeCodeForSession ที่นี่ (เอกสาร @supabase/ssr)
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const route = useRoute()

const errorCode = computed(() => route.query.error_code as string | undefined)
const errorDescription = computed(() => {
  const raw = route.query.error_description as string | undefined
  return raw?.replace(/\+/g, ' ')
})
const exchangeFailed = ref(false)

onMounted(async () => {
  const code = route.query.code as string | undefined
  if (!code) return
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) exchangeFailed.value = true
})

// ถ้า login สำเร็จ พาไปหน้าแรก
watch(user, (u) => { if (u) navigateTo('/') }, { immediate: true })
</script>

<template>
  <main class="flex min-h-dvh flex-col items-center justify-center gap-4 p-6">
    <!-- กรณี error เช่น ลิงก์หมดอายุ หรือแลก code ไม่สำเร็จ (เปิดลิงก์คนละเบราว์เซอร์กับที่ขอ) -->
    <template v-if="errorCode || exchangeFailed">
      <UIcon name="i-heroicons-exclamation-circle" class="size-12 text-error" />
      <div class="text-center">
        <p class="font-semibold text-error">ลิงก์ใช้งานไม่ได้แล้ว</p>
        <p class="mt-1 text-sm text-muted">
          {{ errorCode === 'otp_expired' ? 'ลิงก์หมดอายุแล้ว กรุณาขอลิงก์ใหม่' : errorDescription ?? 'กรุณาเปิดลิงก์ในเบราว์เซอร์เดียวกับที่ขอเข้าสู่ระบบ แล้วลองใหม่' }}
        </p>
      </div>
      <UButton label="กลับไปหน้าเข้าสู่ระบบ" to="/login" variant="outline" />
    </template>

    <!-- กรณีกำลังโหลดปกติ -->
    <template v-else>
      <p class="text-muted">กำลังเข้าสู่ระบบ…</p>
    </template>
  </main>
</template>
