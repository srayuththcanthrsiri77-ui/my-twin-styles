<script setup lang="ts">
// nav bar ถาวร 4 ปุ่ม (docs/design/README.md "Navigation (มือถือ)") — ติดอยู่ทุกหน้าหลักผ่าน layout "tabs"
const route = useRoute()

const TABS = [
  { to: '/', icon: 'i-lucide-image', label: 'ลุค' },
  { to: '/wardrobe', icon: 'i-lucide-shirt', label: 'ตู้เสื้อผ้า' },
  { to: '/builder', icon: 'i-lucide-plus-circle', label: 'ลองชุด' },
  { to: '/profile', icon: 'i-lucide-user', label: 'โปรไฟล์' },
] as const

// '/' ต้อง exact match กันไฮไลต์ค้างทุกหน้า ที่เหลือ match ด้วย prefix (เช่น /wardrobe/[id])
const isActive = (to: string) => to === '/' ? route.path === '/' : route.path.startsWith(to)
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-40 border-t border-default bg-default/95 backdrop-blur"
    style="padding-bottom: env(safe-area-inset-bottom)"
  >
    <div class="mx-auto flex max-w-md items-center justify-around">
      <NuxtLink
        v-for="tab in TABS" :key="tab.to" :to="tab.to"
        class="flex flex-1 flex-col items-center gap-0.5 py-2 text-xs"
        :class="isActive(tab.to) ? 'text-primary' : 'text-dimmed'"
      >
        <span
          class="flex size-9 items-center justify-center rounded-full"
          :class="isActive(tab.to) ? 'bg-primary/15' : ''"
        >
          <UIcon :name="tab.icon" class="size-6" />
        </span>
        {{ tab.label }}
      </NuxtLink>
    </div>
  </nav>
</template>
