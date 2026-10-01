# 🔥 HOTCACHE

> อ่านไฟล์นี้หลัง `HANDOFF.md` · **ห้ามเกิน 500 คำ** (`wc -w`)
> เขียนทับในที่เดิมทุกครั้งที่ทำงานเสร็จเป็นชิ้น — ไม่ใช่ต่อท้าย
> Updated: **2026-09-30**

## โปรเจกต์นี้คืออะไร
Mobile-first PWA (UI ไทย) — ผู้ใช้สร้าง twin จากรูปเต็มตัว เอาชิ้นจากตู้เสื้อผ้า (มีแล้ว/อยากได้) มาจัดเป็นชุด
ให้ AI ลองบน twin ผลเป็นลุคใน lookbook ไว้ดูเป็น ref ตอนแต่งตัว หรือแชร์ถามเพื่อนผ่านลิงก์

## ตอนนี้อยู่ตรงไหน
- ⚠️ **ย้าย repo แล้ว (2026-10-01)**: `origin` คือ `github.com/srayuththcanthrsiri77-ui/my-twin-styles` ของเดิม
  `VoramethP/my-twin-styles` ไม่ได้แตะ — ย้ายเพราะต้องใช้บัญชี GitHub ที่เชื่อม Vercel ได้ (ประวัติ 50 commits ครบ)
- ✅ **Deploy Vercel จริงแล้ว (2026-10-01)**: `https://my-twin-styles.vercel.app` login ผ่าน magic link จริง ·
  Production Branch = `prod` (ไม่ใช่ `main`) กัน `NUXT_TRY_ON_PROVIDER=mock` โดนบล็อก — push `main` = Preview
  เท่านั้น **"ลองชุด" ยัง error บน production ตั้งใจ** จนกว่าจะเลือก AI provider จริง
- ✅ ออกแบบครบ · ADR-0001..0007 · drawio 9 หน้า
- ✅ ต่อ Supabase จริงแล้ว (14 ตาราง · 3 bucket private) · cron active ทุกนาที · magic link ล็อกอินได้จริง
- ✅ **S01–S16 ทำครบและ verify คลิกจริงผ่านเบราว์เซอร์แล้วทุกหน้า**
- ✅ **S17 PWA + Web Push — verify จริงแล้ว (2026-10-01)**: `@vite-pwa/nuxt` + `web-push` ติดตั้งเป็นแอปได้จริง ·
  `notify` ใน `privilegedLifecycleDeps()` → `server/utils/push.ts` ส่งแจ้งเตือนจริงตอนลองชุดเสร็จ/ล้มเหลว ·
  การ์ด `InstallPushCard.vue` โผล่หลังมีลุคแรก · เห็นแจ้งเตือนจริงขึ้นที่ Chrome แล้ว ครบวงจร
- ✅ `npm run check` ผ่าน (unit 50)
- ✅ AI adapter ทุกตัวเป็น **mock** — ยังไม่เลือก provider จริง
- ❌ ยังไม่มี: nav bar ถาวร 4 ปุ่ม · merge `prod` จริง (ยัง preview อยู่)

## กฎเหล็ก
1. ไม่มีทางที่คนอื่นเห็นรูปท่า (twin) · แอดมินไม่เห็นทั้งรูปท่าและรูปลุค — แชร์ได้แค่รูปลุคผ่านลิงก์เพิกถอนได้ (ADR-0003)
2. ทุกการลองผ่านโควต้ารายคน + เพดานรวม ก่อนเรียก AI — ผ่าน `start_try_on()` เท่านั้น (ADR-0002)
3. secret key ใช้ได้ที่ `server/utils/privileged` ที่เดียว — webhook/cron/push/share/`/api/me/delete` เท่านั้น
   (ADR-0005 — `server/utils/push.ts` เป็นผู้เรียกที่ถูกออกแบบรองรับไว้ตั้งแต่ต้น ไม่ใช่ผู้เรียกใหม่)
4. query ในนามผู้ใช้ผ่าน `withUserDb()` เท่านั้น (ADR-0006)

## งานถัดไป
1. เลือก AI provider จริงแล้ว merge `main` → `prod` ถึงจะเปิด "ลองชุด" บน production ได้จริง
2. ผู้ใช้ทดสอบติดตั้งแอปจริงบน Android/iOS เอง (push ทดสอบผ่านแล้วบน desktop Chrome)
3. ผู้ใช้ทดสอบ "ลบ twin"/"ลบข้อมูลทั้งหมด" (S15) เอง — **ห้าม Claude รันแทนแม้ผู้ใช้จะขอให้ช่วยเทส**
4. ⚠️ บัญชี `srayuththcanthrsiri77@gmail.com` ตั้ง `daily_quota=100` ชั่วคราว (ปกติ 5) — ถามก่อนปรับกลับ
5. ⚠️ IP เครื่อง dev เปลี่ยนบ่อย (ล่าสุด `172.20.10.2`) — เช็ก log ตอนรัน dev แล้วอัปเดต `.env` (เครื่อง) +
   Supabase Redirect URLs — Vercel มี URL คงที่แล้วไม่ต้องยุ่ง
อื่น ๆ: เชิญเพื่อน (VoramethP) เข้า repo ใหม่ · nav bar ถาวร

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
- **Vercel: Production Branch ต้องมีอยู่จริง · deploy แรกขึ้น Production เสมอไม่ว่าตั้งอะไรไว้ · GitHub App
  ติดตั้งได้แค่บน repo ที่บัญชีเป็นเจ้าของเอง** (repo public เห็นได้ไม่ใช่ติดตั้งได้) · **Gmail Custom SMTP ส่ง
  แล้วโชว์ผู้ส่งเป็น "ฉัน"** ค้นหาต้อง `in:anywhere` · เช็ก Supabase Logs→Auth→`otp` ยืนยัน 200 ก่อนหาว่าอีเมลหาย
  ไปไหน — รายละเอียดเต็มดู WORKLOG "Deploy Vercel"

---
📜 ประวัติเต็ม: `docs/WORKLOG.md` · 📐 กฎทั้งหมด: `CLAUDE.md` · 📖 คำศัพท์: `CONTEXT.md`
