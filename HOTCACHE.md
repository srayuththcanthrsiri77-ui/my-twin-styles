# 🔥 HOTCACHE

> อ่านไฟล์นี้หลัง `HANDOFF.md` · **ห้ามเกิน 500 คำ** (`wc -w`)
> เขียนทับในที่เดิมทุกครั้งที่ทำงานเสร็จเป็นชิ้น — ไม่ใช่ต่อท้าย
> Updated: **2026-09-30**

## โปรเจกต์นี้คืออะไร
Mobile-first PWA (UI ไทย) — ผู้ใช้สร้าง twin จากรูปเต็มตัว เอาชิ้นจากตู้เสื้อผ้า (มีแล้ว/อยากได้) มาจัดเป็นชุด
ให้ AI ลองบน twin ผลเป็นลุคใน lookbook ไว้ดูเป็น ref ตอนแต่งตัว หรือแชร์ถามเพื่อนผ่านลิงก์

## ตอนนี้อยู่ตรงไหน
- ทำให้เพื่อน · github.com/VoramethP/my-twin-styles (ยังไม่เชิญ)
- ✅ ออกแบบครบ · ADR-0001..0007 · drawio 9 หน้า
- ✅ ต่อ Supabase จริงแล้ว (14 ตาราง · 3 bucket private) · cron active ทุกนาที · magic link ล็อกอินได้จริง
- ✅ **S01–S16 ทำครบและ verify คลิกจริงผ่านเบราว์เซอร์แล้วทุกหน้า**
- ✅ **S17 PWA + Web Push เขียนเสร็จ (2026-09-30)**: `@vite-pwa/nuxt` + `web-push` — manifest/ไอคอน/service
  worker (`app/service-worker/sw.ts`, ไม่ precache เพราะทุกหน้าผูก session) ติดตั้งเป็นแอปได้จริง · `notify`
  ใน `privilegedLifecycleDeps()` ต่อ Web Push จริงตอนลองชุดเสร็จ/ล้มเหลว ผ่าน `server/utils/push.ts` · การ์ด
  `InstallPushCard.vue` โผล่ในหน้า Lookbook ตอนมีลุคแรก · VAPID key ใส่ `.env` แล้ว **แต่ `NUXT_VAPID_SUBJECT`
  ยังเป็น placeholder `mailto:TODO@example.com`** ต้องผู้ใช้ใส่อีเมลจริงก่อน push จะสมบูรณ์ · `npm run build`
  โปรดักชันผ่าน · `test:db` ผ่านครบ 44 ข้อ · **ยัง verify subscribe/ได้รับแจ้งเตือนจริงไม่ได้ ต้องผู้ใช้ทดสอบเอง**
- ✅ `npm run check` ผ่าน (unit 50)
- ✅ AI adapter ทุกตัวเป็น **mock** — ยังไม่เลือก provider จริง
- ❌ ยังไม่มี: deploy จริง · nav bar ถาวร 4 ปุ่ม

## กฎเหล็ก
1. ไม่มีทางที่คนอื่นเห็นรูปท่า (twin) · แอดมินไม่เห็นทั้งรูปท่าและรูปลุค — แชร์ได้แค่รูปลุคผ่านลิงก์เพิกถอนได้ (ADR-0003)
2. ทุกการลองผ่านโควต้ารายคน + เพดานรวม ก่อนเรียก AI — ผ่าน `start_try_on()` เท่านั้น (ADR-0002)
3. secret key ใช้ได้ที่ `server/utils/privileged` ที่เดียว — webhook/cron/push/share/`/api/me/delete` เท่านั้น
   (ADR-0005 — `server/utils/push.ts` เป็นผู้เรียกที่ถูกออกแบบรองรับไว้ตั้งแต่ต้น ไม่ใช่ผู้เรียกใหม่)
4. query ในนามผู้ใช้ผ่าน `withUserDb()` เท่านั้น (ADR-0006)

## งานถัดไป
1. ⚠️ ใส่อีเมลจริงแทน `mailto:TODO@example.com` ใน `.env`'s `NUXT_VAPID_SUBJECT` (S17)
2. ผู้ใช้ทดสอบเปิดแจ้งเตือน + ติดตั้งแอปจริงบน Android/iOS เอง (Claude ไม่มี session ทำแทนไม่ได้)
3. ผู้ใช้ทดสอบ "ลบ twin"/"ลบข้อมูลทั้งหมด" (S15) เอง — **ห้าม Claude รันแทนแม้ผู้ใช้จะขอให้ช่วยเทส**
4. ⚠️ บัญชี `srayuththcanthrsiri77@gmail.com` ตั้ง `daily_quota=100` ชั่วคราว (ปกติ 5) — ถามก่อนปรับกลับ
5. ⚠️ IP เครื่อง dev เปลี่ยนบ่อย (ล่าสุด `172.20.10.2`) — เช็ก log ตอนรัน dev แล้วอัปเดต `.env` +
   Supabase Redirect URLs
อื่น ๆ: เชิญเพื่อน · เลือก AI provider จริง · deploy Vercel · nav bar ถาวร

## กับดักที่เคยเจอ
- repo **public** — commit ใช้อีเมล noreply ของ GitHub ห้ามเปลี่ยนกลับ ต้องมี local `git config user.email` ตั้งไว้เสมอ
- build: JSON เข้า SQL cast `::text::jsonb` เสมอ · pin `typescript@6` · npm 11 บล็อก install script → รัน
  `npx nuxt prepare` เองหลัง `npm i` รอบแรก
- **PKCE → Claude ล็อกอินแทนผู้ใช้ไม่ได้เลย** — fallback: สคริปต์ node ต่อ `NUXT_DATABASE_URL`/secret key ตรง
  ยิง business logic ในนามผู้ใช้แทน (ลบทิ้งทุกครั้ง) — **ยกเว้นลบข้อมูลถาวร ห้ามใช้วิธีนี้เด็ดขาด**
- เครื่องนี้ไม่มี `curl` — smoke test ใช้ `node -e` + `fetch()` แทน · Postgres ทดสอบต้องสร้าง cluster ใหม่ทุก
  เซสชัน (สูตรใน HANDOFF, `brew install postgresql@16` ถาวรแล้ว)
- **`useFetch('/api/x/${id}')` เดา type ไม่ได้ ถ้ามี route พี่น้อง literal ระดับเดียวกัน** — ใส่ generic
  `useFetch<T>(...)` เอง
- dev server ตายเงียบได้ (`ERR_CONNECTION_REFUSED`) — เช็ก `lsof -i :3000` ก่อนสรุปว่าเป็นบั๊กโค้ด เปิดใหม่ด้วย
  `preview_start`
- **Nuxt 4 srcDir = `app/`** — โมดูลที่ resolve path เอง (เช่น `@vite-pwa/nuxt` ตาม `pwa.srcDir`) มองหาไฟล์ใต้
  `app/` เสมอ วางผิดที่ได้ `ENOENT` ตรง ๆ ในล็อก
- **`@nuxtjs/supabase`'s `redirectOptions` รันตอน SSR ทุก path ไม่ใช่แค่ client navigate** — path ที่ไม่ใช่หน้า
  เว็บจริง (service worker, manifest) โดน redirect ไป `/login` ได้ถ้าไม่อยู่ใน `exclude` จน browser ลงทะเบียน
  service worker ไม่ได้ ("behind a redirect, which is disallowed") · `@vite-pwa/nuxt` ไม่ใส่
  `<link rel="manifest">` ให้เอง ต้องประกาศเองใน `app.head.link` · dev mode SW จริงอยู่ที่ `/dev-sw.js?dev-sw`

---
📜 ประวัติเต็ม: `docs/WORKLOG.md` · 📐 กฎทั้งหมด: `CLAUDE.md` · 📖 คำศัพท์: `CONTEXT.md`
