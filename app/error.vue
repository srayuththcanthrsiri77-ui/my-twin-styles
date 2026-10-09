<script setup lang="ts">
// หน้า error กลางของทั้งแอป (Nuxt เรียกอัตโนมัติเมื่อไม่มีใครจับ error ไว้ก่อน เช่น 404 หรือ exception ที่ไม่คาดคิด)
const props = defineProps<{ error: { statusCode: number, statusMessage?: string } }>()
const message = props.error.statusCode === 404 ? 'ไม่พบหน้านี้' : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
</script>

<template>
  <main class="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-4 p-6 text-center">
    <UIcon name="i-lucide-triangle-alert" class="size-12 text-error" />
    <p class="font-semibold text-error">
      {{ message }}
    </p>
    <UButton label="กลับหน้าแรก" @click="clearError({ redirect: '/' })" />
  </main>
</template>
