<script setup lang="ts">
// S01 เข้าสู่ระบบ — Google หรือ magic link · ครั้งแรก = สมัครให้อัตโนมัติ (ADR-0002)
// กรอกรหัส 6 หลักแทนกดลิงก์ — มือถือบางเครื่อง/บางแอปอีเมลสแกนลิงก์ล่วงหน้าจนลิงก์โดนใช้ไปก่อนผู้ใช้กด (otp_expired)
const supabase = useSupabaseClient()
const toast = useToast()
const email = ref('')
const code = ref('')
const sending = ref(false)
const verifying = ref(false)
const codeSent = ref(false)

async function sendCode() {
  sending.value = true
  const { error } = await supabase.auth.signInWithOtp({ email: email.value })
  sending.value = false
  if (error) toast.add({ title: 'ส่งรหัสไม่สำเร็จ', description: error.message, color: 'error' })
  else { codeSent.value = true; toast.add({ title: 'ส่งรหัสแล้ว', description: 'เปิดอีเมลแล้วกรอกรหัส 6 หลักด้านล่าง', color: 'success' }) }
}

async function verifyCode() {
  verifying.value = true
  const { error } = await supabase.auth.verifyOtp({ email: email.value, token: code.value, type: 'email' })
  verifying.value = false
  if (error) toast.add({ title: 'รหัสไม่ถูกต้อง', description: error.message, color: 'error' })
}
</script>

<template>
  <main class="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 p-6">
    <div class="text-center">
      <h1 class="text-2xl font-bold">
        my-twin-styles
      </h1>
      <p class="text-muted">
        ลองชุดบนตัวคุณ ก่อนแต่งจริง
      </p>
    </div>

    <form v-if="!codeSent" class="flex flex-col gap-2" @submit.prevent="sendCode">
      <UInput v-model="email" type="email" placeholder="อีเมล" required />
      <UButton type="submit" label="ส่งรหัสเข้าสู่ระบบ" :loading="sending" block />
    </form>

    <form v-else class="flex flex-col gap-2" @submit.prevent="verifyCode">
      <p class="text-center text-sm text-muted">
        ส่งรหัส 6 หลักไปที่ {{ email }} แล้ว
      </p>
      <UInput v-model="code" type="text" inputmode="numeric" placeholder="รหัส 6 หลัก" required />
      <UButton type="submit" label="ยืนยันรหัส" :loading="verifying" block />
      <UButton label="ส่งรหัสใหม่" variant="ghost" size="xs" @click="codeSent = false" />
    </form>

    <p class="text-center text-xs text-muted">
      ครั้งแรก = สมัครให้อัตโนมัติ
    </p>
  </main>
</template>
