<script setup lang="ts">
import { DISLIKE_REASON_LABEL, type DislikeReason } from '#shared/look'

interface AdminStats {
  try_ons_today: number
  global_daily_cap: number
  new_users_today: number
  failed_today: number
  dislikes_today: number
  dislike_reasons_7d: Record<string, number>
}
interface AdminUser { userId: string, email: string, createdAt: string, dailyQuota: number, usedToday: number }
interface AdminDislike { lookId: string, reason: DislikeReason, createdAt: string }

const toast = useToast()

const { data: stats, error: statsError, refresh: refreshStats } = await useFetch<AdminStats>('/api/admin/stats')
const { data: dislikes } = await useFetch<AdminDislike[]>('/api/admin/dislikes')

// ตาราง "ผู้ใช้" — ค้น + แก้โควต้ารายแถว
const search = ref('')
const { data: users, refresh: refreshUsers } = await useFetch<AdminUser[]>('/api/admin/users', {
  query: { q: search },
})
const quotaDrafts = reactive<Record<string, number>>({})
watch(users, (list) => {
  for (const u of list ?? []) quotaDrafts[u.userId] = u.dailyQuota
}, { immediate: true })
const savingUserId = ref<string | null>(null)
async function saveUserQuota(u: AdminUser) {
  savingUserId.value = u.userId
  try {
    await $fetch(`/api/admin/users/${u.userId}`, { method: 'PATCH', body: { dailyQuota: quotaDrafts[u.userId] } })
    u.dailyQuota = quotaDrafts[u.userId]!
    toast.add({ title: 'บันทึกโควต้าแล้ว', color: 'success' })
  }
  catch (err) {
    toast.add({ title: 'บันทึกไม่สำเร็จ', description: friendlyErrorMessage(err), color: 'error' })
  }
  finally {
    savingUserId.value = null
  }
}

// เพดานรวม / วัน
const capDraft = ref(0)
watch(stats, (s) => { if (s) capDraft.value = s.global_daily_cap }, { immediate: true })
const savingCap = ref(false)
async function saveCap() {
  savingCap.value = true
  try {
    await $fetch('/api/admin/cap', { method: 'PATCH', body: { globalDailyCap: capDraft.value } })
    await refreshStats()
    toast.add({ title: 'บันทึกเพดานรวมแล้ว', color: 'success' })
  }
  catch (err) {
    toast.add({ title: 'บันทึกไม่สำเร็จ', description: friendlyErrorMessage(err), color: 'error' })
  }
  finally {
    savingCap.value = false
  }
}

let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => refreshUsers(), 300)
})

const forbidden = computed(() => (statsError.value as { statusCode?: number })?.statusCode === 403)
</script>

<template>
  <main class="mx-auto flex min-h-dvh max-w-4xl flex-col gap-4 p-4 pb-8">
    <header class="flex items-center justify-between pt-2">
      <h1 class="text-xl font-bold">
        แอดมิน
      </h1>
      <UButton to="/" icon="i-lucide-image" variant="ghost" color="neutral" aria-label="ลุค" />
    </header>

    <div v-if="forbidden" class="rounded-xl bg-elevated p-6 text-center text-sm text-muted">
      ไม่มีสิทธิ์เข้าถึงหน้านี้
    </div>

    <template v-else>
      <!-- สถิติภาพรวม -->
      <section class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="rounded-xl bg-elevated p-3">
          <p class="text-xs text-dimmed">
            ลองชุดวันนี้
          </p>
          <p class="text-lg font-bold">
            {{ stats?.try_ons_today ?? 0 }}
          </p>
        </div>
        <div class="rounded-xl bg-elevated p-3">
          <p class="text-xs text-dimmed">
            สมัครใหม่วันนี้
          </p>
          <p class="text-lg font-bold">
            {{ stats?.new_users_today ?? 0 }}
          </p>
        </div>
        <div class="rounded-xl bg-elevated p-3">
          <p class="text-xs text-dimmed">
            ล้มเหลววันนี้
          </p>
          <p class="text-lg font-bold">
            {{ stats?.failed_today ?? 0 }}
          </p>
        </div>
        <div class="rounded-xl bg-elevated p-3">
          <p class="text-xs text-dimmed">
            👎 วันนี้
          </p>
          <p class="text-lg font-bold">
            {{ stats?.dislikes_today ?? 0 }}
          </p>
        </div>
      </section>

      <!-- เพดานรวม -->
      <section class="flex items-center gap-2 rounded-xl bg-elevated p-3">
        <span class="text-sm">เพดานรวม / วัน</span>
        <UInput v-model.number="capDraft" type="number" size="sm" class="w-28" />
        <UButton label="บันทึก" size="sm" variant="outline" :loading="savingCap" @click="saveCap" />
      </section>

      <!-- ผู้ใช้ -->
      <section class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <p class="text-sm font-semibold">
            ผู้ใช้
          </p>
          <UInput v-model="search" placeholder="ค้นด้วยอีเมล" icon="i-lucide-search" size="sm" class="w-48" />
        </div>
        <div class="overflow-x-auto rounded-xl bg-elevated">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs text-dimmed">
                <th class="p-3 font-normal">
                  อีเมล
                </th>
                <th class="p-3 font-normal">
                  ใช้วันนี้
                </th>
                <th class="p-3 font-normal">
                  โควต้า
                </th>
                <th class="p-3 font-normal" />
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in users" :key="u.userId" class="border-t border-default">
                <td class="max-w-40 truncate p-3">
                  {{ u.email }}
                </td>
                <td class="p-3">
                  {{ u.usedToday }}
                </td>
                <td class="p-3">
                  <UInput v-model.number="quotaDrafts[u.userId]" type="number" size="xs" class="w-20" />
                </td>
                <td class="p-3">
                  <UButton
                    label="บันทึก" size="xs" variant="outline" :loading="savingUserId === u.userId"
                    @click="saveUserQuota(u)"
                  />
                </td>
              </tr>
              <tr v-if="!users?.length">
                <td colspan="4" class="p-6 text-center text-dimmed">
                  ไม่พบผู้ใช้
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 👎 ล่าสุด -->
      <section class="flex flex-col gap-2">
        <p class="text-sm font-semibold">
          รายการ 👎 ล่าสุด
        </p>
        <div class="flex flex-col divide-y divide-default rounded-xl bg-elevated">
          <div v-for="d in dislikes" :key="d.lookId + d.createdAt" class="flex items-center justify-between p-3 text-sm">
            <span>ลุค #{{ d.lookId.slice(0, 8) }}</span>
            <span class="text-muted">{{ DISLIKE_REASON_LABEL[d.reason] }}</span>
          </div>
          <p v-if="!dislikes?.length" class="p-6 text-center text-sm text-dimmed">
            ยังไม่มีรายการ
          </p>
        </div>
      </section>

      <p class="text-center text-xs text-dimmed">
        🔒 ไม่มีรูปท่า/รูปลุคในหน้านี้ (ADR-0003)
      </p>
    </template>
  </main>
</template>
