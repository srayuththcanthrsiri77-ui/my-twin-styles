# 🔥 HOTCACHE

> อ่านไฟล์นี้หลัง `HANDOFF.md` · **ห้ามเกิน 500 คำ** (`wc -w`)
> เขียนทับในที่เดิมทุกครั้งที่ทำงานเสร็จเป็นชิ้น — ไม่ใช่ต่อท้าย
> Updated: **2026-09-23**

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
  S08 ตู้เสื้อผ้า + S09 เพิ่มชิ้น · **S11 Outfit Builder + S12 เลือกชิ้น** (onboarding ①②③ ต่อกันครบแล้ว)
- ✅ **ลองชุดจบครบวงจรจริงครั้งแรกแล้ว** (2026-09-23): Builder → จองโควต้า → AI mock → webhook → บันทึกลุค
  เช็กตรงใน DB แล้วว่า try_on status `succeeded` + มีแถว `looks` จริง
- ✅ `npm run test:db` ผ่านครบ 18 ข้อบน Postgres จริง — ยืนยัน RLS ของ items แยกคนละ user จริง
- ✅ AI adapter ที่มีแล้ว (ทุกตัวเป็น **mock** จนกว่าจะเลือก provider จริง): try-on, pose-check,
  item-processing (ลบพื้นหลัง+เดาหมวด/สี — mock จำลองว่าลบพื้นหลังไม่สำเร็จเสมอ)
- ❌ ยังไม่มี: **S05/S06 Lookbook ตัวจริง** (**ทำต่อจากตรงนี้** — ตอนนี้ลองชุดสำเร็จแล้วแต่ไม่มีที่ดูผล
  นอกจาก query DB ตรง ๆ) · S07 Remix · S13/S14 แชร์ · S15 โปรไฟล์ · S16 แอดมิน · S17 PWA · deploy · Web Push

## กฎเหล็ก
1. ไม่มีทางใดที่คนอื่นเห็นรูปท่า (twin) · แอดมินไม่เห็นทั้งรูปท่าและรูปลุค — แชร์ได้แค่รูปลุคผ่านลิงก์เพิกถอนได้ (ADR-0003)
2. ทุกการลองผ่านโควต้ารายคน + เพดานรวม ก่อนเรียก AI — ผ่าน `start_try_on()` เท่านั้น (ADR-0002)
3. secret key ใช้ได้ที่ `server/utils/privileged` ที่เดียว — webhook/cron/push เท่านั้น (ADR-0005)
4. query ในนามผู้ใช้ผ่าน `withUserDb()` เท่านั้น — Drizzle owner ข้าม RLS (ADR-0006)

## งานถัดไป
ตามลำดับ flow onboarding (drawio หน้า 2): **S05 Lookbook ตัวจริง + S06 รายละเอียดลุค** — ต้องมีก่อนฉลอง
"ลุคแรก 🎉" ได้จริง (ตอนนี้ `index.vue` ยังเป็น placeholder ว่างเสมอ ไม่เช็ก `looks` จริง) แล้วค่อย S07 Remix,
S13/S14 แชร์ (`server/api/share/` = ผู้เรียกที่ 4 ของโซนสิทธิ์พิเศษ) · S10 รายละเอียดชิ้น
อื่น ๆ: เชิญเพื่อนเข้า repo (`gh api -X PUT repos/VoramethP/my-twin-styles/collaborators/<user> -f permission=admin`) ·
เลือก AI provider จริงก่อนเปิดใช้งาน → ADR · Web Push (VAPID) · nav bar 4 แท็บถาวร

## กับดักที่เคยเจอ
- repo **public** — commit ใช้อีเมล noreply ของ GitHub ห้ามเปลี่ยนกลับ ต้องมี local `git config user.email`
  ตั้งไว้เสมอ ไม่งั้น fallback ไปอีเมลเครื่อง (ย้ายเครื่อง/clone ใหม่ต้องตั้งซ้ำ)
- build tooling: JSON เข้า SQL cast `::text::jsonb` เสมอ (`::jsonb` ตรง ๆ encode ซ้ำ) · pin `typescript@6`
  (v7 พังกับ vue-tsc) · npm 11 บล็อก install script → รัน `npx nuxt prepare` เองหลัง `npm i` ครั้งแรก
- **`@nuxtjs/supabase` ไม่ exchangeCodeForSession ให้เอง** — ต้องเรียกเองที่หน้า callback (`/auth/confirm`)
  ไม่งั้นค้าง "กำลังเข้าสู่ระบบ…" ตลอดไป · **magic link เป็น PKCE ขอ/กดต้องเบราว์เซอร์เดียวกัน** (code_verifier
  อยู่ใน browser storage) · browser pane ของ Claude เข้า `supabase.co` ตรง ๆ ไม่ได้ (โดเมนนอกบล็อก)
- เปิด .drawio ใน draw.io แล้วบันทึก **หรือรัน `draw.io -x -f png ...` export** = จัด format ใหม่ทั้งไฟล์
  (attribute reorder + dx/dy) — เทียบว่า `value=` เปลี่ยนจริงไหมก่อนสรุปว่าเนื้อหาเปลี่ยน (มักไม่เปลี่ยน แค่ noise)
- เครื่องนี้ไม่มี Postgres มาก่อน — ติดตั้งแล้วด้วย `brew install postgresql@16` (ถาวร) แต่คลัสเตอร์ทดสอบ
  ต้องสร้างใหม่ทุกเซสชันตามสูตรใน HANDOFF (อยู่ scratchpad → หาย) · `export PATH=".../postgresql@16/bin:$PATH"` ก่อน

---
📜 ประวัติเต็ม: `docs/WORKLOG.md` · 📐 กฎทั้งหมด: `CLAUDE.md` · 📖 คำศัพท์: `CONTEXT.md`
