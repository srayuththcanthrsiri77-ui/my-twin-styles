<script setup lang="ts">
import type { ItemStatus } from '#shared/item'
import type { Slot } from '#shared/outfit'

// S10 รายละเอียดชิ้น
// ระบุ type เอง — useFetch เดา response type ของ /api/items/:id ไม่ได้ตอนมี /api/items/process
// เป็น route พี่น้องระดับเดียวกัน (literal กับ dynamic ชนกัน ทำให้ type ออกมาเป็น {})
interface ItemDetail {
  id: string
  imageUrl: string
  category: string
  slot: Slot
  color: string | null
  status: ItemStatus
  shopUrl: string | null
  name: string | null
  note: string | null
  looks: { id: string, imageUrl: string }[]
}

const route = useRoute()
const id = route.params.id as string

const { data: item } = await useFetch<ItemDetail>(`/api/items/${id}`)
if (!item.value) {
  throw createError({ statusCode: 404, statusMessage: 'ไม่พบชิ้นนี้' })
}
</script>

<template>
  <main v-if="item" class="mx-auto flex min-h-dvh max-w-md flex-col gap-4 p-4 pb-8">
    <header class="flex items-center gap-2">
      <UButton to="/wardrobe" icon="i-lucide-arrow-left" variant="ghost" color="neutral" aria-label="กลับ" />
      <h1 class="text-lg font-bold">
        ชิ้น
      </h1>
    </header>

    <div class="aspect-square w-full overflow-hidden rounded-2xl bg-elevated">
      <img :src="item.imageUrl" :alt="item.name ?? item.category" class="size-full object-cover">
    </div>

    <div class="flex flex-col gap-1">
      <p class="font-semibold">
        {{ item.name ?? item.category }} · {{ item.status === 'owned' ? 'มีแล้ว' : 'อยากได้' }}
      </p>
      <a
        v-if="item.shopUrl" :href="item.shopUrl" target="_blank" rel="noopener noreferrer"
        class="inline-flex w-fit items-center gap-1 text-sm text-primary underline"
      >
        <UIcon name="i-lucide-link" class="size-4" /> ลิงก์ร้าน
      </a>
      <p v-if="item.note" class="text-sm text-muted">
        {{ item.note }}
      </p>
    </div>

    <UButton :to="`/builder?prefill=${item.id}&slot=${item.slot}`" label="ลองชิ้นนี้" variant="outline" size="lg" block />

    <section class="flex flex-col gap-2">
      <p class="text-sm font-semibold">
        {{ item.looks.length ? `อยู่ใน ${item.looks.length} ลุค` : 'ยังไม่เคยอยู่ในลุคไหน' }}
      </p>
      <div v-if="item.looks.length" class="grid grid-cols-3 gap-2">
        <NuxtLink
          v-for="look in item.looks" :key="look.id" :to="`/looks/${look.id}`"
          class="aspect-[3/4] overflow-hidden rounded-xl bg-elevated"
        >
          <img :src="look.imageUrl" alt="ลุค" class="size-full object-cover">
        </NuxtLink>
      </div>
      <p v-if="item.status === 'wishlist'" class="text-xs text-dimmed">
        ชิ้นที่อยากได้: เห็นว่าเข้ากับของที่มีกี่ลุค ช่วยตัดสินใจซื้อ
      </p>
    </section>
  </main>
</template>
