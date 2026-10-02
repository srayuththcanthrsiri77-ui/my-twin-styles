<script setup lang="ts">
// S05 Lookbook — หน้าแรกของแอป · ผู้ใช้ใหม่ที่ยังไม่ข้าม onboarding ถูกพาไป S04 (Q20)
definePageMeta({ layout: 'tabs' })
// ยิงสามคำขอพร้อมกันแทนการรอทีละอัน (await ...; await ...; await ... = ต่อคิว ช้ากว่า Promise.all)
const [{ data: progress }, { data, status: fetchStatus }, { data: occasions }] = await Promise.all([
  useFetch('/api/me/progress'),
  useFetch('/api/looks'),
  useFetch('/api/occasions'),
])

onMounted(() => {
  let skipped = false
  try { skipped = localStorage.getItem('onboarding-skipped') === '1' }
  catch { /* อ่านไม่ได้ = ถือว่ายังไม่ข้าม */ }
  if (progress.value && !progress.value.hasLook && !skipped) navigateTo('/onboarding')
})

const PENDING_LABEL: Record<string, string> = { queued: 'รอคิว', running: 'กำลังลอง' }

const favoriteOnly = ref(false)
const occasionFilter = ref<string>('all')

const filtered = computed(() => (data.value?.looks ?? []).filter(l =>
  (!favoriteOnly.value || l.isFavorite)
  && (occasionFilter.value === 'all' || l.occasionIds.includes(occasionFilter.value)),
))
const isEmpty = computed(() => !data.value?.pending.length && !data.value?.looks.length)
</script>

<template>
  <main class="mx-auto flex min-h-dvh max-w-md flex-col gap-4 p-4 pb-24">
    <header class="pt-2">
      <h1 class="text-xl font-bold">
        ลุคของฉัน
      </h1>
    </header>

    <!-- โครงกำลังโหลด -->
    <template v-if="fetchStatus === 'pending'">
      <div class="grid grid-cols-2 gap-3">
        <USkeleton v-for="i in 4" :key="i" class="aspect-[3/4] rounded-xl" />
      </div>
    </template>

    <!-- ยังไม่มีอะไรเลย -->
    <template v-else-if="isEmpty">
      <div class="mt-auto flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <UIcon name="i-lucide-sparkles" class="size-16 text-dimmed" />
        <p class="font-semibold">
          ยังไม่มีลุค
        </p>
        <p class="text-sm text-muted">
          เลือกชิ้นแล้วให้ AI ลองบน twin ของคุณ
        </p>
        <UButton v-if="!progress?.hasTwin" to="/twin/new" label="สร้าง twin ก่อน" size="lg" />
        <UButton v-else to="/builder" label="ลองชุดแรกของคุณ" size="lg" />
      </div>
    </template>

    <template v-else>
      <!-- S17: ชวนเปิดแจ้งเตือน — โผล่ครั้งแรกหลังมีลุคแรกแล้วเท่านั้น -->
      <InstallPushCard v-if="data?.looks.length" />

      <!-- การลองที่ค้างอยู่ -->
      <section v-if="data?.pending.length" class="flex flex-col gap-2">
        <div v-for="p in data.pending" :key="p.id" class="flex items-center gap-3 rounded-xl bg-elevated p-3">
          <UIcon name="i-lucide-hourglass" class="size-6 shrink-0 animate-pulse text-dimmed" />
          <p class="text-sm">
            {{ PENDING_LABEL[p.status] ?? p.status }} — ผลจะขึ้นที่นี่
          </p>
        </div>
      </section>

      <!-- filter -->
      <div v-if="data?.looks.length" class="flex flex-wrap items-center gap-1">
        <UButton label="ทั้งหมด" size="xs" color="neutral" :variant="occasionFilter === 'all' ? 'solid' : 'outline'" @click="occasionFilter = 'all'" />
        <UButton
          v-for="o in occasions" :key="o.id" :label="o.name" size="xs" color="neutral"
          :variant="occasionFilter === o.id ? 'solid' : 'outline'" @click="occasionFilter = o.id"
        />
        <UButton
          icon="i-lucide-star" size="xs" :color="favoriteOnly ? 'warning' : 'neutral'"
          :variant="favoriteOnly ? 'solid' : 'outline'" aria-label="ที่ชอบเท่านั้น" @click="favoriteOnly = !favoriteOnly"
        />
      </div>

      <p v-if="data?.looks.length && !filtered.length" class="py-8 text-center text-sm text-muted">
        ไม่มีลุคในตัวกรองนี้
      </p>

      <div v-else-if="filtered.length" class="grid grid-cols-2 gap-3">
        <NuxtLink
          v-for="look in filtered" :key="look.id" :to="`/looks/${look.id}`"
          class="relative aspect-[3/4] overflow-hidden rounded-xl bg-elevated"
        >
          <img :src="look.imageUrl" alt="ลุค" class="size-full object-cover">
          <UIcon v-if="look.isFavorite" name="i-lucide-star" class="absolute right-2 top-2 size-5 text-warning" />
        </NuxtLink>
      </div>
    </template>
  </main>
</template>
