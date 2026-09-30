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
- ✅ ต่อ Supabase จริงแล้ว (14 ตาราง · 3 bucket private) · cron active ทุกนาที
- ✅ magic link ล็อกอินได้จริง — ตั้ง Gmail Custom SMTP แล้ว (`docs/SETUP.md` §1)
- ✅ หน้าจอทดสอบผ่าน `npm run dev` แล้ว: S01 login · S04 onboarding · S02/S03 ถ่ายท่า ·
  S08 ตู้เสื้อผ้า + S09 เพิ่มชิ้น · S11 Outfit Builder + S12 เลือกชิ้น
- ✅ **S05-07 (Lookbook/รายละเอียดลุค/Remix)** และ **S13/S14 แชร์ลุค** และ **S10 รายละเอียดชิ้น** — verify ผ่าน
  ล็อกอินจริงแล้วทั้งหมด
- ✅ **S15 โปรไฟล์+Twin เขียนเสร็จ — ยัง verify คลิกจริงไม่ได้ทั้งหน้า** โดยเฉพาะ "ลบข้อมูลทั้งหมด" ที่ไม่เคย
  รันจริงเลยเพราะลบถาวร (ห้าม Claude รันเอง)
- ✅ **S16 แอดมิน — verify คลิกจริงผ่านเบราว์เซอร์แล้ว (2026-09-30)**: `/admin` — สถิติภาพรวม/ตั้งเพดานรวม/
  ค้นหา+ปรับโควต้ารายคน/รายการ 👎 ล่าสุด (ไม่มีรูปเลย ADR-0003) ทุกฟังก์ชันเป็น SQL `SECURITY DEFINER` เช็ก
  `role='admin'` เองผ่าน `assert_admin()` (`drizzle/0003_admin_functions.sql`) **ไม่ได้ขยายโซนสิทธิ์พิเศษ**
  migrate ขึ้น production แล้ว · `tests/db/admin.test.ts` ผ่านครบ · ผู้ใช้ตั้ง `role='admin'` ให้บัญชี
  `srayuththcanthrsiri77@gmail.com` เองผ่าน SQL Editor แล้วเทสจริงเห็นข้อมูลถูกต้องทุกช่อง
- ✅ `npm run check` ผ่าน (unit 50) · `test:db` ผ่านครบ 39 ข้อ
- ✅ AI adapter ทุกตัวเป็น **mock** — ยังไม่เลือก provider จริง
- ❌ ยังไม่มี: S17 PWA · deploy · Web Push · nav bar ถาวร

## กฎเหล็ก
1. ไม่มีทางที่คนอื่นเห็นรูปท่า (twin) · แอดมินไม่เห็นทั้งรูปท่าและรูปลุค — แชร์ได้แค่รูปลุคผ่านลิงก์เพิกถอนได้ (ADR-0003)
2. ทุกการลองผ่านโควต้ารายคน + เพดานรวม ก่อนเรียก AI — ผ่าน `start_try_on()` เท่านั้น (ADR-0002)
3. secret key ใช้ได้ที่ `server/utils/privileged` ที่เดียว — webhook/cron/push/share/`/api/me/delete` เท่านั้น
   (ADR-0005 — 5 ผู้เรียกคงเดิม; S16 แอดมิน**ไม่ใช้**โซนนี้ ใช้ SQL function เช็ก role เองแทน)
4. query ในนามผู้ใช้ผ่าน `withUserDb()` เท่านั้น (ADR-0006)

## งานถัดไป
1. ผู้ใช้ทดสอบ "ลบ twin"/"ลบข้อมูลทั้งหมด" (S15) เอง — **ห้าม Claude รันแทนแม้ผู้ใช้จะขอให้ช่วยเทส**
2. S17 PWA
3. ⚠️ บัญชี `srayuththcanthrsiri77@gmail.com` ตั้ง `daily_quota=100` ชั่วคราว (ปกติ 5) — ถามก่อนปรับกลับ
4. ⚠️ IP เครื่อง dev เปลี่ยนบ่อย (ล่าสุด `172.20.10.2` ก่อนหน้า `192.168.1.150`) — `.env`'s
   `NUXT_PUBLIC_SITE_URL` ยังเป็นค่าเก่า ถ้า magic link มือถือพัง เช็ก log ตอนรัน dev (บรรทัด "Network:") แล้ว
   อัปเดตทั้ง `.env` และ Supabase Redirect URLs
อื่น ๆ: เชิญเพื่อน · เลือก AI provider จริง · Web Push · nav bar ถาวร

## กับดักที่เคยเจอ
- repo **public** — commit ใช้อีเมล noreply ของ GitHub ห้ามเปลี่ยนกลับ ต้องมี local `git config user.email` ตั้งไว้เสมอ
- build: JSON เข้า SQL cast `::text::jsonb` เสมอ · pin `typescript@6` · npm 11 บล็อก install script → รัน
  `npx nuxt prepare` เองหลัง `npm i` รอบแรก
- **PKCE → Claude ล็อกอินแทนผู้ใช้ไม่ได้เลย** — fallback: สคริปต์ node ชั่วคราวต่อ `NUXT_DATABASE_URL`/
  secret key ตรง ยิง business logic จริงในนามผู้ใช้แทน (ลบทิ้งทุกครั้ง) — **ยกเว้นการลบข้อมูลถาวร ห้ามใช้
  วิธีนี้ทดสอบเด็ดขาด**
- เครื่องนี้ไม่มี `curl` ติดตั้ง — smoke test HTTP ใช้ `node -e` กับ `fetch()` แทน
- เปิด .drawio ใน draw.io แล้วบันทึก/export = จัด format ใหม่ทั้งไฟล์ (noise ไม่ใช่เนื้อหาเปลี่ยน)
- Postgres ทดสอบต้องสร้าง cluster ใหม่ทุกเซสชันตามสูตรใน HANDOFF (`brew install postgresql@16` ถาวรแล้ว)
- ตู้เสื้อผ้าทดสอบมีชิ้นเสื้อที่รูปเป็นรูปคน — ยังไม่มีปุ่มลบชิ้น เลี่ยงไปก่อน
- **`useFetch('/api/x/${id}')` เดา type ไม่ได้ ถ้ามี route พี่น้อง literal ระดับเดียวกัน** (`/api/items/[id]`
  ชน `/api/items/process`) — แก้ด้วยใส่ generic `useFetch<T>(...)` เอง
- dev server ตายเงียบได้ (`ERR_CONNECTION_REFUSED` ทั้งที่เพิ่งใช้ได้) — เช็ก `lsof -i :3000` ก่อนสรุปว่าเป็น
  บั๊กโค้ด เปิดใหม่ด้วย `preview_start` ได้เลย

---
📜 ประวัติเต็ม: `docs/WORKLOG.md` · 📐 กฎทั้งหมด: `CLAUDE.md` · 📖 คำศัพท์: `CONTEXT.md`
