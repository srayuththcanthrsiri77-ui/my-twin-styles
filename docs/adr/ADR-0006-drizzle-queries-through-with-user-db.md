# ADR-0006 — query ในนามผู้ใช้ต้องผ่าน withUserDb() · ฐานเดียว ไม่มี workspace

**สถานะ:** ✅ Accepted · 2026-09-19 · แก้ไขเพิ่มเติม 2026-09-23 (ดูท้ายไฟล์)

## บริบท

สแต็กมาตรฐานใช้ Drizzle ต่อ Postgres ตรง ซึ่ง connection เป็น role เจ้าของตาราง — **ข้าม RLS ทั้งหมด**
RLS ที่เขียนไว้ใน schema จึงไม่มีผลเลย ถ้า route ของผู้ใช้ query ด้วย connection นั้นตรง ๆ

อีกเรื่อง: สแต็กกำหนด `getDb(workspaceId)` เพื่อรองรับฐานต่อ workspace ของ platform
แต่แอปนี้เป็นแอปเดียว ผู้ใช้ทุกคนอยู่ฐานเดียว ไม่มีแนวคิด workspace

## ทางเลือกที่พิจารณา

| ทางเลือก | ข้อดี | ข้อเสีย |
|---|---|---|
| ใช้ supabase-js (PostgREST) ในนามผู้ใช้แทน Drizzle | RLS ทำงานเอง | ออกนอกสแต็ก · เสีย type/query builder ของ Drizzle |
| Drizzle ตรง แล้วเช็กสิทธิ์ในโค้ดเอง | ง่าย | RLS กลายเป็นของประดับ ลืมเช็กจุดเดียว = ข้อมูลรั่ว |
| **Drizzle ใน transaction ที่ `set local role authenticated` + ตั้ง `request.jwt.claims`** ✔︎ | RLS ทำงานจริง · ใช้ Drizzle ได้ครบ | ทุก request เปิด transaction · ลืมใช้ helper = ข้าม RLS |

## การตัดสินใจ

- route ที่มี session ผู้ใช้ query ผ่าน `withUserDb(event, fn)` ใน `server/utils/db.ts` เท่านั้น
  (ตรวจ `getUser()` → เปิด transaction → set claims + role → เรียก fn)
- connection ที่ข้าม RLS (`openDb` ตรง ๆ) ใช้ได้เฉพาะในโซนสิทธิ์พิเศษผ่าน `openPrivilegedDb` (ADR-0005)
- ไม่ใช้ `getDb(workspaceId)` — ฐานเดียว เปิด connection ต่อ request ด้วย `openDb(event)` (ไม่มี db ระดับ module)

## ผลที่ตามมา

- DB test ต้องรันในฐานะ `authenticated` (`tests/db/helpers.ts › asUser`) — owner ข้าม RLS จะเทสต์ไม่ได้อะไร
- ส่งค่า JSON เข้า SQL ให้ cast `::text::jsonb` — cast `::jsonb` ตรง ๆ driver จะ encode ซ้ำจนเป็น scalar (เจอใน DB test)

## ทบทวนเมื่อไหร่

เมื่อแอปต้องรองรับหลายองค์กร/ฐาน หรือเมื่อ Drizzle มีวิธีผูก RLS กับ request ที่เป็นทางการ

## แก้ไขเพิ่มเติม [2026-09-23] — เปลี่ยนจาก "เปิด connection ใหม่ทุก request" เป็น pool ระดับ module

**สาเหตุ:** ผู้ใช้เจอว่าหน้า Lookbook/รายละเอียดลุคโหลดช้า (~4 วิ) วัดจริงจากเครื่อง dev ไป Supabase pooler
พบว่า `postgres(url, { max: 1 })` ใหม่ทุก request (ตามที่ ADR นี้กำหนดไว้เดิมว่า "ไม่มี db ระดับ module")
ใช้เวลาจับมือ TLS ครั้งละ **600ms–2.3 วินาที** — เป็นต้นทุนที่จ่ายซ้ำทุก request แม้ query จริงจะไวมาก

**การเปลี่ยนแปลง:** `server/utils/db.ts` เก็บ `postgres()` client (`max: 10`) ไว้ที่ module scope สร้างครั้งแรก
ที่ต้องใช้จริงแล้ว cache ไว้ตลอดอายุ process แทนที่จะเปิด/ปิดทุก request — `withUserDb()`/`openPrivilegedDb()`
ยังทำงานเหมือนเดิมทุกจุด (`db.transaction()` + `set local role`/`set_config` ต่อ request) เพียงแต่ query จริง
ยืมและคืน connection จาก pool แทนที่จะเปิดใหม่ทั้งหมด

**ทำไมถึงปลอดภัย:** `set local` มีผลแค่ในขอบเขต transaction เดียว หมดอายุอัตโนมัติตอน commit/rollback —
คนละ request ที่รันพร้อมกันจะได้ connection คนละตัวจาก pool เสมอ (ไม่มีทางเห็นค่า role/claims ของกันและกัน)
รูปแบบนี้ใช้อยู่แล้วใน `tests/db/helpers.ts` (`asUser`/`asAnon` ผ่าน `sql.begin()` บน pool เดียวที่แชร์ทั้งไฟล์
เทส) และเทส RLS ผ่านมาตลอดตั้งแต่ตั้งสแต็ก — ยืนยันว่ารูปแบบ shared pool + transaction-scoped role ถูกต้อง

**ข้อควรระวัง:** `max: 10` ต่อ process — ถ้า deploy บน serverless ที่ scale เป็นหลาย instance พร้อมกันจำนวนมาก
ต้องกลับมาคุมเพดานรวม (Supabase pooler รองรับ connection จำนวนมากอยู่แล้วเพราะออกแบบมาสำหรับเคสนี้
แต่ก็ยังมีเพดานสูงสุดของมันเอง) — ตอนนี้ยังเป็นแอปให้เพื่อนใช้ ขนาดเล็ก ไม่น่าเจอปัญหานี้เร็ว ๆ นี้
