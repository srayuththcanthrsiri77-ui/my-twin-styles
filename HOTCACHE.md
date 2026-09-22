# 🔥 HOTCACHE

> อ่านไฟล์นี้หลัง `HANDOFF.md` · **ห้ามเกิน 500 คำ** (`wc -w`)
> เขียนทับในที่เดิมทุกครั้งที่ทำงานเสร็จเป็นชิ้น — ไม่ใช่ต่อท้าย
> Updated: **2026-09-22**

## โปรเจกต์นี้คืออะไร
Mobile-first PWA (UI ไทย) — ผู้ใช้สร้าง twin จากรูปเต็มตัว เอาชิ้นจากตู้เสื้อผ้า (มีแล้ว/อยากได้) มาจัดเป็นชุด
ให้ AI ลองบน twin ผลเป็นลุคใน lookbook ไว้ดูเป็น ref ตอนแต่งตัว หรือแชร์ถามเพื่อนผ่านลิงก์

## ตอนนี้อยู่ตรงไหน
- ผู้ใช้ทำโปรเจกต์นี้**ให้เพื่อน** — repo public: https://github.com/VoramethP/my-twin-styles (ยังไม่ได้เชิญเพื่อน)
- ✅ ออกแบบครบ: 25+ การตัดสินใจ · ADR-0001..0006 · drawio 9 หน้า
- ✅ **ต่อ Supabase จริงแล้ว** — migrate ผ่าน (14 ตาราง · 3 bucket private) · pg_cron/pg_net เปิด · cron
  `reconcile-try-ons` active ทุก 1 นาที · Vault ตั้ง `app_site_url`/`app_cron_secret` แล้ว
- ✅ **ล็อกอินจริงใช้ได้แล้ว** (magic link อย่างเดียว — ตัด Google OAuth ออกถาวร ซิงก์ README/ADR-0002/drawio แล้ว)
- ✅ หน้าจอที่ทดสอบจริงผ่าน `npm run dev` แล้ว: S01 login · S04 onboarding · S02/S03 ถ่ายท่า ·
  **S08 ตู้เสื้อผ้า + S09 เพิ่มชิ้น** (เพิ่มชิ้นได้ เห็นในตู้จริง — onboarding ② ชี้มาที่นี่แล้ว ·
  `npm run test:db` ผ่านครบ 18 ข้อบน Postgres จริงด้วย — ยืนยัน RLS ของ items แยกคนละ user จริง)
- ✅ AI adapter ที่มีแล้ว (ทุกตัวเป็น **mock** จนกว่าจะเลือก provider จริง): try-on, pose-check,
  item-processing (ลบพื้นหลัง+เดาหมวด/สี — mock จำลองว่าลบพื้นหลังไม่สำเร็จเสมอ)
- ❌ ยังไม่มี: S11 Outfit Builder/S12 (**ทำต่อจากตรงนี้**) · S05/S06 Lookbook ตัวจริง (ตอนนี้แค่ placeholder) ·
  S07 Remix · S13/S14 แชร์ · S15 โปรไฟล์ · S16 แอดมิน · S17 PWA prompt · deploy · Web Push

## กฎเหล็ก
1. ไม่มีทางใดที่คนอื่นเห็นรูปท่า (twin) · แอดมินไม่เห็นทั้งรูปท่าและรูปลุค — แชร์ได้แค่รูปลุคผ่านลิงก์เพิกถอนได้ (ADR-0003)
2. ทุกการลองผ่านโควต้ารายคน + เพดานรวม ก่อนเรียก AI — ผ่าน `start_try_on()` เท่านั้น (ADR-0002)
3. secret key ใช้ได้ที่ `server/utils/privileged` ที่เดียว — webhook/cron/push เท่านั้น (ADR-0005)
4. query ในนามผู้ใช้ผ่าน `withUserDb()` เท่านั้น — Drizzle owner ข้าม RLS (ADR-0006)

## งานถัดไป
ตามลำดับ flow onboarding (drawio หน้า 2): **S11 Outfit Builder + S12 เลือกชิ้นใส่ช่อง** —
onboarding ③ ต้องมีก่อน (Builder เติมชิ้นให้อัตโนมัติรอบแรก) ใช้ `POST /api/try-ons` ที่มีอยู่แล้ว
(`shared/outfit.ts` = กติกาช่อง) ตามด้วย S06 รายละเอียดลุค (ต้องมีก่อนฉลอง "ลุคแรก 🎉" ได้จริง)
แล้วค่อย S05 Lookbook ตัวจริง, S13/S14 แชร์ (`server/api/share/` = ผู้เรียกที่ 4 ของโซนสิทธิ์พิเศษ)
อื่น ๆ: เชิญเพื่อนเข้า repo (`gh api -X PUT repos/VoramethP/my-twin-styles/collaborators/<user> -f permission=admin`) ·
เลือก AI provider จริงก่อนเปิดใช้งาน → ADR · Web Push (VAPID)

## กับดักที่เคยเจอ
- repo **public** — commit ใช้อีเมล noreply ของ GitHub ห้ามเปลี่ยนกลับ · ต้องมี local `git config user.email`
  ตั้งไว้ (ตั้งแล้ว 2026-09-22) ไม่งั้น fallback ไปอีเมลเครื่อง — ย้ายเครื่อง/clone ใหม่ต้องตั้งซ้ำ
- ส่ง JSON เข้า SQL ให้ cast `::text::jsonb` — `::jsonb` ตรง ๆ postgres.js encode ซ้ำเป็น scalar
- TypeScript 7 ใช้กับ vue-tsc ไม่ได้ → pin `typescript@6`
- npm 11 บล็อก install script → หลัง `npm i` ครั้งแรกรัน `npx nuxt prepare` เอง (ต้องมี SUPABASE_URL/KEY แม้เป็นค่าปลอม)
- **`@nuxtjs/supabase` ไม่ exchangeCodeForSession ให้เอง** — ต้องเรียกเองที่หน้า callback (`/auth/confirm`)
  ไม่งั้นค้าง "กำลังเข้าสู่ระบบ…" ตลอดไปเพราะไม่เคยมี session เกิดขึ้นจริง
- เปิด .drawio ใน draw.io แล้วบันทึก **หรือรัน `draw.io -x -f png ...` export** = จัด format ใหม่ทั้งไฟล์
  (attribute reorder + dx/dy) — เทียบว่า `value=` เปลี่ยนจริงไหมก่อนสรุปว่าเนื้อหาเปลี่ยน (มักไม่เปลี่ยน แค่ noise)
- เครื่องนี้ไม่มี Postgres มาก่อน — ติดตั้งแล้วด้วย `brew install postgresql@16` (ถาวร ไม่ต้องลงซ้ำ)
  แต่ตัวคลัสเตอร์ทดสอบยังต้องสร้างใหม่ทุกเซสชันตามสูตรใน HANDOFF (อยู่ scratchpad → หายเมื่อจบเซสชัน) ·
  ใช้ `export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"` ก่อนเรียก initdb/pg_ctl

---
📜 ประวัติเต็ม: `docs/WORKLOG.md` · 📐 กฎทั้งหมด: `CLAUDE.md` · 📖 คำศัพท์: `CONTEXT.md`
