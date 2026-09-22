<script setup lang="ts">
import { DISLIKE_REASON_LABEL, DISLIKE_REASONS } from '#shared/look'
import { SLOT_LABEL } from '#shared/outfit'

// S06 รายละเอียดลุค
const route = useRoute()
const toast = useToast()
const id = route.params.id as string

// ยิงสองคำขอพร้อมกันแทนการรอทีละอัน (await ...; await ... = ต่อคิว ช้ากว่า Promise.all เท่าตัว)
const [{ data: look }, { data: occasions }] = await Promise.all([
  useFetch(`/api/looks/${id}`),
  useFetch('/api/occasions'),
])

if (!look.value) {
  throw createError({ statusCode: 404, statusMessage: 'ไม่พบลุคนี้' })
}

const savingFavorite = ref(false)
async function toggleFavorite() {
  if (!look.value) return
  const next = !look.value.isFavorite
  savingFavorite.value = true
  try {
    await $fetch(`/api/looks/${id}`, { method: 'PATCH', body: { isFavorite: next } })
    look.value.isFavorite = next
  }
  catch (err) {
    toast.add({ title: 'บันทึกไม่สำเร็จ', description: (err as Error).message, color: 'error' })
  }
  finally {
    savingFavorite.value = false
  }
}

// โน้ต: แก้แล้วกดบันทึกเอง — กันยิง API ทุกตัวอักษร
const noteDraft = ref(look.value.note ?? '')
const noteDirty = computed(() => noteDraft.value !== (look.value?.note ?? ''))
const savingNote = ref(false)
async function saveNote() {
  if (!look.value) return
  savingNote.value = true
  try {
    const note = noteDraft.value.trim() || null
    await $fetch(`/api/looks/${id}`, { method: 'PATCH', body: { note } })
    look.value.note = note
    toast.add({ title: 'บันทึกโน้ตแล้ว', color: 'success' })
  }
  catch (err) {
    toast.add({ title: 'บันทึกโน้ตไม่สำเร็จ', description: (err as Error).message, color: 'error' })
  }
  finally {
    savingNote.value = false
  }
}

// โอกาส: กดแล้วอัปเดตทันที (chip ไม่กี่ตัว ไม่ต้องกดยืนยันแยก)
const savingOccasions = ref(false)
async function toggleOccasion(occasionId: string) {
  if (!look.value || savingOccasions.value) return
  const has = look.value.occasionIds.includes(occasionId)
  const next = has ? look.value.occasionIds.filter(o => o !== occasionId) : [...look.value.occasionIds, occasionId]
  savingOccasions.value = true
  try {
    await $fetch(`/api/looks/${id}/occasions`, { method: 'PUT', body: { occasionIds: next } })
    look.value.occasionIds = next
  }
  catch (err) {
    toast.add({ title: 'บันทึกโอกาสไม่สำเร็จ', description: (err as Error).message, color: 'error' })
  }
  finally {
    savingOccasions.value = false
  }
}

const newOccasionName = ref('')
const addingOccasion = ref(false)
async function addOccasion() {
  const name = newOccasionName.value.trim()
  if (!name) return
  addingOccasion.value = true
  try {
    const res = await $fetch('/api/occasions', { method: 'POST', body: { name } })
    occasions.value = [...(occasions.value ?? []), res.occasion]
    newOccasionName.value = ''
    await toggleOccasion(res.occasion.id)
  }
  catch (err) {
    toast.add({ title: 'เพิ่มโอกาสไม่สำเร็จ', description: (err as Error).message, color: 'error' })
  }
  finally {
    addingOccasion.value = false
  }
}

// 👎 ไม่ถูกใจ — ใช้วัดคุณภาพ ไม่คืนโควต้า (CONTEXT.md)
const dislikeOpen = ref(false)
const dislikeOpenModel = computed({ get: () => dislikeOpen.value, set: v => (dislikeOpen.value = v) })
const submittingDislike = ref(false)
async function submitDislike(reason: typeof DISLIKE_REASONS[number]) {
  if (!look.value) return
  submittingDislike.value = true
  try {
    await $fetch(`/api/looks/${id}/dislike`, { method: 'POST', body: { reason } })
    look.value.dislikeReason = reason
    dislikeOpen.value = false
    toast.add({ title: 'ขอบคุณสำหรับความเห็น', color: 'success' })
  }
  catch (err) {
    toast.add({ title: 'ส่งความเห็นไม่สำเร็จ', description: (err as Error).message, color: 'error' })
  }
  finally {
    submittingDislike.value = false
  }
}
</script>

<template>
  <main v-if="look" class="mx-auto flex min-h-dvh max-w-md flex-col gap-4 p-4 pb-8">
    <header class="flex items-center gap-2">
      <UButton to="/" icon="i-lucide-arrow-left" variant="ghost" color="neutral" aria-label="กลับ" />
      <h1 class="text-lg font-bold">
        รายละเอียดลุค
      </h1>
    </header>

    <div class="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-elevated">
      <img :src="look.imageUrl" alt="ลุค" class="size-full object-cover">
      <UButton
        icon="i-lucide-star" :color="look.isFavorite ? 'warning' : 'neutral'" variant="solid" size="sm"
        class="absolute right-2 top-2" :loading="savingFavorite" aria-label="ถูกใจ" @click="toggleFavorite"
      />
    </div>

    <!-- ชิ้นที่ใช้ (รวมส่วนประกอบที่แนบดูคู่) -->
    <section class="flex flex-col gap-2">
      <p class="text-sm font-semibold">
        ชิ้นที่ใช้
      </p>
      <div class="flex gap-2 overflow-x-auto">
        <div v-for="(it, i) in look.items" :key="i" class="w-16 shrink-0 text-center">
          <div class="mx-auto flex size-16 items-center justify-center overflow-hidden rounded-lg bg-elevated">
            <img v-if="it.imageUrl" :src="it.imageUrl" :alt="it.name ?? it.category ?? ''" class="size-full object-cover">
            <UIcon v-else name="i-lucide-image-off" class="text-dimmed" />
          </div>
          <p class="mt-1 truncate text-xs text-muted">
            {{ SLOT_LABEL[it.slot] }}
          </p>
        </div>
      </div>
    </section>

    <!-- โอกาส -->
    <section class="flex flex-col gap-2">
      <p class="text-sm font-semibold">
        โอกาส
      </p>
      <div class="flex flex-wrap gap-1">
        <UButton
          v-for="o in occasions" :key="o.id" :label="o.name" size="xs" color="neutral"
          :variant="look.occasionIds.includes(o.id) ? 'solid' : 'outline'" :disabled="savingOccasions"
          @click="toggleOccasion(o.id)"
        />
      </div>
      <div class="flex gap-2">
        <UInput v-model="newOccasionName" placeholder="ตั้งเอง…" size="sm" class="flex-1" @keyup.enter="addOccasion" />
        <UButton label="เพิ่ม" size="sm" variant="outline" :loading="addingOccasion" :disabled="!newOccasionName.trim()" @click="addOccasion" />
      </div>
    </section>

    <!-- โน้ต -->
    <section class="flex flex-col gap-2">
      <p class="text-sm font-semibold">
        โน้ต
      </p>
      <UTextarea v-model="noteDraft" :rows="2" placeholder="จดอะไรไว้เกี่ยวกับลุคนี้…" class="w-full" />
      <UButton v-if="noteDirty" label="บันทึกโน้ต" size="sm" variant="outline" :loading="savingNote" @click="saveNote" />
    </section>

    <!-- Remix / แชร์ — ยังไม่เปิดใช้ (S07/S13 ยังไม่ทำ) -->
    <div class="flex flex-col gap-1">
      <div class="flex gap-2">
        <UButton label="Remix" icon="i-lucide-shuffle" variant="outline" color="neutral" disabled class="flex-1" />
        <UButton label="แชร์" icon="i-lucide-share-2" variant="outline" color="neutral" disabled class="flex-1" />
      </div>
      <p class="text-center text-xs text-dimmed">
        Remix และแชร์ — เร็ว ๆ นี้
      </p>
    </div>

    <UButton
      v-if="!look.dislikeReason" label="👎 ไม่ถูกใจ" variant="ghost" color="neutral" size="sm"
      @click="dislikeOpen = true"
    />
    <p v-else class="text-center text-xs text-muted">
      คุณให้ 👎 ไว้: {{ DISLIKE_REASON_LABEL[look.dislikeReason as typeof DISLIKE_REASONS[number]] }}
    </p>

    <UDrawer v-model:open="dislikeOpenModel" title="ผิดตรงไหน?">
      <template #body>
        <div class="flex flex-col gap-2">
          <UButton
            v-for="r in DISLIKE_REASONS" :key="r" :label="DISLIKE_REASON_LABEL[r]" variant="outline" color="neutral" block
            :loading="submittingDislike" @click="submitDislike(r)"
          />
        </div>
      </template>
    </UDrawer>
  </main>
</template>
