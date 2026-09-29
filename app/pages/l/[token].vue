<script setup lang="ts">
import { SLOT_LABEL } from '#shared/outfit'

// S14 หน้าแชร์สาธารณะ — ไม่ต้องล็อกอิน (nuxt.config: exclude '/l/*') ไม่มีรูปท่า ไม่มี ID ผู้ใช้ (ADR-0003)
const route = useRoute()
const token = route.params.token as string

const { data: share, error } = await useFetch(`/api/share/${token}`)
</script>

<template>
  <main class="mx-auto flex min-h-dvh max-w-md flex-col gap-4 p-4 pb-8">
    <template v-if="error || !share">
      <div class="mt-auto flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <UIcon name="i-lucide-link-2-off" class="size-16 text-dimmed" />
        <p class="font-semibold">
          ลิงก์นี้ใช้ไม่ได้แล้ว
        </p>
        <p class="text-sm text-muted">
          อาจถูกเพิกถอน หรือลุคนี้ถูกลบไปแล้ว
        </p>
      </div>
      <UButton to="/" label="ไปที่ my-twin-styles" variant="outline" size="lg" block class="mt-auto" />
    </template>

    <template v-else>
      <h1 class="pt-2 text-center text-lg font-bold">
        ลุคที่แชร์กับคุณ
      </h1>
      <div class="aspect-[3/4] w-full overflow-hidden rounded-2xl bg-elevated">
        <img :src="share.imageUrl" alt="ลุค" class="size-full object-cover">
      </div>

      <section class="flex flex-col gap-2">
        <p class="text-sm font-semibold">
          ชิ้นในลุค
        </p>
        <div class="flex gap-2 overflow-x-auto">
          <div v-for="(it, i) in share.items" :key="i" class="w-16 shrink-0 text-center">
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

      <UButton to="/" label="ลองชุดบนตัวคุณเอง →" size="lg" block class="mt-auto" />
      <p class="text-center text-xs text-dimmed">
        ไม่มีรูปท่า · ไม่มี ID ผู้ใช้ในหน้านี้
      </p>
    </template>
  </main>
</template>
