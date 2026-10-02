# 🔥 HOTCACHE

> อ่านไฟล์นี้หลัง `HANDOFF.md` · **ห้ามเกิน 500 คำ** (`wc -w`)
> เขียนทับในที่เดิมทุกครั้งที่ทำงานเสร็จเป็นชิ้น — ไม่ใช่ต่อท้าย
> Updated: **2026-10-02**

## โปรเจกต์นี้คืออะไร
Mobile-first PWA (UI ไทย) — ผู้ใช้สร้าง twin จากรูปเต็มตัว เอาชิ้นจากตู้เสื้อผ้า (มีแล้ว/อยากได้) มาจัดเป็นชุด
ให้ AI ลองบน twin ผลเป็นลุคใน lookbook ไว้ดูเป็น ref ตอนแต่งตัว หรือแชร์ถามเพื่อนผ่านลิงก์

## ตอนนี้อยู่ตรงไหน
- ⚠️ **ย้าย repo แล้ว**: `origin` คือ `github.com/srayuththcanthrsiri77-ui/my-twin-styles` (เดิม `VoramethP/...`
  ไม่ได้แตะ) — ย้ายเพราะต้องใช้บัญชี GitHub ที่เชื่อม Vercel ได้ ประวัติ 50 commits ครบ
- ✅ **Deploy Vercel จริงแล้ว (2026-10-01)**: `https://my-twin-styles.vercel.app` login ผ่าน magic link จริง ·
  Production Branch = `prod` (ไม่ใช่ `main`) กัน `NUXT_TRY_ON_PROVIDER=mock` โดนบล็อก — push `main` = Preview
  เท่านั้น **"ลองชุด" ยัง error บน production ตั้งใจ** จนกว่าจะเลือก AI provider จริง
- ✅ ออกแบบครบ · ADR-0001..0007 · drawio 9 หน้า
- ✅ ต่อ Supabase จริงแล้ว (14 ตาราง · 3 bucket private) · cron active ทุกนาที · magic link ล็อกอินได้จริง
- ✅ S01–S16 ครบ verify จริงแล้วทุกหน้า
- ✅ **S17 PWA + Web Push — verify จริงแล้ว (2026-10-01)**: `@vite-pwa/nuxt` + `web-push` ติดตั้งเป็นแอปได้จริง ·
  `notify` ใน `privilegedLifecycleDeps()` → `server/utils/push.ts` ส่งแจ้งเตือนจริงตอนลองชุดเสร็จ/ล้มเหลว ·
  การ์ด `InstallPushCard.vue` โผล่หลังมีลุคแรก · เห็นแจ้งเตือนจริงขึ้นที่ Chrome แล้ว ครบวงจร
- ⏸️ **AI provider จริงเขียนเสร็จแต่พักไว้ (ADR-0008)**: `server/utils/try-on/fal-omnigen.ts` (fal.ai
  OmniGen V2) ต่อสำเร็จจริง (เจอ `403 Exhausted balance` ยืนยันว่าโค้ด/คีย์ถูกต้อง) แต่ fal.ai ไม่มีเครดิตฟรี
  ผู้ใช้ไม่อยากจ่ายตอนนี้ — **`NUXT_TRY_ON_PROVIDER` กลับเป็น `mock` ทั้ง `.env`+Vercel แล้ว** โค้ดเก็บไว้ไม่ลบ
  พร้อมเปิดทันทีที่พร้อมจ่าย (แค่เปลี่ยน env 2 ตัว) · ไม่มีเจ้าไหนฟรีจริงที่ใช้งานได้จริง — ใกล้สุดคือ Replicate
  (รายงานว่าให้เครดิตฟรีตอนสมัคร ยังไม่ได้ลอง)
- ✅ **nav bar ถาวร 4 ปุ่มเสร็จแล้ว**: `app/layouts/tabs.vue` + `BottomNav.vue` ครอบหน้าลุค/ตู้เสื้อผ้า/
  โปรไฟล์ ไฮไลต์ปุ่มตาม route · ลบปุ่มลิงก์ชั่วคราวที่หัวแต่ละหน้าแล้ว · `npm run check` ผ่าน · ยัง verify
  คลิกจริงไม่ได้ (ต้อง login — ผู้ใช้ต้องเช็กเอง)
- ❌ ยังไม่มี: merge `prod` จริง (ยัง preview อยู่) · AI provider จริงใช้งานจริง

## กฎเหล็ก
1. ไม่มีทางที่คนอื่นเห็นรูปท่า (twin) · แอดมินไม่เห็นทั้งรูปท่าและรูปลุค — แชร์ได้แค่รูปลุคผ่านลิงก์เพิกถอนได้ (ADR-0003)
2. ทุกการลองผ่านโควต้ารายคน + เพดานรวม ก่อนเรียก AI — ผ่าน `start_try_on()` เท่านั้น (ADR-0002)
3. secret key ใช้ได้ที่ `server/utils/privileged` ที่เดียว — webhook/cron/push/share/`/api/me/delete` เท่านั้น
   (ADR-0005 — `server/utils/push.ts` เป็นผู้เรียกที่ถูกออกแบบรองรับไว้ตั้งแต่ต้น ไม่ใช่ผู้เรียกใหม่)
4. query ในนามผู้ใช้ผ่าน `withUserDb()` เท่านั้น (ADR-0006)

## งานถัดไป
1. ผู้ใช้เช็ก nav bar ถาวรจริงในเบราว์เซอร์ (ไฮไลต์ปุ่มถูกหน้าไหม กดสลับหน้าได้ไหม)
2. (พักไว้) ถ้าพร้อมจ่ายเงินค่อยเติมเครดิต fal.ai หรือลอง Replicate (เครดิตฟรีตอนสมัคร) แล้วตั้ง
   `NUXT_TRY_ON_PROVIDER=fal-omnigen` ทั้ง `.env`+Vercel + merge `main`→`prod`
3. ผู้ใช้ทดสอบติดตั้งแอปจริงบน Android/iOS (push ทดสอบผ่านแล้วบน desktop Chrome)
4. ผู้ใช้ทดสอบ "ลบ twin"/"ลบข้อมูลทั้งหมด" (S15) เอง — **ห้าม Claude รันแทนแม้ผู้ใช้จะขอให้ช่วยเทส**
5. ⚠️ บัญชี `srayuththcanthrsiri77@gmail.com` ตั้ง `daily_quota=100` ชั่วคราว (ปกติ 5) — ถามก่อนปรับกลับ
อื่น ๆ: เชิญ VoramethP

## กับดักที่เคยเจอ
- repo **public** — commit ใช้อีเมล noreply ของ GitHub ห้ามเปลี่ยนกลับ ต้องมี local `git config user.email` ตั้งไว้เสมอ
- build: JSON เข้า SQL cast `::text::jsonb` เสมอ · pin `typescript@6` · npm 11 บล็อก install script → รัน
  `npx nuxt prepare` เองหลัง `npm i` รอบแรก
- **PKCE → Claude ล็อกอินแทนผู้ใช้ไม่ได้เลย** — fallback: สคริปต์ node ต่อ DB/secret key ตรง ยิง business
  logic ในนามผู้ใช้แทน (ลบทิ้งทุกครั้ง) — **ยกเว้นลบข้อมูลถาวร ห้ามใช้วิธีนี้เด็ดขาด**
- เครื่องนี้ไม่มี `curl` — ใช้ `node -e` + `fetch()` แทน · Postgres ทดสอบต้องสร้าง cluster ใหม่ทุกเซสชัน (สูตรใน
  HANDOFF, ติดตั้งถาวรแล้ว)
- **`useFetch('/api/x/${id}')` เดา type ไม่ได้ ถ้ามี route พี่น้อง literal ระดับเดียวกัน** — ใส่ generic
  `useFetch<T>(...)` เอง
- dev server ตายเงียบได้ (`ERR_CONNECTION_REFUSED`) — เช็ก `lsof -i :3000` ก่อนสรุปว่าเป็นบั๊ก เปิดใหม่ด้วย
  `preview_start`
- **Vercel: Production Branch ต้องมีจริง · deploy แรกขึ้น Production เสมอ · GitHub App ติดตั้งได้แค่บน repo
  ที่เป็นเจ้าของเอง** · **Gmail Custom SMTP โชว์ผู้ส่งเป็น "ฉัน"** ค้นต้อง `in:anywhere` — ดู WORKLOG
  "Deploy Vercel"

---
📜 ประวัติเต็ม: `docs/WORKLOG.md` · 📐 กฎทั้งหมด: `CLAUDE.md` · 📖 คำศัพท์: `CONTEXT.md`
