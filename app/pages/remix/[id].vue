<script setup lang="ts">
import { SLOT_LABEL } from '#shared/outfit'

// S07 เทียบคู่ — id ในเส้นทางคือลุคใหม่จาก Remix เทียบกับลุคต้นทาง (CONTEXT.md: ลุคเดิมไม่ถูกแก้)
const route = useRoute()
const toast = useToast()
const id = route.params.id as string

const { data: compare } = await useFetch(`/api/looks/${id}/compare`)
if (!compare.value) {
  throw createError({ statusCode: 404, statusMessage: 'ไม่พบข้อมูลเทียบลุค' })
}

const deleting = ref(false)
async function deleteRemix() {
  if (!compare.value) return
  deleting.value = true
  try {
    await $fetch(`/api/looks/${id}`, { method: 'DELETE' })
    toast.add({ title: 'ลบลุคใหม่แล้ว', color: 'success' })
    await navigateTo(`/looks/${compare.value.source.id}`)
  }
  catch (err) {
    toast.add({ title: 'ลบไม่สำเร็จ', description: (err as Error).message, color: 'error' })
  }
  finally {
    deleting.value = false
  }
}
</script>

<template>
  <main v-if="compare" class="mx-auto flex min-h-dvh max-w-md flex-col gap-4 p-4 pb-8">
    <header class="flex items-center gap-2">
      <UButton :to="`/looks/${id}`" icon="i-lucide-arrow-left" variant="ghost" color="neutral" aria-label="กลับ" />
      <h1 class="text-lg font-bold">
        เทียบลุค
      </h1>
    </header>

    <div class="grid grid-cols-2 gap-2">
      <div class="flex flex-col gap-1">
        <div class="aspect-[3/4] overflow-hidden rounded-xl bg-elevated">
          <img :src="compare.source.imageUrl" alt="ลุคเดิม" class="size-full object-cover">
        </div>
        <p class="text-center text-xs text-muted">
          ลุคเดิม
        </p>
      </div>
      <div class="flex flex-col gap-1">
        <div class="aspect-[3/4] overflow-hidden rounded-xl bg-elevated ring-2 ring-primary">
          <img :src="compare.remix.imageUrl" alt="ลุคใหม่" class="size-full object-cover">
        </div>
        <p class="text-center text-xs text-muted">
          ลุคใหม่
        </p>
      </div>
    </div>

    <section v-if="compare.changes.length" class="flex flex-col gap-1 rounded-xl bg-elevated p-3">
      <p class="text-sm font-semibold">
        เปลี่ยน
      </p>
      <p v-for="c in compare.changes" :key="c.slot" class="text-sm text-muted">
        {{ SLOT_LABEL[c.slot] }}: {{ c.before }} → {{ c.after }}
      </p>
    </section>

    <div class="mt-auto flex flex-col gap-2">
      <UButton :to="`/looks/${compare.remix.id}`" label="เก็บทั้งคู่" variant="outline" size="lg" block />
      <UButton label="ลบลุคใหม่" variant="ghost" color="error" size="sm" :loading="deleting" @click="deleteRemix" />
      <UButton :to="`/builder?remixOf=${compare.remix.id}`" label="Remix ต่อ" size="lg" block />
    </div>
  </main>
</template>
