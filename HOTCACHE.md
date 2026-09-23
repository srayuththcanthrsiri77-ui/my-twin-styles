# 🔥 HOTCACHE

> อ่านไฟล์นี้หลัง `HANDOFF.md` · **ห้ามเกิน 500 คำ** (`wc -w`)
> เขียนทับในที่เดิมทุกครั้งที่ทำงานเสร็จเป็นชิ้น — ไม่ใช่ต่อท้าย
> Updated: **2026-09-23**

## โปรเจกต์นี้คืออะไร
Mobile-first PWA (UI ไทย) — ผู้ใช้สร้าง twin จากรูปเต็มตัว เอาชิ้นจากตู้เสื้อผ้า (มีแล้ว/อยากได้) มาจัดเป็นชุด
ให้ AI ลองบน twin ผลเป็นลุคใน lookbook ไว้ดูเป็น ref ตอนแต่งตัว หรือแชร์ถามเพื่อนผ่านลิงก์

## ตอนนี้อยู่ตรงไหน
- ทำให้เพื่อน — repo public: https://github.com/VoramethP/my-twin-styles (ยังไม่เชิญ)
- ✅ ออกแบบครบ: 25+ การตัดสินใจ · ADR-0001..0006 · drawio 9 หน้า
- ✅ ต่อ Supabase จริงแล้ว (14 ตาราง · 3 bucket private) · cron active ทุกนาที
- ✅ magic link ล็อกอินได้จริงครบวงจร — ตั้ง Gmail Custom SMTP แล้ว (แก้ "email rate limit exceeded"
  ที่ mailer ในตัวของ Supabase จำกัดไว้ต่ำมาก) ดู `docs/SETUP.md` §1
- ✅ หน้าจอทดสอบผ่าน `npm run dev` แล้ว: S01 login · S04 onboarding · S02/S03 ถ่ายท่า ·
  S08 ตู้เสื้อผ้า + S09 เพิ่มชิ้น · S11 Outfit Builder + S12 เลือกชิ้น (onboarding ①②③ ต่อกันครบ)
- ✅ **S05 Lookbook + S06 รายละเอียดลุค เสร็จแล้ว ผู้ใช้ verify จริงแล้วว่าใช้ได้และเร็ว** (2026-09-23):
  `/` = ลุคจริง (การลองค้างอยู่ด้านบน · filter โอกาส/⭐) · `/looks/[id]` = รูปลุค · ชิ้นที่ใช้ · โอกาส
  (เลือก/ตั้งเอง) · ⭐ · โน้ต · 👎 · Remix/แชร์ disabled "เร็ว ๆ นี้" (รอ S07/S13-14) — ผ่าน `withUserDb`
  ทั้งหมด **ไม่มี migration ใหม่** · รูป "ลุคตัวอย่าง (mock)" คือ placeholder ของ mock adapter ไม่ใช่บั๊ก
- ✅ `npm run test:db` ผ่านครบ 18 ข้อ · `npm run check` ผ่าน (typecheck + unit 42)
- ✅ AI adapter ทุกตัวเป็น **mock** (try-on/pose-check/item-processing) — ยังไม่เลือก provider จริง
- ❌ ยังไม่มี: S07 Remix · S13/S14 แชร์ · S10 · S15 · S16 · S17 PWA · deploy · Web Push · nav bar ถาวร

## กฎเหล็ก
1. ไม่มีทางที่คนอื่นเห็นรูปท่า (twin) · แอดมินไม่เห็นทั้งรูปท่าและรูปลุค — แชร์ได้แค่รูปลุคผ่านลิงก์เพิกถอนได้ (ADR-0003)
2. ทุกการลองผ่านโควต้ารายคน + เพดานรวม ก่อนเรียก AI — ผ่าน `start_try_on()` เท่านั้น (ADR-0002)
3. secret key ใช้ได้ที่ `server/utils/privileged` ที่เดียว — webhook/cron/push เท่านั้น (ADR-0005)
4. query ในนามผู้ใช้ผ่าน `withUserDb()` เท่านั้น — Drizzle owner ข้าม RLS (ADR-0006)

## งานถัดไป
1. S07 Remix เทียบคู่ — `outfitSchema`/`start_try_on()` รองรับ `remixOfLookId` แล้ว เหลือแค่หน้าจอ
2. S13/S14 แชร์ลุค (`server/api/share/` = ผู้เรียกที่ 4 ของโซนสิทธิ์พิเศษ)
3. S10 รายละเอียดชิ้น (ค้นย้อนลุคที่มีชิ้นนี้)
อื่น ๆ: เชิญเพื่อนเข้า repo · เลือก AI provider จริง → ADR · Web Push · nav bar 4 แท็บถาวร

## กับดักที่เคยเจอ
- repo **public** — commit ใช้อีเมล noreply ของ GitHub ห้ามเปลี่ยนกลับ ต้องมี local `git config user.email` ตั้งไว้เสมอ
- build: JSON เข้า SQL cast `::text::jsonb` เสมอ · pin `typescript@6` (v7 พังกับ vue-tsc) ·
  npm 11 บล็อก install script → รัน `npx nuxt prepare` เองหลัง `npm i` รอบแรก
- **`@nuxtjs/supabase` ไม่ exchangeCodeForSession ให้เอง** — เรียกเองที่ `/auth/confirm` · magic link
  เป็น PKCE ต้องขอ/กดเบราว์เซอร์เดียวกัน · admin.generateLink() ได้ implicit token ไม่ใช่ code ใช้ล็อกอิน
  แทนผู้ใช้ไม่ได้ (แอปปฏิเสธถูกต้อง — ไม่ใช่บั๊ก) · browser pane เข้า `supabase.co` ตรงไม่ได้
- **หน้าโหลดช้า ~4 วิ — แก้แล้ว ผู้ใช้ยืนยันเร็วขึ้นจริง** (2026-09-23) 2 สาเหตุ: (1) `await useFetch()`
  ต่อกันหลายบรรทัด = ยิงเรียงคิว แก้ด้วย `Promise.all(...)` ที่ `/`, `/looks/[id]`, `/builder` (2) **ตัวหลัก**:
  `openDb()` เปิด `postgres()` ใหม่ทุก request วัดได้ 600ms–2.3วิ/ครั้งไป Supabase pooler → เปลี่ยนเป็น
  pool ระดับ module ที่ `server/utils/db.ts` (ADR-0006 ส่วนแก้ไขเพิ่มเติม) — บทเรียน: query ธรรมดาไวมาก
  ตัวกิน latency จริงมักเป็นการเปิด connection/handshake ไม่ใช่ query เอง เช็กตรงนี้ก่อนถ้าเจอช้าอีก
- เปิด .drawio ใน draw.io แล้วบันทึก/export = จัด format ใหม่ทั้งไฟล์ (noise ไม่ใช่เนื้อหาเปลี่ยน)
- Postgres ทดสอบต้องสร้าง cluster ใหม่ทุกเซสชันตามสูตรใน HANDOFF (`brew install postgresql@16` ถาวรแล้ว)

---
📜 ประวัติเต็ม: `docs/WORKLOG.md` · 📐 กฎทั้งหมด: `CLAUDE.md` · 📖 คำศัพท์: `CONTEXT.md`
