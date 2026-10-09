<script setup lang="ts">
import { MAX_ACCESSORIES, outfitSchema, RENDER_SLOTS, SLOT_LABEL, type RenderSlot, type Slot } from '#shared/outfit'

// S11 Outfit Builder + S12 เลือกชิ้นใส่ช่อง (sheet)
// flow เต็มอยู่ใน docs/design/my-twin-styles.drawio หน้า "4 Flow: ลองชุด"
const route = useRoute()
const toast = useToast()
const fromOnboarding = route.query.from === 'onboarding'
// S07: มาจากปุ่ม Remix ใน /looks/[id] — เติมท่า+ชิ้นเดิมให้ แล้วอ้างถึงลุคต้นทางตอนส่ง (CONTEXT.md)
const remixOfLookId = route.query.remixOf as string | undefined
const doneTo = fromOnboarding ? '/onboarding' : remixOfLookId ? `/looks/${remixOfLookId}` : '/'

// ยิงคำขอพร้อมกันแทนการรอทีละอัน (await ...; await ...; await ... = ต่อคิว ช้ากว่า Promise.all)
const [{ data: poses }, { data: allItems }, { data: quota, refresh: refreshQuota }, remixSourceRes] = await Promise.all([
  useFetch('/api/poses'),
  useFetch('/api/items'),
  useFetch('/api/me/quota'),
  remixOfLookId ? useFetch(`/api/looks/${remixOfLookId}`) : Promise.resolve(null),
])
const remixSource = remixSourceRes?.data.value

const selectedPoseId = ref<string>()
const slotSelection = reactive<Record<RenderSlot, string | null>>({ top: null, bottom: null, outer: null, dress: null })
const accessoryIds = ref<string[]>([])
const submitting = ref(false)
const submitted = ref(false)

function itemsInSlot(slot: Slot) {
  return (allItems.value ?? []).filter(i => i.slot === slot)
}
const itemById = computed(() => new Map((allItems.value ?? []).map(i => [i.id, i])))

// จากลิงก์ "+ เพิ่มชิ้นใหม่" ใน picker ที่พาไปเพิ่มชิ้นแล้วกลับมา — ใส่ชิ้นที่เพิ่งสร้างลงช่องทันที (flow เพิ่มชิ้น)
const prefillId = route.query.prefill as string | undefined
const prefillSlot = route.query.slot as Slot | undefined

// เลือกท่าแรกให้ + เติมชิ้นจากตู้ให้อัตโนมัติรอบแรก (onboarding ③: "Builder เติมชิ้นให้อัตโนมัติ")
let initialized = false
watchEffect(() => {
  if (initialized || !poses.value) return
  initialized = true
  // Remix: เติมท่า + ทุกช่องจากลุคต้นทาง — ชิ้นที่ถูกลบไปแล้ว (id เป็น null) ปล่อยช่องว่างให้เลือกใหม่
  if (remixSource) {
    selectedPoseId.value = remixSource.poseId ?? poses.value[0]?.id
    for (const it of remixSource.items) {
      if (!it.id) continue
      if (it.slot === 'accessory') accessoryIds.value.push(it.id)
      else slotSelection[it.slot] = it.id
    }
    return
  }
  selectedPoseId.value = poses.value[0]?.id
  if (prefillId && prefillSlot) {
    applySelection(prefillSlot, prefillId)
    return
  }
  const top = itemsInSlot('top')[0]?.id ?? null
  const bottom = itemsInSlot('bottom')[0]?.id ?? null
  if (top && bottom) { slotSelection.top = top; slotSelection.bottom = bottom }
  else { slotSelection.dress = itemsInSlot('dress')[0]?.id ?? null }
  slotSelection.outer = itemsInSlot('outer')[0]?.id ?? null
})

const outfitItems = computed(() => {
  const items: { slot: Slot, itemId: string }[] = []
  for (const s of RENDER_SLOTS) {
    const id = slotSelection[s]
    if (id) items.push({ slot: s, itemId: id })
  }
  for (const id of accessoryIds.value) items.push({ slot: 'accessory', itemId: id })
  return items
})
const validation = computed(() => outfitSchema.safeParse({
  poseId: selectedPoseId.value,
  items: outfitItems.value,
  remixOfLookId,
}))
const canSubmit = computed(() => validation.value.success && (quota.value?.remaining ?? 0) > 0 && !submitting.value)

// S12: เลือกชิ้นใส่ช่อง — accessory เลือกได้หลายชิ้น ที่เหลือเลือกแล้วปิด sheet ทันที
const pickerSlot = ref<Slot | null>(null)
const pickerOpen = computed({
  get: () => pickerSlot.value !== null,
  set: (v: boolean) => { if (!v) pickerSlot.value = null },
})
function openPicker(slot: Slot) { pickerSlot.value = slot }
function isPicked(itemId: string) {
  return pickerSlot.value === 'accessory' ? accessoryIds.value.includes(itemId) : slotSelection[pickerSlot.value as RenderSlot] === itemId
}

function applySelection(slot: Slot, itemId: string) {
  if (slot === 'accessory') {
    const i = accessoryIds.value.indexOf(itemId)
    if (i >= 0) accessoryIds.value.splice(i, 1)
    else if (accessoryIds.value.length < MAX_ACCESSORIES) accessoryIds.value.push(itemId)
    return
  }
  // เดรสแทนเสื้อ+ท่อนล่าง ใส่ซ้อนกันไม่ได้ (shared/outfit.ts)
  if (slot === 'dress') { slotSelection.top = null; slotSelection.bottom = null }
  else if (slot === 'top' || slot === 'bottom') { slotSelection.dress = null }
  slotSelection[slot] = itemId
}
function pickItem(itemId: string) {
  if (!pickerSlot.value) return
  applySelection(pickerSlot.value, itemId)
  if (pickerSlot.value !== 'accessory') pickerSlot.value = null
}
function clearSlot(slot: RenderSlot) { slotSelection[slot] = null }
function removeAccessory(id: string) { accessoryIds.value = accessoryIds.value.filter(a => a !== id) }

async function submit() {
  if (!validation.value.success) return
  submitting.value = true
  try {
    await $fetch('/api/try-ons', { method: 'POST', body: validation.value.data })
    submitted.value = true
    await refreshQuota()
  }
  catch (err) {
    toast.add({ title: 'ลองชุดไม่สำเร็จ', description: friendlyErrorMessage(err), color: 'error' })
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="mx-auto flex min-h-dvh max-w-md flex-col gap-4 p-4 pb-8">
    <header class="flex items-center gap-2">
      <UButton :to="doneTo" icon="i-lucide-x" variant="ghost" color="neutral" aria-label="ปิด" />
      <h1 class="text-lg font-bold">
        {{ remixOfLookId ? 'Remix' : 'ลองชุด' }}
      </h1>
    </header>

    <p v-if="remixOfLookId && !submitted" class="-mt-2 text-xs text-muted">
      แก้ท่าหรือชิ้นแล้วลองใหม่ — ลุคเดิมยังอยู่เหมือนเดิม ไม่ถูกแก้
    </p>

    <template v-if="submitted">
      <div class="mt-auto flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <UIcon name="i-lucide-hourglass" class="size-16 text-dimmed" />
        <p class="font-semibold">
          ส่งลองชุดแล้ว
        </p>
        <p class="text-sm text-muted">
          {{ remixOfLookId ? 'ลุคใหม่จะอยู่ใน Lookbook — เปิดดูแล้วกดเทียบกับลุคเดิมได้เลย' : 'กำลังให้ AI ลองชุดอยู่ — ออกไปทำอย่างอื่นก่อนได้ ผลจะอยู่ใน Lookbook' }}
        </p>
      </div>
      <div class="mt-auto flex flex-col gap-3">
        <UButton :to="doneTo" label="ไปต่อ" size="lg" block />
        <UButton label="ลองอีกชุด" variant="outline" size="lg" block @click="submitted = false" />
      </div>
    </template>

    <template v-else>
      <!-- ท่า -->
      <section class="flex flex-col gap-2">
        <p class="text-sm font-semibold">
          ท่า
        </p>
        <div v-if="!poses?.length" class="text-sm text-muted">
          ยังไม่มีท่า —
          <NuxtLink to="/twin/new" class="underline">
            ถ่ายท่าก่อน
          </NuxtLink>
        </div>
        <div v-else class="flex gap-2 overflow-x-auto">
          <button
            v-for="p in poses" :key="p.id" type="button"
            class="size-16 shrink-0 overflow-hidden rounded-xl ring-2"
            :class="selectedPoseId === p.id ? 'ring-primary' : 'ring-transparent'"
            @click="selectedPoseId = p.id"
          >
            <img :src="p.imageUrl" alt="ท่า" class="size-full object-cover">
          </button>
        </div>
      </section>

      <!-- ช่อง -->
      <section class="flex flex-col gap-2">
        <p class="text-sm font-semibold">
          ช่อง
        </p>
        <div v-for="s in RENDER_SLOTS" :key="s" class="flex items-center gap-3 rounded-xl bg-elevated p-2">
          <div class="size-14 shrink-0 overflow-hidden rounded-lg bg-default">
            <img v-if="slotSelection[s]" :src="itemById.get(slotSelection[s]!)?.imageUrl" alt="" class="size-full object-cover">
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs text-muted">
              {{ SLOT_LABEL[s] }}{{ s === 'outer' || s === 'dress' ? ' (ไม่บังคับ)' : '' }}
            </p>
            <p class="truncate text-sm">
              {{ slotSelection[s] ? (itemById.get(slotSelection[s]!)?.name ?? itemById.get(slotSelection[s]!)?.category) : '—' }}
            </p>
          </div>
          <UButton v-if="slotSelection[s]" icon="i-lucide-x" size="xs" variant="ghost" color="neutral" aria-label="เอาออก" @click="clearSlot(s)" />
          <UButton label="เลือก" size="xs" variant="outline" @click="openPicker(s)" />
        </div>
      </section>

      <!-- ส่วนประกอบ -->
      <section class="flex flex-col gap-2">
        <p class="text-sm font-semibold">
          ส่วนประกอบ <span class="font-normal text-dimmed">(แนบดูคู่ ไม่ render)</span>
        </p>
        <div class="flex flex-wrap gap-2">
          <div v-for="id in accessoryIds" :key="id" class="relative size-14 overflow-hidden rounded-lg bg-elevated">
            <img :src="itemById.get(id)?.imageUrl" alt="" class="size-full object-cover">
            <button
              type="button" class="absolute right-0 top-0 flex size-4 items-center justify-center rounded-bl bg-black/60 text-white"
              @click="removeAccessory(id)"
            >
              <UIcon name="i-lucide-x" class="size-3" />
            </button>
          </div>
          <UButton
            v-if="accessoryIds.length < MAX_ACCESSORIES" icon="i-lucide-plus" size="sm" variant="outline" color="neutral"
            aria-label="เพิ่มส่วนประกอบ" @click="openPicker('accessory')"
          />
        </div>
      </section>

      <div class="mt-auto flex flex-col gap-2">
        <p v-if="!validation.success" class="text-center text-xs text-muted">
          {{ validation.error.issues[0]?.message ?? 'เลือกท่า + เสื้อ กับ ท่อนล่าง (หรือเดรส) ให้ครบก่อน' }}
        </p>
        <UButton
          :label="`ลองชุด · เหลือ ${quota?.remaining ?? 0}/${quota?.dailyQuota ?? 0} วันนี้`"
          size="lg" block :disabled="!canSubmit" :loading="submitting" @click="submit"
        />
      </div>
    </template>

    <!-- S12: เลือกชิ้นใส่ช่อง -->
    <UDrawer v-model:open="pickerOpen" :title="pickerSlot ? `เลือก: ${SLOT_LABEL[pickerSlot]}` : undefined">
      <template #body>
        <div v-if="pickerSlot" class="flex flex-col gap-3">
          <div v-if="!itemsInSlot(pickerSlot).length" class="py-8 text-center text-sm text-muted">
            ยังไม่มีชิ้นในช่องนี้
          </div>
          <div v-else class="grid grid-cols-3 gap-2">
            <button
              v-for="item in itemsInSlot(pickerSlot)" :key="item.id" type="button"
              class="relative aspect-square overflow-hidden rounded-xl bg-elevated ring-2"
              :class="isPicked(item.id) ? 'ring-primary' : 'ring-transparent'"
              @click="pickItem(item.id)"
            >
              <img :src="item.imageUrl" :alt="item.name ?? item.category" class="size-full object-cover">
              <UBadge
                v-if="item.status === 'wishlist'" label="♡ อยากได้" size="sm" color="neutral" variant="solid"
                class="absolute bottom-1 left-1"
              />
            </button>
          </div>
          <UButton :to="`/wardrobe/new?from=builder&slot=${pickerSlot}`" label="+ เพิ่มชิ้นใหม่" variant="outline" block />
        </div>
      </template>
    </UDrawer>
  </main>
</template>
