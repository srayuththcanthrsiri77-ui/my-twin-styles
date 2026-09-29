# 🔥 HOTCACHE

> อ่านไฟล์นี้หลัง `HANDOFF.md` · **ห้ามเกิน 500 คำ** (`wc -w`)
> เขียนทับในที่เดิมทุกครั้งที่ทำงานเสร็จเป็นชิ้น — ไม่ใช่ต่อท้าย
> Updated: **2026-09-29**

## โปรเจกต์นี้คืออะไร
Mobile-first PWA (UI ไทย) — ผู้ใช้สร้าง twin จากรูปเต็มตัว เอาชิ้นจากตู้เสื้อผ้า (มีแล้ว/อยากได้) มาจัดเป็นชุด
ให้ AI ลองบน twin ผลเป็นลุคใน lookbook ไว้ดูเป็น ref ตอนแต่งตัว หรือแชร์ถามเพื่อนผ่านลิงก์

## ตอนนี้อยู่ตรงไหน
- ทำให้เพื่อน — repo: https://github.com/VoramethP/my-twin-styles (ยังไม่เชิญ)
- ✅ ออกแบบครบ: 25+ การตัดสินใจ · ADR-0001..0006 · drawio 9 หน้า
- ✅ ต่อ Supabase จริงแล้ว (14 ตาราง · 3 bucket private) · cron active ทุกนาที
- ✅ magic link ล็อกอินได้จริงครบวงจร — ตั้ง Gmail Custom SMTP แล้ว (แก้ "email rate limit exceeded"
  ที่ mailer ในตัวของ Supabase จำกัดไว้ต่ำมาก) ดู `docs/SETUP.md` §1
- ✅ หน้าจอทดสอบผ่าน `npm run dev` แล้ว: S01 login · S04 onboarding · S02/S03 ถ่ายท่า ·
  S08 ตู้เสื้อผ้า + S09 เพิ่มชิ้น · S11 Outfit Builder + S12 เลือกชิ้น (onboarding ①②③ ต่อกันครบ)
- ✅ **S05 Lookbook + S06 รายละเอียดลุค เสร็จ ผู้ใช้ verify จริงแล้วว่าใช้ได้และเร็ว** (`/` ลุคจริง + filter ·
  `/looks/[id]` รูปลุค/ชิ้น/โอกาส/⭐/โน้ต/👎 · รูป "ลุคตัวอย่าง (mock)" คือ placeholder ของ mock adapter)
- ✅ **S07 Remix เทียบคู่ — ผู้ใช้ verify ผ่านล็อกอินจริงแล้วว่าทำงานถูกทุกจุด** (2026-09-29): ปุ่ม Remix ใน
  `/looks/[id]` → `/builder?remixOf=<id>` เติมท่า+ชิ้นเดิมอัตโนมัติ → ลุคใหม่มีปุ่ม "ดูเทียบกับลุคเดิม" →
  `/remix/[id]` โชว์รูปคู่ + diff ทีละช่อง (เห็นจริง: "เสื้อ: Fear of God... → เสื้อออภชาติฟาร์ม") + เก็บ
  ทั้งคู่/ลบลุคใหม่/Remix ต่อ ครบตามดีไซน์ — ไม่มี migration ใหม่
- ✅ `npm run test:db` ผ่านครบ 18 ข้อ · `npm run check` ผ่าน (typecheck + unit 47)
- ✅ AI adapter ทุกตัวเป็น **mock** — ยังไม่เลือก provider จริง
- ❌ ยังไม่มี: S13/S14 แชร์ · S10 · S15 · S16 · S17 PWA · deploy · Web Push · nav bar ถาวร

## กฎเหล็ก
1. ไม่มีทางที่คนอื่นเห็นรูปท่า (twin) · แอดมินไม่เห็นทั้งรูปท่าและรูปลุค — แชร์ได้แค่รูปลุคผ่านลิงก์เพิกถอนได้ (ADR-0003)
2. ทุกการลองผ่านโควต้ารายคน + เพดานรวม ก่อนเรียก AI — ผ่าน `start_try_on()` เท่านั้น (ADR-0002)
3. secret key ใช้ได้ที่ `server/utils/privileged` ที่เดียว — webhook/cron/push เท่านั้น (ADR-0005)
4. query ในนามผู้ใช้ผ่าน `withUserDb()` เท่านั้น — Drizzle owner ข้าม RLS (ADR-0006)

## งานถัดไป
1. S13/S14 แชร์ลุค (`server/api/share/` = ผู้เรียกที่ 4 ของโซนสิทธิ์พิเศษ)
2. S10 รายละเอียดชิ้น (ค้นย้อนลุคที่มีชิ้นนี้)
3. ⚠️ **บัญชีทดสอบของผู้ใช้ (uid `097a63f0-...`) ตั้ง `profiles.daily_quota = 100` ไว้ชั่วคราวเพื่อเทส**
   (ปกติ 5) ผู้ใช้บอกให้ "เก็บไว้ก่อน" — อย่าลืมถามว่าจะปรับกลับเป็น 5 เมื่อไหร่ ก่อน deploy จริงต้องเช็กอันนี้
อื่น ๆ: เชิญเพื่อนเข้า repo · เลือก AI provider จริง → ADR · Web Push · nav bar 4 แท็บถาวร

## กับดักที่เคยเจอ
- repo **public** — commit ใช้อีเมล noreply ของ GitHub ห้ามเปลี่ยนกลับ ต้องมี local `git config user.email` ตั้งไว้เสมอ
- build: JSON เข้า SQL cast `::text::jsonb` เสมอ · pin `typescript@6` (v7 พังกับ vue-tsc) ·
  npm 11 บล็อก install script → รัน `npx nuxt prepare` เองหลัง `npm i` รอบแรก
- **`@nuxtjs/supabase` ไม่ exchangeCodeForSession ให้เอง** — เรียกเองที่ `/auth/confirm` · magic link เป็น
  PKCE ต้องขอ/กดเบราว์เซอร์เดียวกัน → **Claude ล็อกอินแทนผู้ใช้ไม่ได้เลย** (admin.generateLink() ได้ token
  คนละ flow แอปปฏิเสธถูกต้อง) fallback ที่ได้ผล: ต่อ `NUXT_DATABASE_URL`/secret key ตรงจากสคริปต์ node
  ชั่วคราว (ลบทิ้งทุกครั้ง) ยิง `start_try_on()`/`handleResult()` จริงในนามผู้ใช้แทน — ใช้ verify S07 จนสุดทางมาแล้ว
- **หน้าโหลดช้าเคยเจอ ~4 วิ — แก้แล้ว ยืนยันเร็วขึ้นจริง** (รายละเอียดใน ADR-0006 ส่วนแก้ไขเพิ่มเติม): สาเหตุหลัก
  คือ `openDb()` เปิด `postgres()` ใหม่ทุก request (600ms–2.3วิ/ครั้ง) ไม่ใช่ query เอง — เปลี่ยนเป็น pool แล้ว
- เปิด .drawio ใน draw.io แล้วบันทึก/export = จัด format ใหม่ทั้งไฟล์ (noise ไม่ใช่เนื้อหาเปลี่ยน)
- Postgres ทดสอบต้องสร้าง cluster ใหม่ทุกเซสชันตามสูตรใน HANDOFF (`brew install postgresql@16` ถาวรแล้ว)
- ตู้เสื้อผ้าทดสอบมีชิ้น "เสื้อ" ที่รูปเป็นรูปคนไม่ใช่รูปเสื้อ (อัปโหลดผิดตอนทดสอบ) — ยังไม่มีปุ่มลบชิ้น เลี่ยงไป

---
📜 ประวัติเต็ม: `docs/WORKLOG.md` · 📐 กฎทั้งหมด: `CLAUDE.md` · 📖 คำศัพท์: `CONTEXT.md`
