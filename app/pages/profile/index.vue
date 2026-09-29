<script setup lang="ts">
import { MAX_POSES } from '#shared/pose'

// S15 โปรไฟล์ + Twin
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()

const [{ data: profile }, { data: poses }, { data: quota }] = await Promise.all([
  useFetch('/api/me/profile'),
  useFetch('/api/poses'),
  useFetch('/api/me/quota'),
])

// ชื่อผู้ใช้: แก้แล้วกดบันทึกเอง (กันยิง API ทุกตัวอักษร)
const nameDraft = ref(profile.value?.displayName ?? '')
const nameDirty = computed(() => nameDraft.value !== (profile.value?.displayName ?? ''))
const savingName = ref(false)
async function saveName() {
  savingName.value = true
  try {
    const displayName = nameDraft.value.trim() || null
    await $fetch('/api/me/profile', { method: 'PATCH', body: { displayName } })
    if (profile.value) profile.value.displayName = displayName
    toast.add({ title: 'บันทึกชื่อแล้ว', color: 'success' })
  }
  catch (err) {
    toast.add({ title: 'บันทึกไม่สำเร็จ', description: (err as Error).message, color: 'error' })
  }
  finally {
    savingName.value = false
  }
}

const signingOut = ref(false)
async function signOut() {
  signingOut.value = true
  await supabase.auth.signOut()
  await navigateTo('/login')
}

// ลบ twin — ท่าทั้งหมด (ไม่กระทบลุคที่มีอยู่แล้ว — ADR-0003) ยืนยันก่อนทุกครั้งเพราะย้อนกลับไม่ได้
const deleteTwinOpen = ref(false)
const deleteTwinOpenModel = computed({ get: () => deleteTwinOpen.value, set: v => (deleteTwinOpen.value = v) })
const deletingTwin = ref(false)
async function confirmDeleteTwin() {
  deletingTwin.value = true
  try {
    await $fetch('/api/poses', { method: 'DELETE' })
    poses.value = []
    deleteTwinOpen.value = false
    toast.add({ title: 'ลบ twin แล้ว', color: 'success' })
  }
  catch (err) {
    toast.add({ title: 'ลบไม่สำเร็จ', description: (err as Error).message, color: 'error' })
  }
  finally {
    deletingTwin.value = false
  }
}

// ลบข้อมูลทั้งหมด — ลบบัญชีจริง ย้อนกลับไม่ได้เลย ต้องพิมพ์ยืนยันก่อน
const CONFIRM_PHRASE = 'ลบทั้งหมด'
const deleteAllOpen = ref(false)
const deleteAllOpenModel = computed({ get: () => deleteAllOpen.value, set: v => (deleteAllOpen.value = v) })
const deleteAllConfirmText = ref('')
const deletingAll = ref(false)
async function confirmDeleteAll() {
  if (deleteAllConfirmText.value !== CONFIRM_PHRASE) return
  deletingAll.value = true
  try {
    await $fetch('/api/me/delete', { method: 'POST' })
    await supabase.auth.signOut()
    toast.add({ title: 'ลบข้อมูลทั้งหมดแล้ว', color: 'success' })
    await navigateTo('/login')
  }
  catch (err) {
    toast.add({ title: 'ลบไม่สำเร็จ', description: (err as Error).message, color: 'error' })
    deletingAll.value = false
  }
}
</script>

<template>
  <main class="mx-auto flex min-h-dvh max-w-md flex-col gap-4 p-4 pb-8">
    <header class="pt-2">
      <h1 class="text-xl font-bold">
        โปรไฟล์
      </h1>
    </header>

    <div class="flex items-center gap-3">
      <div class="flex size-14 shrink-0 items-center justify-center rounded-full bg-elevated">
        <UIcon name="i-lucide-user" class="size-6 text-dimmed" />
      </div>
      <div class="min-w-0 flex-1">
        <UInput v-model="nameDraft" placeholder="ชื่อผู้ใช้" size="sm" class="w-full" />
        <p class="mt-1 truncate text-xs text-muted">
          {{ user?.email }}
        </p>
      </div>
      <UButton v-if="nameDirty" label="บันทึก" size="sm" variant="outline" :loading="savingName" @click="saveName" />
    </div>

    <!-- Twin -->
    <section class="flex flex-col gap-2">
      <p class="text-sm font-semibold">
        Twin ของฉัน ({{ poses?.length ?? 0 }}/{{ MAX_POSES }} ท่า)
      </p>
      <div class="flex gap-2 overflow-x-auto">
        <div v-for="p in poses" :key="p.id" class="size-16 shrink-0 overflow-hidden rounded-xl bg-elevated">
          <img :src="p.imageUrl" alt="ท่า" class="size-full object-cover">
        </div>
        <UButton
          v-if="(poses?.length ?? 0) < MAX_POSES" to="/twin/new" icon="i-lucide-plus" size="lg"
          variant="outline" color="neutral" class="size-16 shrink-0" aria-label="เพิ่มท่า"
        />
      </div>
      <p class="text-xs text-dimmed">
        🔒 รูปท่าเห็นได้เฉพาะคุณ
      </p>
    </section>

    <!-- โควต้า -->
    <div class="rounded-xl bg-elevated p-3 text-sm">
      โควต้าวันนี้ {{ quota?.remaining ?? 0 }} / {{ quota?.dailyQuota ?? 0 }}
    </div>

    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between rounded-xl bg-elevated p-3 text-sm text-dimmed">
        <span>ติดตั้งแอป (เปิดแจ้งเตือน)</span>
        <UBadge label="เร็ว ๆ นี้" color="neutral" variant="outline" size="sm" />
      </div>
      <div class="flex items-center justify-between rounded-xl bg-elevated p-3 text-sm text-muted">
        <span>ภาษา</span>
        <span>ไทย</span>
      </div>
      <UButton label="ออกจากระบบ" variant="outline" color="neutral" block :loading="signingOut" @click="signOut" />
    </div>

    <div class="mt-auto flex flex-col gap-2">
      <UButton label="ลบ twin" variant="outline" color="error" size="sm" @click="deleteTwinOpen = true" />
      <UButton label="ลบข้อมูลทั้งหมด" variant="solid" color="error" @click="deleteAllOpen = true" />
    </div>

    <!-- ลบ twin -->
    <UDrawer v-model:open="deleteTwinOpenModel" title="ลบ twin ทั้งหมด?">
      <template #body>
        <div class="flex flex-col gap-3">
          <p class="text-sm text-muted">
            ท่าทั้ง {{ poses?.length ?? 0 }} ท่าจะถูกลบถาวร ย้อนกลับไม่ได้ — ลุคที่เคยลองไว้แล้วจะยังอยู่เหมือนเดิม
          </p>
          <UButton label="ลบ twin ถาวร" color="error" block :loading="deletingTwin" @click="confirmDeleteTwin" />
        </div>
      </template>
    </UDrawer>

    <!-- ลบข้อมูลทั้งหมด -->
    <UDrawer v-model:open="deleteAllOpenModel" title="ลบข้อมูลทั้งหมด?">
      <template #body>
        <div class="flex flex-col gap-3">
          <p class="text-sm text-muted">
            ท่า ชิ้นเสื้อผ้า ลุคทั้งหมด และบัญชีนี้จะถูกลบถาวร ย้อนกลับไม่ได้ พิมพ์ "{{ CONFIRM_PHRASE }}" เพื่อยืนยัน
          </p>
          <UInput v-model="deleteAllConfirmText" :placeholder="CONFIRM_PHRASE" />
          <UButton
            label="ลบทุกอย่างถาวร" color="error" block :loading="deletingAll"
            :disabled="deleteAllConfirmText !== CONFIRM_PHRASE" @click="confirmDeleteAll"
          />
        </div>
      </template>
    </UDrawer>
  </main>
</template>
