# 🔥 HOTCACHE

> อ่านไฟล์นี้หลัง `HANDOFF.md` · **ห้ามเกิน 500 คำ** (`wc -w`)
> เขียนทับในที่เดิมทุกครั้งที่ทำงานเสร็จเป็นชิ้น — ไม่ใช่ต่อท้าย
> Updated: **2026-09-29**

## โปรเจกต์นี้คืออะไร
Mobile-first PWA (UI ไทย) — ผู้ใช้สร้าง twin จากรูปเต็มตัว เอาชิ้นจากตู้เสื้อผ้า (มีแล้ว/อยากได้) มาจัดเป็นชุด
ให้ AI ลองบน twin ผลเป็นลุคใน lookbook ไว้ดูเป็น ref ตอนแต่งตัว หรือแชร์ถามเพื่อนผ่านลิงก์

## ตอนนี้อยู่ตรงไหน
- ทำให้เพื่อน — github.com/VoramethP/my-twin-styles (ยังไม่เชิญ)
- ✅ ออกแบบครบ: 25+ การตัดสินใจ · ADR-0001..0006 · drawio 9 หน้า
- ✅ ต่อ Supabase จริงแล้ว (14 ตาราง · 3 bucket private) · cron active ทุกนาที
- ✅ magic link ล็อกอินได้จริง — ตั้ง Gmail Custom SMTP แล้ว (แก้ "email rate limit exceeded" ของ Supabase
  mailer ในตัว) ดู `docs/SETUP.md` §1
- ✅ หน้าจอทดสอบผ่าน `npm run dev` แล้ว: S01 login · S04 onboarding · S02/S03 ถ่ายท่า ·
  S08 ตู้เสื้อผ้า + S09 เพิ่มชิ้น · S11 Outfit Builder + S12 เลือกชิ้น (onboarding ①②③ ต่อกันครบ)
- ✅ **S05-07 (Lookbook/รายละเอียดลุค/Remix) — verify ผ่านล็อกอินจริงแล้ว** ทำงานถูกทุกจุด
- ✅ **S13/S14 แชร์ลุคเขียนเสร็จ** (2026-09-29 — verify จริงผ่าน `/l/[token]` ด้วยลิงก์ทดสอบใน DB production
  แต่**ปุ่ม "แชร์" ฝั่ง S06 ยัง verify คลิกจริงไม่ได้**): `/api/share/[token]` = ผู้เรียกที่ 4 ของโซนสิทธิ์พิเศษ
  (ADR-0005) เก็บแค่ token hash โชว์ดิบครั้งเดียวตอนสร้าง (ADR-0007)
- ✅ **S10 รายละเอียดชิ้นเขียนเสร็จ** (2026-09-29 — ยัง verify คลิกจริงไม่ได้เหมือนกัน): กดชิ้นในตู้ →
  `/wardrobe/[id]` โชว์รูป/ลิงก์ร้าน/ปุ่ม "ลองชิ้นนี้"/รายการลุคที่เคยใช้ชิ้นนี้
- ✅ ทุกฟีเจอร์ข้างบนไม่มี migration ใหม่ · `npm run test:db` ผ่านครบ 29 ข้อ · `npm run check` ผ่าน (unit 50)
- ✅ AI adapter ทุกตัวเป็น **mock** — ยังไม่เลือก provider จริง
- ❌ ยังไม่มี: S15 · S16 · S17 PWA · deploy · Web Push · nav bar ถาวร

## กฎเหล็ก
1. ไม่มีทางที่คนอื่นเห็นรูปท่า (twin) · แอดมินไม่เห็นทั้งรูปท่าและรูปลุค — แชร์ได้แค่รูปลุคผ่านลิงก์เพิกถอนได้ (ADR-0003)
2. ทุกการลองผ่านโควต้ารายคน + เพดานรวม ก่อนเรียก AI — ผ่าน `start_try_on()` เท่านั้น (ADR-0002)
3. secret key ใช้ได้ที่ `server/utils/privileged` ที่เดียว — webhook/cron/push/share เท่านั้น (ADR-0005)
4. query ในนามผู้ใช้ผ่าน `withUserDb()` เท่านั้น — Drizzle owner ข้าม RLS (ADR-0006)

## งานถัดไป
1. ผู้ใช้ทดสอบ S13/S14 (แชร์) และ S10 (รายละเอียดชิ้น) จริงผ่านคลิกเอง
2. S15 โปรไฟล์+Twin หรือ S16 แอดมิน — ถามก่อนว่าอยากทำอันไหน
3. ⚠️ บัญชีทดสอบ (uid `097a63f0-...`) ตั้ง `profiles.daily_quota = 100` ชั่วคราว (ปกติ 5) ผู้ใช้ขอ "เก็บไว้
   ก่อน" — ถามก่อนปรับกลับ/ก่อน deploy จริง
4. ⚠️ `.env` `NUXT_PUBLIC_SITE_URL` ถูกเปลี่ยนเป็น `http://192.168.1.150:3000` (เดิม `localhost:3000`)
   เพื่อเทสมือถือในวงแลน — IP อาจเปลี่ยนถ้าต่อ WiFi ใหม่ ถ้า magic link มือถือพังอีกเช็ก `ipconfig getifaddr
   en0` แล้วอัปเดตทั้ง `.env` และ Supabase Redirect URLs
อื่น ๆ: เชิญเพื่อน · เลือก AI provider จริง → ADR · Web Push · nav bar 4 แท็บถาวร

## กับดักที่เคยเจอ
- repo **public** — commit ใช้อีเมล noreply ของ GitHub ห้ามเปลี่ยนกลับ ต้องมี local `git config user.email` ตั้งไว้เสมอ
- build: JSON เข้า SQL cast `::text::jsonb` เสมอ · pin `typescript@6` (v7 พังกับ vue-tsc) ·
  npm 11 บล็อก install script → รัน `npx nuxt prepare` เองหลัง `npm i` รอบแรก
- **PKCE → Claude ล็อกอินแทนผู้ใช้ไม่ได้เลย** — fallback ที่ได้ผล: สคริปต์ node ชั่วคราวต่อ
  `NUXT_DATABASE_URL`/secret key ตรง ยิง business logic จริงในนามผู้ใช้แทน (ลบสคริปต์ทิ้งทุกครั้ง)
- **หน้าโหลดช้าเคยเจอ ~4 วิ — แก้แล้ว** (ADR-0006 ส่วนแก้ไขเพิ่มเติม): `openDb()` เปิด `postgres()` ใหม่ทุก
  request (600ms–2.3วิ/ครั้ง) ไม่ใช่ query เอง — เปลี่ยนเป็น pool แล้ว
- เปิด .drawio ใน draw.io แล้วบันทึก/export = จัด format ใหม่ทั้งไฟล์ (noise ไม่ใช่เนื้อหาเปลี่ยน)
- Postgres ทดสอบต้องสร้าง cluster ใหม่ทุกเซสชันตามสูตรใน HANDOFF (`brew install postgresql@16` ถาวรแล้ว)
- ตู้เสื้อผ้าทดสอบมีชิ้นเสื้อที่รูปเป็นรูปคน (อัปโหลดผิดตอนทดสอบ) — ยังไม่มีปุ่มลบชิ้น เลี่ยงไปก่อน
- **`useFetch('/api/x/${id}')` เดา type ไม่ได้ (ได้ `{}`) ถ้ามี route พี่น้อง literal ระดับเดียวกัน** เช่น
  `/api/items/[id]` ชนกับ `/api/items/process` — แก้ด้วยใส่ generic `useFetch<T>(...)` เอง

---
📜 ประวัติเต็ม: `docs/WORKLOG.md` · 📐 กฎทั้งหมด: `CLAUDE.md` · 📖 คำศัพท์: `CONTEXT.md`
