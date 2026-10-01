// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxtjs/supabase', '@vite-pwa/nuxt'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'th' },
      title: 'my-twin-styles',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        // iOS ไม่อ่าน manifest.json เอง ต้องประกาศเองถึงจะรันแบบ standalone ตอนเปิดจาก home screen (S17)
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'theme-color', content: '#18181b' },
      ],
      link: [
        { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' },
        // @vite-pwa/nuxt ไม่ใส่ <link rel="manifest"> ให้เอง (มีแค่ endpoint) ต้องประกาศเอง
        { rel: 'manifest', href: '/manifest.webmanifest' },
      ],
    },
  },
  supabase: {
    // ทุกหน้าต้องล็อกอิน ยกเว้นหน้าแชร์สาธารณะ (S14) หน้าเข้าสู่ระบบ และไฟล์ของ service worker/manifest (S17)
    // — middleware นี้รันตอน SSR ด้วย ไม่ใช่แค่ตอน client navigate เลยแตะ path ที่ไม่ใช่หน้าจริงได้ (เจอตอน
    // /dev-sw.js ถูก redirect ไป /login จนลงทะเบียน service worker ไม่ได้ "behind a redirect, which is disallowed")
    redirectOptions: {
      login: '/login',
      callback: '/auth/confirm',
      exclude: ['/l/*', '/manifest.webmanifest', '/sw.js', '/dev-sw.js', '/workbox-*', '/icons/*'],
    },
  },
  runtimeConfig: {
    databaseUrl: '', // NUXT_DATABASE_URL — Supabase pooler (transaction mode)
    supabaseSecretKey: '', // NUXT_SUPABASE_SECRET_KEY — อ่านได้ที่ server/utils/privileged.ts ที่เดียว (ADR-0005)
    tryOnProvider: 'mock', // NUXT_TRY_ON_PROVIDER — 'mock' หรือ 'fal-omnigen' (เจ้าจริง ADR-0008)
    tryOnWebhookSecret: '', // NUXT_TRY_ON_WEBHOOK_SECRET — ใช้กับ mock adapter เท่านั้น
    tryOnMockFailRate: '0', // NUXT_TRY_ON_MOCK_FAIL_RATE — 0–1 ใช้ทดสอบ flow ล้มเหลว
    falApiKey: '', // NUXT_FAL_API_KEY — fal.ai (OmniGen V2) ใช้ได้แค่ตอนสร้าง adapter (ADR-0008)
    cronSecret: '', // NUXT_CRON_SECRET
    vapidPrivateKey: '', // NUXT_VAPID_PRIVATE_KEY — ใช้ได้ที่ server/utils/push.ts ที่เดียว (S17)
    vapidSubject: '', // NUXT_VAPID_SUBJECT — mailto: ที่ push service ใช้ติดต่อถ้ามีปัญหา
    public: {
      siteUrl: 'http://localhost:3000', // NUXT_PUBLIC_SITE_URL — ใช้สร้าง callback URL ให้ provider
      vapidPublicKey: '', // NUXT_PUBLIC_VAPID_PUBLIC_KEY — ฝั่ง client ใช้ตอน subscribe ปลอดภัย ไม่ใช่ secret
    },
  },
  routeRules: {
    // หน้าแชร์: ตรวจ token ทุกครั้ง เพิกถอนแล้วต้องตายทันที — ห้ามแคช (ADR-0003)
    '/l/**': { headers: { 'cache-control': 'no-store' } },
    // route ที่อ่าน session ห้ามแคชเด็ดขาด (stack-setup: cache poisoning) — ไม่มี isr/swr/prerender ที่ไหนเลย
    '/api/**': { headers: { 'cache-control': 'no-store' } },
  },
  // S17: custom service worker (push/notificationclick) — ไม่ precache หน้าไหนเลย เพราะทุกหน้าผูก session
  // (เหตุผลเดียวกับ routeRules ข้างบน) service worker มีไว้เพื่อ installability + Web Push เท่านั้น
  pwa: {
    strategies: 'injectManifest',
    srcDir: 'service-worker',
    filename: 'sw.ts',
    injectManifest: { globPatterns: [] },
    registerType: 'autoUpdate',
    manifest: {
      name: 'my-twin-styles',
      short_name: 'twin styles',
      description: 'สร้าง twin จากรูปตัวเอง ลองชุดจากตู้เสื้อผ้าด้วย AI แล้วเก็บเป็นลุคไว้ดูภายหลัง',
      lang: 'th',
      theme_color: '#18181b',
      background_color: '#18181b',
      display: 'standalone',
      start_url: '/',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    devOptions: { enabled: true, type: 'module' },
  },
})
