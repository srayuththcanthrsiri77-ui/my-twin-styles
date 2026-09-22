<script setup lang="ts">
// ปลายทางหลังล็อกอิน (@nuxtjs/supabase callback) — มี user แล้วพาไปหน้าแรก
// ถ้า Supabase ส่ง error กลับมา (เช่น ลิงก์หมดอายุ) ให้แสดง error + ปุ่มลองใหม่
const user = useSupabaseUser()
const route = useRoute()

const errorCode = computed(() => route.query.error_code as string | undefined)
const errorDescription = computed(() => {
  const raw = route.query.error_description as string | undefined
  return raw?.replace(/\+/g, ' ')
})

// ถ้า login สำเร็จ พาไปหน้าแรก
watch(user, (u) => { if (u) navigateTo('/') }, { immediate: true })
</script>

<template>
  <main class="flex min-h-dvh flex-col items-center justify-center gap-4 p-6">
    <!-- กรณี error เช่น ลิงก์หมดอายุ -->
    <template v-if="errorCode">
      <UIcon name="i-heroicons-exclamation-circle" class="size-12 text-error" />
      <div class="text-center">
        <p class="font-semibold text-error">ลิงก์ใช้งานไม่ได้แล้ว</p>
        <p class="mt-1 text-sm text-muted">
          {{ errorCode === 'otp_expired' ? 'ลิงก์หมดอายุแล้ว กรุณาขอลิงก์ใหม่' : errorDescription }}
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
