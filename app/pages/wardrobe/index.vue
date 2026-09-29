<script setup lang="ts">
import { SLOT_LABEL, SLOTS, type Slot } from '#shared/outfit'

// S08 ตู้เสื้อผ้า — filter สถานะ (ทั้งหมด/มีแล้ว/อยากได้) + ช่อง
const { data: allItems, status: fetchStatus } = await useFetch('/api/items')

type StatusFilter = 'all' | 'owned' | 'wishlist'
const STATUS_FILTERS: { value: StatusFilter, label: string }[] = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'owned', label: 'มีแล้ว' },
  { value: 'wishlist', label: 'อยากได้' },
]
const statusFilter = ref<StatusFilter>('all')
const slotFilter = ref<Slot | 'all'>('all')

const filtered = computed(() => (allItems.value ?? []).filter(i =>
  (statusFilter.value === 'all' || i.status === statusFilter.value)
  && (slotFilter.value === 'all' || i.slot === slotFilter.value),
))
</script>

<template>
  <main class="mx-auto flex min-h-dvh max-w-md flex-col gap-4 p-4 pb-24">
    <header class="flex items-center justify-between pt-2">
      <h1 class="text-xl font-bold">
        ตู้เสื้อผ้า
      </h1>
      <UButton to="/wardrobe/new" icon="i-lucide-plus" aria-label="เพิ่มชิ้น" />
    </header>

    <!-- โครงกำลังโหลด -->
    <template v-if="fetchStatus === 'pending'">
      <div class="grid grid-cols-3 gap-2">
        <USkeleton v-for="i in 6" :key="i" class="aspect-square rounded-xl" />
      </div>
    </template>

    <!-- ตู้ว่างจริง ๆ ไม่มีชิ้นเลย -->
    <template v-else-if="!allItems?.length">
      <div class="mt-auto flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <UIcon name="i-lucide-shirt" class="size-16 text-dimmed" />
        <p class="font-semibold">
          ตู้ยังว่าง
        </p>
        <p class="text-sm text-muted">
          ถ่ายเสื้อผ้าที่มี หรือแคปของที่อยากได้จากร้าน
        </p>
        <UButton to="/wardrobe/new" label="ถ่ายเสื้อตัวแรก" size="lg" />
      </div>
    </template>

    <template v-else>
      <div class="flex gap-1">
        <UButton
          v-for="f in STATUS_FILTERS" :key="f.value" :label="f.label" size="xs"
          :variant="statusFilter === f.value ? 'solid' : 'outline'" @click="statusFilter = f.value"
        />
      </div>
      <div class="flex gap-1 overflow-x-auto">
        <UButton label="ทั้งหมด" size="xs" color="neutral" :variant="slotFilter === 'all' ? 'solid' : 'outline'" @click="slotFilter = 'all'" />
        <UButton
          v-for="s in SLOTS" :key="s" :label="SLOT_LABEL[s]" size="xs" color="neutral"
          :variant="slotFilter === s ? 'solid' : 'outline'" @click="slotFilter = s"
        />
      </div>

      <!-- filter แล้วไม่เจอ -->
      <p v-if="!filtered.length" class="py-8 text-center text-sm text-muted">
        ไม่มีชิ้นในตัวกรองนี้
      </p>

      <div v-else class="grid grid-cols-3 gap-2">
        <NuxtLink
          v-for="item in filtered" :key="item.id" :to="`/wardrobe/${item.id}`"
          class="relative aspect-square overflow-hidden rounded-xl bg-elevated"
        >
          <img :src="item.imageUrl" :alt="item.name ?? item.category" class="size-full object-cover">
          <UBadge
            v-if="item.status === 'wishlist'" label="♡ อยากได้" size="sm" color="neutral" variant="solid"
            class="absolute bottom-1 left-1"
          />
        </NuxtLink>
      </div>
    </template>
  </main>
</template>
