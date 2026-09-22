<script setup lang="ts">
import { CATEGORIES, COLORS, type Category, type Color, type ItemStatus, slotForCategory } from '#shared/item'

// S09 เพิ่มชิ้น: ถ่าย/เลือกรูป → ลบพื้นหลัง + เดาหมวด/สี (mock) → ยืนยัน/แก้ → บันทึก
// flow เต็มอยู่ใน docs/design/my-twin-styles.drawio หน้า "3 Flow: เพิ่มชิ้น"
const route = useRoute()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()
const fromOnboarding = route.query.from === 'onboarding'
const doneTo = fromOnboarding ? '/onboarding' : '/wardrobe'

type Phase = 'pick' | 'processing' | 'confirm' | 'saved'
const phase = ref<Phase>('pick')
const fileInput = ref<HTMLInputElement>()
const previewUrl = ref<string>()
const originalPath = ref<string>()
const processedPath = ref<string>()
const backgroundRemoved = ref(false)
const saving = ref(false)

const category = ref<Category>('เสื้อ')
const color = ref<Color | undefined>()
const status = ref<ItemStatus>('owned')
const statusTouched = ref(false)
const shopUrl = ref('')
const name = ref('')
const note = ref('')
const slot = computed(() => slotForCategory(category.value))

// ใส่ลิงก์ร้าน → แนะนำ "อยากได้" ถ้าผู้ใช้ยังไม่ได้เลือกสถานะเอง (flow เพิ่มชิ้น)
watch(shopUrl, (v) => { if (v && !statusTouched.value) status.value = 'wishlist' })
function pickStatus(s: ItemStatus) { status.value = s; statusTouched.value = true }

function pick(camera: boolean) {
  if (!fileInput.value) return
  if (camera) fileInput.value.setAttribute('capture', 'environment')
  else fileInput.value.removeAttribute('capture')
  fileInput.value.click()
}

async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  ;(e.target as HTMLInputElement).value = ''
  if (!file || !user.value) return
  phase.value = 'processing'
  try {
    const img = await prepareItemImage(file)
    previewUrl.value = img.previewUrl
    const path = `${user.value.sub}/${crypto.randomUUID()}.jpg`
    const { error } = await supabase.storage.from('items').upload(path, img.blob, { contentType: 'image/jpeg' })
    if (error) throw error
    originalPath.value = path
    const result = await $fetch('/api/items/process', { method: 'POST', body: { storagePath: path } })
    backgroundRemoved.value = result.backgroundRemoved
    processedPath.value = result.processedPath
    category.value = result.suggestedCategory
    color.value = result.suggestedColor
    phase.value = 'confirm'
  }
  catch (err) {
    phase.value = 'pick'
    toast.add({ title: 'อัปโหลดรูปไม่สำเร็จ', description: (err as Error).message, color: 'error' })
  }
}

// เคลียร์ฟอร์มกลับไปเริ่มใหม่ — ไม่แตะ storage (ใช้ตอน "เพิ่มชิ้นอีก" หลังบันทึกสำเร็จแล้ว)
function reset() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = originalPath.value = processedPath.value = undefined
  statusTouched.value = false
  status.value = 'owned'
  shopUrl.value = name.value = note.value = ''
  phase.value = 'pick'
}

// ถ่ายใหม่ก่อนบันทึก — ลบรูปที่อัปโหลดไปแล้วทิ้ง ไม่ให้ค้างใน storage
async function retake() {
  if (originalPath.value) await supabase.storage.from('items').remove([originalPath.value])
  reset()
}

async function save() {
  if (!originalPath.value) return
  saving.value = true
  try {
    await $fetch('/api/items', {
      method: 'POST',
      body: {
        storagePath: backgroundRemoved.value && processedPath.value ? processedPath.value : originalPath.value,
        originalStoragePath: originalPath.value,
        category: category.value,
        color: color.value,
        status: status.value,
        shopUrl: shopUrl.value || undefined,
        name: name.value || undefined,
        note: note.value || undefined,
      },
    })
    phase.value = 'saved'
  }
  catch (err) {
    const e = err as { data?: { message?: string }, message: string }
    toast.add({ title: 'บันทึกชิ้นไม่สำเร็จ', description: e.data?.message ?? e.message, color: 'error' })
  }
  finally {
    saving.value = false
  }
}

onBeforeUnmount(() => { if (previewUrl.value) URL.revokeObjectURL(previewUrl.value) })
</script>

<template>
  <main class="mx-auto flex min-h-dvh max-w-md flex-col gap-4 p-4 pb-8">
    <header class="flex items-center gap-2">
      <UButton :to="doneTo" icon="i-lucide-x" variant="ghost" color="neutral" aria-label="ปิด" />
      <h1 class="text-lg font-bold">
        เพิ่มชิ้น
      </h1>
    </header>

    <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onFile">

    <!-- เลือกรูปที่จะเพิ่ม -->
    <template v-if="phase === 'pick'">
      <div class="flex aspect-square items-center justify-center rounded-2xl bg-elevated">
        <UIcon name="i-lucide-shirt" class="size-16 text-dimmed" />
      </div>
      <ul class="flex flex-col gap-1 text-sm text-muted">
        <li>• ถ่ายเสื้อผ้าที่มีอยู่ หรือแคปหน้าจอของที่อยากได้จากร้าน</li>
        <li>• วางบนพื้นเรียบหรือแขวน เห็นทั้งชิ้นชัด ๆ</li>
      </ul>
      <div class="mt-auto flex flex-col gap-3">
        <UButton label="ถ่ายรูป" icon="i-lucide-camera" size="lg" block @click="pick(true)" />
        <UButton label="เลือกจากคลังรูป" icon="i-lucide-image" variant="outline" size="lg" block @click="pick(false)" />
      </div>
    </template>

    <!-- กำลังอัปโหลด/ลบพื้นหลัง/เดาหมวด — skeleton แทนรูปและช่องกรอก -->
    <template v-else-if="phase === 'processing'">
      <USkeleton class="aspect-square w-full rounded-xl" />
      <USkeleton class="h-10 w-full" />
      <USkeleton class="h-10 w-full" />
      <USkeleton class="h-12 w-full" />
      <p class="text-center text-sm text-muted">
        กำลังลบพื้นหลังและเดาหมวด…
      </p>
    </template>

    <!-- S09: ยืนยัน/แก้ค่าที่ AI เดาไว้ -->
    <template v-else-if="phase === 'confirm'">
      <img :src="previewUrl" alt="รูปชิ้นที่เพิ่ม" class="aspect-square w-full rounded-xl bg-elevated object-contain">
      <UAlert
        v-if="!backgroundRemoved"
        title="ลบพื้นหลังไม่สำเร็จ — ใช้รูปเดิม"
        description="ผลลองชุดอาจเพี้ยนเล็กน้อย"
        color="warning" variant="subtle" icon="i-lucide-triangle-alert"
      />
      <p class="text-xs text-dimmed">
        ✨ AI เดาให้ — แก้ได้ถ้าไม่ตรง
      </p>

      <div class="flex flex-col gap-3">
        <USelect v-model="category" :items="[...CATEGORIES]" label="หมวด" />
        <p class="-mt-2 text-xs text-muted">
          ช่อง: {{ slot }}
        </p>
        <USelect v-model="color" :items="[...COLORS]" placeholder="สี (ไม่บังคับ)" />

        <div class="flex gap-2">
          <UButton
            label="มีแล้ว" class="flex-1 justify-center" :variant="status === 'owned' ? 'solid' : 'outline'"
            @click="pickStatus('owned')"
          />
          <UButton
            label="อยากได้" class="flex-1 justify-center" :variant="status === 'wishlist' ? 'solid' : 'outline'"
            @click="pickStatus('wishlist')"
          />
        </div>

        <UInput v-model="shopUrl" placeholder="ลิงก์ร้าน (ไม่บังคับ)" />
        <UInput v-model="name" placeholder="ชื่อ (ไม่บังคับ)" />
        <UInput v-model="note" placeholder="โน้ต (ไม่บังคับ)" />
      </div>

      <div class="mt-auto flex flex-col gap-3">
        <UButton label="บันทึกชิ้น" size="lg" block :loading="saving" @click="save" />
        <UButton label="ถ่ายใหม่" variant="outline" size="lg" block :disabled="saving" @click="retake" />
      </div>
    </template>

    <!-- บันทึกแล้ว -->
    <template v-else>
      <img :src="previewUrl" alt="ชิ้นที่บันทึก" class="aspect-square w-full rounded-xl bg-elevated object-contain">
      <UAlert title="บันทึกชิ้นลงตู้แล้ว" color="success" variant="subtle" icon="i-lucide-circle-check" />
      <div class="mt-auto flex flex-col gap-3">
        <UButton :to="doneTo" label="ถัดไป" size="lg" block />
        <UButton label="เพิ่มชิ้นอีก" variant="outline" size="lg" block @click="reset" />
      </div>
    </template>
  </main>
</template>
