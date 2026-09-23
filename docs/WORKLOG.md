# WORKLOG

ความจำระยะยาวของโปรเจกต์ — **ต่อท้ายอย่างเดียว ห้ามแก้ของเก่า**
รายการใหม่ไปต่อท้าย **ก่อน** หัวข้อ "งานถัดไป" เสมอ

---

## [2026-09-19] Grill แนวคิดโปรเจกต์ + kickoff + drawio ชุดแรก

**ทำอะไร:**
ซักไซ้แนวคิด 4 รอบ 25 ข้อ (ผู้ใช้ตอบ "ตามที่แนะนำ" เกือบทั้งหมด) · ตั้งระบบความจำ ·
เขียน CONTEXT.md + ADR-0001..0004 · สรุปหน้าจอ/MVP ใน `docs/design/README.md` ·
สร้าง `docs/design/my-twin-styles.drawio` 7 หน้าจาก generator ชั่วคราว (ไม่ commit generator)

**ทำไมถึงเลือกแบบนี้ (สรุปการตัดสินใจ):**
- แกน = AI try-on 2D บนรูปจริงหลายท่า + lookbook เก็บผล → ADR-0001
- ลองทั้งชุดตามช่อง; รองเท้า/accessory ไม่ render เพราะโมเดลปัจจุบันยังไม่เสถียร
- แหล่งชิ้น = ตู้ของตัวเอง + ของที่อยากได้; นำเข้าด้วยอัปโหลด ไม่ดึงจากลิงก์ร้าน (ร้านบล็อก scraping ดูแลยาก)
- ลองแบบ async เพราะใช้ 10–40 วิ และหลายคนสั่งพร้อมกัน
- ผู้ใช้เลือก **สมัครอิสระ** (ต่างจากที่ Claude เสนอ invite code) → ต้องมีเพดานรวม → ADR-0002
- ความเป็นส่วนตัว: twin ไม่เคยแชร์ แชร์ลุคด้วยลิงก์ → ADR-0003
- Mobile-first PWA · Web Push ต้องติดตั้ง PWA บน iOS → ADR-0004
- Navigation 4 แท็บ รวม Twin ไว้ในโปรไฟล์ เพราะตั้งค่าครั้งเดียว แก้นาน ๆ ครั้ง
- Onboarding 3 ขั้นข้ามได้ ให้ถึงลุคแรกเร็วที่สุด
- 👎 ไม่คืนโควต้า (กันใช้ลองฟรี) · ระบบล้มเหลวคืนโควต้า
- Wireframe low-fi ก่อน เพื่อ lock flow/layout ก่อนเรื่อง visual

**ทางเลือกที่ไม่ได้เลือก และเพราะอะไร:**
flat-lay mix & match (ไม่เห็นบนตัว) · avatar 3D (ยาก ไม่สมจริง) · ระบบเพื่อน (ใหญ่เกิน MVP) ·
native app (สองโค้ดเบส) · invite-only (ผู้ใช้อยากเปิดอิสระ)

**ผลที่ตามมา / สิ่งที่ต้องระวังต่อไป:**
- ยังไม่เลือกผู้ให้บริการ AI try-on — เกณฑ์: คุณภาพ ราคา/ครั้ง และนโยบายไม่เก็บรูป (ADR-0003)
- ค่าโควต้าเริ่มต้นที่คุยไว้: บัญชีใหม่ 5 ครั้ง/วัน (ปรับได้) — ตัวเลขจริงต้องอยู่ใน config
- หลังผู้ใช้แก้ .drawio ห้าม regenerate ทับ

---

## [2026-09-19] แอดมินไม่เห็นรูปลุค

**ทำอะไร:** เพิ่มข้อใน ADR-0003 + กฎเหล็กข้อ 1 · แก้โน้ตในหน้า Wireframes (S16) ด้วย string replace (ไฟล์ยังไม่ถูกผู้ใช้แก้)

**ทำไมถึงเลือกแบบนี้:** รูปลุคสร้างจากท่า จึงมีหน้าตาและรูปร่างของผู้ใช้ — เปิดให้แอดมินดูก็เท่ากับเปิดรูปท่าทางอ้อม

**ทางเลือกที่ไม่ได้เลือก และเพราะอะไร:** ให้แอดมินดูรูปลุคที่ถูก 👎 เพื่อตัดสินคุณภาพโมเดล — ได้ข้อมูลละเอียดกว่า แต่ขัดหลักความเป็นส่วนตัว

**ผลที่ตามมา / สิ่งที่ต้องระวังต่อไป:** วัดคุณภาพโมเดลได้จากเหตุผล 👎 และสถิติเท่านั้น · ถ้าอนาคตอยากดูรูป ต้องเป็นแบบผู้ใช้กดยินยอมส่งเองทีละลุค

---

## [2026-09-19] หน้า Architecture + Data model

**ทำอะไร:** แทรกหน้า "7 Architecture" และ "8 Data model" ก่อนหน้า raw ใน .drawio (string insert ไม่ regenerate) · อ่าน skill stack-setup เพื่อวางตามสแต็กมาตรฐาน

**ทำไมถึงเลือกแบบนี้:**
- Vercel sin1 + Supabase ap-southeast-1 ตาม FDR-0004 (compute อยู่กับ DB)
- Storage private ทั้งหมด เข้าถึงด้วย signed URL อายุสั้น — ส่งให้ AI ได้โดยไม่เปิด bucket (ADR-0003)
- โควต้าเป็นตาราง daily_usage/global_usage + function reserve_quota() ใน transaction เดียว (ADR-0002)
- งานเบื้องหลังใช้ async API ของ provider + webhook และ Vercel Cron เก็บงานค้าง (ยังเป็นข้อเสนอ)
- ไม่มีตาราง twin — ผู้ใช้หนึ่งคนมี twin เดียว = poses ของ user นั้น · ชุด = try_on_items + pose_id
- share_links เก็บ hash ของ token

**พบระหว่างทาง:** stack ห้าม service role แต่ webhook / cron / push ทำงานโดยไม่มี session ผู้ใช้
และต้องเขียนไฟล์ลุคลง storage ของผู้ใช้ → ทำเครื่องหมาย ❓ ในแผนภาพ รอผู้ใช้ตัดสิน (ADR-0005)

---

## [2026-09-19] ADR-0005 โซนสิทธิ์พิเศษ + กลไกงานเบื้องหลัง

**ทำอะไร:** ผู้ใช้เลือกตามที่แนะนำ (Q26-A, Q27-A) · เขียน ADR-0005 · เพิ่มกฎเหล็กข้อ 3 · แก้ป้าย ❓ 2 จุดในหน้า Architecture ด้วย string replace

**ทำไมถึงเลือกแบบนี้:** รักษา Web Push ตอนปิดแอป (Q18) โดยจำกัด secret key ไว้ในโมดูลเดียว 3 ผู้เรียก ·
webhook + cron ง่ายกว่าคิว + worker และพอสำหรับ MVP

**ทางเลือกที่ไม่ได้เลือก และเพราะอะไร:** ให้แอปถามสถานะเอง (ไม่มี push ตอนปิดแอป) · Supabase Queues + worker (ภาระดูแลเกิน MVP)

**ผลที่ตามมา / สิ่งที่ต้องระวังต่อไป:**
- webhook ต้อง idempotent และเอา user_id จากแถว try_ons เท่านั้น
- ไฟล์ .drawio ถูกเปิด/บันทึกใน draw.io ก่อนแก้ → diff ทั้งไฟล์ แต่เทียบราย cell แล้วเนื้อหาเท่าเดิม 0 cell ต่าง จึงแก้เฉพาะข้อความบนไฟล์ปัจจุบัน

---

## [2026-09-19] เลื่อนการเลือกผู้ให้บริการ AI · โปรเจกต์ทำให้เพื่อน

**ทำอะไร:** ตกลงว่าจะเลือก provider ภายหลัง · โปรเจกต์ทำให้เพื่อน เก็บ repo ไว้ที่ GitHub ของผู้ใช้ แล้วเพิ่มเพื่อนเป็น collaborator

**ทำไมถึงเลือกแบบนี้:** ADR-0001 กำหนดให้ห่อ provider ไว้หลัง adapter อยู่แล้ว จึงพัฒนาด้วย mock adapter
(คืนรูปตัวอย่างหลังหน่วงเวลา + ยิง webhook จำลอง) ได้ครบทุก flow โดยยังไม่ต้องมีบัญชี provider

**ผลที่ตามมา / สิ่งที่ต้องระวังต่อไป:**
- ต้องเลือกก่อนเปิดใช้จริง: การตรวจลายเซ็น webhook (ADR-0005) และค่าโควต้าเริ่มต้นขึ้นกับ provider
- บัญชีและบิลของ provider ควรเป็นของคนที่จ่ายเงิน (น่าจะเป็นเพื่อน) — key อยู่ใน env ของ Vercel ไม่อยู่ใน repo

---

## [2026-09-19] ขึ้น GitHub แบบ public

**ทำอะไร:** ตรวจตาม repo-hygiene (secret 0 · ไม่มีไฟล์ .env) · เปลี่ยนผู้เขียน commit ทั้งหมดเป็นอีเมล noreply ของ GitHub ก่อน push แรก + ล้าง object เก่า ·
สร้าง https://github.com/VoramethP/my-twin-styles (public) แล้ว push · ยังไม่เชิญเพื่อน (ผู้ใช้จะให้ username ทีหลัง สิทธิ์ admin)

**ทำไมถึงเลือกแบบนี้:** ผู้ใช้ต้องการ public เฉพาะสิ่งที่ public ได้ — ไฟล์ทั้งหมดเป็นเอกสารออกแบบ ไม่มีความลับ
แต่อีเมลส่วนตัวในข้อมูล commit จะเปิดเผยถาวรเมื่อขึ้น public จึงเปลี่ยนเป็น noreply (Q28-A)

**ผลที่ตามมา / สิ่งที่ต้องระวังต่อไป:** ห้าม commit `.env` หรือ key · ไฟล์ `.env.example` ต้องเป็น placeholder ที่เห็นชัดว่าปลอม ·
แนะนำผู้ใช้เปิด "Block command line pushes that expose my email" ใน GitHub Settings → Emails

---

## [2026-09-19] ตั้งสแต็ก + schema/RLS + mock adapter

**ทำอะไร:**
- scaffold Nuxt 4 (template minimal) ย้ายเข้า root ของ repo · ติดตั้งตามเวอร์ชันใน stack-setup + @supabase/supabase-js · typescript@6 · @types/node@22
- `server/db/schema.ts` 14 ตาราง RLS ครบ (33 policy) · migration 0001 เขียนมือ: start_try_on (จองโควต้ารายคน+เพดานรวม atomic),
  refund_quota, mark_try_on_submitted, admin_stats, trigger สร้าง profile / จำกัด 5 ท่า, column grant, storage bucket + policy
- try-on: adapter interface · mock (ยิง webhook ลงลายเซ็น HMAC, จำลองล้มเหลวได้, ห้ามใช้บน production) ·
  lifecycle (ส่งงาน, webhook idempotent, retry 1 ครั้ง, cron จับ timeout, คืนโควต้า) · API POST /api/try-ons · webhook · cron
- หน้า login (Google + magic link) + หน้าแรกชั่วคราว
- เทสต์: unit 17 (กติกาชุด, mock, guard โซนสิทธิ์พิเศษ, repo hygiene) · DB 18 บน Postgres 15 ในเครื่อง
  ที่จำลอง auth/storage ของ Supabase (`tests/db/supabase-stub.sql`) รันในฐานะ authenticated
- ADR-0006 · กฎเหล็กข้อ 4 · แก้หน้า ER: PK try_on_items = (try_on_id, slot, position) และเพิ่ม submitted_at

**ทำไมถึงเลือกแบบนี้:**
- try_on_items ใช้ position ใน PK แทน item_id — item_id ต้อง SET NULL ได้เมื่อลบชิ้น (ลุคเดิมยังอยู่) คอลัมน์ใน PK เป็น NULL ไม่ได้
- ผู้ใช้ update try_ons ตรงไม่ได้ จึงมี mark_try_on_submitted() ที่เช็กเจ้าของ + สถานะ
- route สั่งลองแยก 2 transaction: จองโควต้า commit ก่อนส่งงาน เพื่อให้ webhook ที่มาเร็วหาแถวเจอ · ส่งไม่ออกก็ปล่อยให้ cron ส่ง
- ส่งไม่ออกนับเป็นหนึ่งรอบ กัน cron วนส่งไม่รู้จบ
- signed URL ตอนสั่งลองสร้างด้วย client ของผู้ใช้ (storage RLS) — ไม่ต้องใช้สิทธิ์พิเศษ

**ทางเลือกที่ไม่ได้เลือก และเพราะอะไร:** ดู ADR-0006 (supabase-js แทน Drizzle / เช็กสิทธิ์ในโค้ดเอง)

**ผลที่ตามมา / สิ่งที่ต้องระวังต่อไป:**
- **Vercel Hobby รัน cron ได้วันละครั้ง** — ADR-0005 ต้องการทุก 1 นาที → ยังไม่ใส่ crons ใน vercel.json รอผู้ใช้เลือก
- หน้าแชร์ `/l/[token]` ต้องสร้าง signed URL ของรูปลุคโดยไม่มี session → ต้องตัดสินว่าเป็นผู้เรียกที่ 4 ของโซนสิทธิ์พิเศษหรือไม่
- ยังไม่เคยต่อ Supabase จริง — stub จำลองแค่ auth.uid(), storage.objects/buckets/foldername

---

## [2026-09-19] Q30 ตัวตั้งเวลา = pg_cron · Q31 หน้าแชร์เป็นผู้เรียกที่ 4

**ทำอะไร:** แก้ ADR-0005 + กฎเหล็กข้อ 3 · migration 0002 ตั้ง job `reconcile-try-ons` ด้วย pg_cron + pg_net
(ข้ามเองบนฐานที่ไม่มี extension) · `docs/SETUP.md` ขั้นตอนต่อ Supabase/Vault/Vercel · guard test อนุญาต `server/api/share/`

**ทำไมถึงเลือกแบบนี้:** Vercel Hobby รัน cron ได้วันละครั้ง · pg_cron ฟรีและ endpoint ตรวจ CRON_SECRET อยู่แล้ว ·
URL/secret อยู่ใน Vault เพราะ repo public · หน้าแชร์เซ็นเฉพาะรูปลุคที่ token ยังใช้ได้ เข้มกว่าเปิด storage policy

**ทางเลือกที่ไม่ได้เลือก:** Vercel Pro ($20/เดือน) · storage policy เปิดอ่านรูปที่แชร์ (รู้ path ก็เปิดได้)

---

## [2026-09-19] หน้าจอ onboarding: S04 · S02/S03 ถ่ายท่า

**ทำอะไร:**
- `shared/pose.ts` กติกาเช็กรูปท่า (Q21): บล็อกเมื่อด้านสั้น < 512px · เตือนเมื่อมืด + รวมผลจาก AI · เทสต์ 4 ข้อ
- `server/utils/pose-check/` adapter + mock (ข้อที่ต้องใช้ AI: เต็มตัว/หลายคน/พื้นหลัง/ชุดหลวม — ผ่านเสมอจนกว่าจะเลือก provider)
- `POST /api/poses` เช็ก → บันทึกเฉพาะเมื่อไม่มีบล็อก และถ้ามีคำเตือนต้อง acceptWarnings · `GET /api/me/progress`
- `server/utils/storage.ts` signer ในนามผู้ใช้ + ตรวจว่า path อยู่ในโฟลเดอร์ตัวเอง (try-ons ใช้ร่วม)
- หน้า `/onboarding` (S04) · `/twin/new` (S02 guide → อัปโหลด → S03 ผล → บันทึก) · หน้าแรกพาผู้ใช้ใหม่ไป onboarding
- ตรวจใน browser pane ที่ 375px: แสดงผลถูก ไม่มี console error (ยังไม่ได้ลองอัปโหลดจริงเพราะไม่มี Supabase)

**ทำไมถึงเลือกแบบนี้:**
- ใช้กล้องของระบบ (`<input capture>`) แทนกล้องสดที่ซ้อนกรอบตาม wireframe S02 — ได้รูปเต็มความละเอียด ใช้ได้ทุกเครื่อง
  จึงแสดงกรอบ guide ก่อนเปิดกล้องแทน
- ย่อรูปเป็น JPEG ด้านยาว ≤ 2048 ก่อนอัปโหลด — ใหญ่กว่านี้ไม่ช่วย AI
- ถ่ายใหม่ = ลบไฟล์เดิมทันที ไม่ให้รูปตัวผู้ใช้ค้างใน storage (ADR-0003)
- "ข้าม onboarding" จำไว้ใน localStorage — เป็นความสะดวกต่อเครื่อง ไม่ใช่ข้อมูลที่ต้องถาวร
- ขนาดรูปมาจากเบราว์เซอร์ (เชื่อได้ไม่เต็มที่) แต่โกงแล้วเสียเองคนเดียว — provider จริงจะเช็กซ้ำ

**ผลที่ตามมา / สิ่งที่ต้องระวังต่อไป:**
- ถ้าผู้ใช้ปิดหน้าตอนผลเป็น "บล็อก" ไฟล์จะค้างใน storage — ควรมี cron ล้างไฟล์ poses ที่ไม่มีแถวใน DB
- onboarding ② ③ เป็น "เร็ว ๆ นี้" จนกว่าจะทำหน้าตู้และ Builder

---

## [2026-09-19] Handoff จบเซสชันแรก

**ทำอะไร:** เขียน HANDOFF.md ครั้งแรก · งานถัดไปตามที่ผู้ใช้สั่ง: (1) ผู้ใช้ต่อ Supabase จริงตาม docs/SETUP.md แล้ว Claude migrate + ทดสอบจริง
(2) หน้าจอตู้เสื้อผ้า S08/S09 → เปิด onboarding ② → S11 Builder

**ทำไมถึงส่งไม้ตอนนี้:** ผู้ใช้ขอ · เซสชันยาว (ออกแบบ + ตั้งสแต็ก + หน้าจอแรก) และงานถัดไปเป็นเฟสใหม่

---

## [2026-09-22] Commit งานค้าง auth ที่ไม่ได้ปิดไว้จากเซสชันก่อน + ซิงก์เอกสาร

**ทำอะไร:**
- เปิดเซสชันใหม่พบว่ามี `.env` จริงแล้ว (ผู้ใช้ต่อ Supabase เสร็จ) และมีงานแก้ไขค้างอยู่ที่ยังไม่ commit จากรอบก่อน:
  ตัดปุ่ม Google OAuth ออกจากหน้า login, เพิ่มการจัดการ error ลิงก์หมดอายุที่ `/auth/confirm`,
  จำกัด `accept` ของ input รูปท่าเป็น jpeg/png/webp, ปรับถ้อยคำ CLAUDE.md — commit แยกเป็น 3 ก้อนตามหัวข้อ
- ถามผู้ใช้ว่าเลิกใช้ Google OAuth ถาวรหรือชั่วคราว → **ถาวร** → ตามไปแก้ `docs/design/README.md`,
  wireframe S01 ในหน้า Sitemap/Onboarding/Wireframes/Architecture ของ `.drawio`, และ ADR-0002 ให้ตรงกับโค้ด
  (แก้เฉพาะ cell ที่เกี่ยวข้อง ไม่ regenerate ทั้งไฟล์ · ตรวจด้วยการ export PNG หน้า Wireframes)
- **เจอ:** local git config ของ repo ไม่มี `user.email` ตั้งไว้ ทำให้ commit แรกหลุดไปใช้อีเมลเครื่อง
  (ไม่ใช่ noreply) — ตั้ง `git config --local user.email/user.name` เป็นค่า noreply ที่ใช้มาตลอด แล้ว amend commit แรกแก้ author

**ทำไมถึงเลือกแบบนี้:** งานค้างเช็คแล้วผ่าน `npm run check` และไม่มี error ต่อกัน จึง commit ได้เลยแทนที่จะ
ทิ้งไว้ต่อ · เอกสารออกแบบต้องตรงกับสิ่งที่ auth จริงรองรับ ไม่งั้นแชตหน้าจะอ่าน wireframe แล้วเข้าใจผิดว่ามี Google

**ผลที่ตามมา / สิ่งที่ต้องระวังต่อไป:**
- repo นี้ต้องมี local `git config user.email` ตั้งไว้เสมอ ห้ามปล่อยให้ fallback ไป global — เช็คด้วย
  `git config user.email` ก่อน commit ถ้าไม่ใช่ `...@users.noreply.github.com` ให้ตั้งก่อน
- ยังไม่ได้ตรวจว่า `npm run db:migrate` รันกับ Supabase จริงหรือยัง (มี `.env` แล้วแต่ยังไม่ได้ทดสอบ dev/login จริง)

---

## [2026-09-22] ต่อ Supabase จริงจบ + แก้บั๊กล็อกอินค้าง + สร้างตู้เสื้อผ้า S08/S09

**ทำอะไร:**
- เช็ก `.env` เจอ `NUXT_SUPABASE_SECRET_KEY` เป็นคีย์ผิด project (ref ไม่ตรงกับ `SUPABASE_URL`) แถม role เป็น
  `anon` ไม่ใช่ secret — ชี้ให้ผู้ใช้ไปหยิบจากบล็อก "API Keys" ใหม่ (`sb_secret_...`) ไม่ใช่ "Legacy JWT keys"
- รัน `npm run db:migrate` สำเร็จ (14 ตาราง, 3 bucket private, pg_cron+pg_net, cron `reconcile-try-ons` active) ·
  ตั้ง Vault (`app_site_url`, `app_cron_secret`) ให้ตามคำขอของผู้ใช้ — ปกติ `docs/SETUP.md` §2 ให้ผู้ใช้รันเอง
  ใน SQL Editor แต่ผู้ใช้ขอให้ทำแทนรอบนี้ (ยังไม่เปลี่ยนธรรมเนียมในเอกสาร)
- เปิด dev server ทดสอบจริง (`.claude/launch.json` ใหม่) — ผู้ใช้ลอง login เองแล้วค้างที่ "กำลังเข้าสู่ระบบ…"
  ตลอดไป **เจอ root cause จริง:** `@nuxtjs/supabase` (ใช้ `@supabase/ssr` cookie-based) ไม่ exchange
  `code` เป็น session ให้อัตโนมัติเหมือน client แบบเก่า ต้องเรียก `exchangeCodeForSession()` เองที่หน้า
  `/auth/confirm` — แก้แล้ว ผู้ใช้ reload หน้าเดิมแล้วเข้าได้จริง
- สร้าง **ตู้เสื้อผ้า S08 (รายการ + filter สถานะ/ช่อง) + S09 (เพิ่มชิ้น)** ตามแบบ pose ทั้งสาย:
  `shared/item.ts` (หมวด→ช่องตาม flow เพิ่มชิ้นหน้า 3 ของ .drawio, zod) · `server/utils/item-processing`
  adapter (ลบพื้นหลัง+เดาหมวด/สี — mock จำลองลบพื้นหลังไม่สำเร็จเสมอ) · `POST /api/items/process` (ประมวลผล
  ยังไม่บันทึก) · `POST /api/items` (บันทึก) · `GET /api/items` (list พร้อม signed URL) · หน้า `/wardrobe`,
  `/wardrobe/new` · ต่อ onboarding ② ให้ชี้มาที่นี่ · เพิ่ม `SLOT_LABEL` ใน `shared/outfit.ts`
- ก่อนเริ่มเขียนหน้าจอ ทวน flow ให้ผู้ใช้ฟังก่อน (ไล่ทั้ง 9 หน้าของ .drawio สรุปว่าอะไรทำแล้ว/ยัง) —
  ผู้ใช้ยืนยันลำดับ S08/S09 → S11 Builder ตาม onboarding flow
- ทดสอบจริงผ่าน browser pane ไม่ได้ (ไม่มี session · Claude in Chrome ต่อไม่ติด · ขอ magic link ใหม่โดน
  email rate limit) เลยให้ผู้ใช้ทดสอบเองในแท็บที่ล็อกอินค้างแทน — ระหว่างรอผล **ทวนโค้ดตัวเองซ้ำเจอบั๊กจริง**:
  ปุ่ม "เพิ่มชิ้นอีก" หลังบันทึกสำเร็จเผลอเรียก `retake()` (ฟังก์ชันเดียวกับปุ่ม "ถ่ายใหม่") ซึ่งลบรูปที่เพิ่ง
  บันทึกทิ้งจาก storage — แก้แยก `reset()`/`retake()` ให้ตรงกับ `twin/new.vue` ก่อนผู้ใช้ทดสอบ · ผู้ใช้ยืนยัน
  เพิ่มชิ้นได้จริง เห็นในตู้เสื้อผ้า
- เจอ `docs/design/my-twin-styles.drawio` ขึ้น modified หลังรัน `draw.io -x -f png` export (ไม่ใช่แค่เปิด+
  บันทึกในแอปที่ทำให้ format เปลี่ยน) — เทียบ diff แล้วไม่มี `value=` เปลี่ยนจริงสักตัว (แค่ attribute reorder
  + dx/dy) เลย `git checkout` ทิ้ง ไม่ commit noise

**ทำไมถึงเลือกแบบนี้:**
- exchangeCodeForSession ต้องแก้ที่โค้ดแอปเอง เพราะ module ไม่รองรับให้ — ตรวจสอบจาก `node_modules` โดยตรง
  (ไม่มี `exchangeCodeForSession` ปรากฏที่ไหนในซอร์สของ `@nuxtjs/supabase` เลย) ไม่ใช่การเดา
- item-processing แยก endpoint process/save เพราะ wireframe S09 ต้องการให้ผู้ใช้เห็นและแก้ค่าที่ AI เดาก่อน
  บันทึกจริง (ต่างจาก pose ที่ accept/retake อย่างเดียวไม่มีฟอร์มแก้)
- สถานะเริ่มต้น "มีแล้ว" แต่ auto-suggest "อยากได้" เมื่อใส่ลิงก์ร้าน (ไม่ force) เพราะเป็นกติกาที่ตกลงกันไว้ตั้งแต่
  รอบออกแบบ (HANDOFF เก่า) — ใช้ flag `statusTouched` กันไม่ให้ auto-suggest ทับค่าที่ผู้ใช้เลือกเองแล้ว

**ผลที่ตามมา / สิ่งที่ต้องระวังต่อไป:**
- `docs/SETUP.md` §2 ยังเขียนว่าให้ผู้ใช้รันเองใน SQL Editor ทั้งที่รอบนี้ Claude รันแทน — ถ้าจะให้เป็นธรรมเนียม
  ถาวรว่า Claude ทำได้ ต้องแก้เอกสารให้ตรง (ยังไม่ได้ถาม/แก้)
- S10 (รายละเอียดชิ้น) ยังไม่ทำ — ข้ามไปก่อนเพราะไม่ใช่ทางบังคับของ onboarding
- ยังไม่มี nav bar ถาวร (ลุค/ตู้/＋ลอง/โปรไฟล์ ตาม wireframe) — ทุกหน้าตอนนี้เป็น full-screen แยกกัน
  ต้องทำตอนมีหน้าครบ 4 แท็บจริงถึงจะคุ้ม
- Supabase ฟรี tier จำกัด email/ชั่วโมงเข้มมาก — ถ้าต้องทดสอบ login ซ้ำ ๆ ควรตั้ง custom SMTP หรือทดสอบผ่าน
  session ที่ล็อกอินค้างแทนขอ link ใหม่ทุกรอบ

---

## [2026-09-22] Optimize & verify ตู้เสื้อผ้าก่อนไปต่อ Builder

**ทำอะไร:**
- ทวนโค้ด S08/S09 หาจุดซ้ำ/ควรปรับ: พบ `usePoseImage.ts`/`useItemImage.ts` มีลอจิก resize รูปเป็น JPEG
  ซ้ำกันเกือบทั้งหมด → ดึงออกเป็น `resizeBitmapToJpeg()` ใน `app/utils/image.ts` ให้เรียกร่วม ·
  พบปุ่ม filter สถานะใน `/wardrobe` เขียนซ้ำ 3 บรรทัดทั้งที่ filter ช่องข้างล่าง loop อยู่แล้ว → เปลี่ยนให้
  loop จาก `STATUS_FILTERS` array เหมือนกัน
- ต้องการรัน `npm run test:db` (RLS จริงบน Postgres) เพื่อยืนยัน items table แต่เครื่องนี้ไม่เคยลง Postgres
  มาก่อน (คลัสเตอร์เดิมของเซสชันก่อนอยู่ scratchpad ที่หายไปแล้ว) — ผู้ใช้อนุญาตให้ติดตั้ง →
  `brew install postgresql@16` แล้วสร้างคลัสเตอร์ทดสอบตามสูตรเดิมใน HANDOFF (port 55432)
- รัน `npm run test:db` ผ่านครบ 18 ข้อ รวม RLS ของ `items` (แยกคนละ user เห็นกันไม่ได้ — ใช้ path เดียวกับ
  `seedWardrobe()` ใน `tests/db/helpers.ts` ที่ insert เข้า `poses`+`items` ตรง ๆ ผ่าน RLS)

**ทำไมถึงเลือกแบบนี้:**
- ก่อนต่อยอดด้วย Builder (ซึ่งจะ query items ผ่าน RLS หนักขึ้น) ควรมั่นใจว่าชั้นข้อมูลของตู้เสื้อผ้าถูกต้องจริง
  ไม่ใช่แค่ผ่าน unit test ที่ไม่แตะ Postgres จริง — RLS เป็นกฎเหล็กข้อ 4 (ADR-0006) จึงคุ้มที่จะติดตั้ง Postgres
  แค่เพื่อ verify แม้จะไม่มีอยู่ก่อนในเครื่องนี้

**ผลที่ตามมา / สิ่งที่ต้องระวังต่อไป:**
- `postgresql@16` ติดตั้งถาวรผ่าน brew แล้ว แต่ตัวคลัสเตอร์ทดสอบ (data dir ใน scratchpad) หายทุกจบเซสชัน
  ต้องสร้างใหม่ตามสูตรใน HANDOFF ทุกครั้ง (`export PATH=".../postgresql@16/bin:$PATH"` ก่อนด้วย)

---

## [2026-09-23] S11 Outfit Builder + S12 — ลองชุดจบครบวงจรจริงครั้งแรก

**ทำอะไร:**
- เพิ่ม endpoint ที่ยังไม่มี: `GET /api/poses` (list ท่า พร้อม signed URL ตามแบบ `items.get.ts`) ·
  `GET /api/me/quota` (โควต้าคงเหลือวันนี้จาก `profiles.daily_quota` - `daily_usage.used` วันปัจจุบัน
  เขตเวลา Asia/Bangkok — ตารางนี้มี RLS select_own อยู่แล้วเลย query ผ่าน `withUserDb` ได้ตรง ๆ)
- หน้า `/builder` (S11): เลือกท่า · เลือกชิ้นแต่ละช่อง (เสื้อ/ท่อนล่าง/ชั้นนอก/เดรส) ผ่าน `UDrawer` เป็น
  sheet เลื่อนขึ้นจากล่าง (S12) · ส่วนประกอบเลือกได้หลายชิ้นไม่เกิน `MAX_ACCESSORIES` ไม่ render ·
  ปุ่ม "ลองชุด" ปิดจนกว่า `outfitSchema.safeParse()` ผ่านและยังมีโควต้าเหลือ (`ปุ่มลองปิดจนชุดครบ` ตาม
  flow หน้า 4) · เรียก `POST /api/try-ons` ที่มีอยู่แล้วจากรอบตั้งสแต็กแรก ไม่ต้องแก้อะไรฝั่ง backend เลย
- รอบแรกเข้า Builder เติมชิ้นจากตู้ให้อัตโนมัติ (เสื้อ+ท่อนล่าง ถ้ามีครบคู่ ไม่งั้นลองหาเดรส) ตามที่ตกลงไว้ใน
  flow onboarding หน้า 2 ("Builder เติมชิ้นให้อัตโนมัติ")
- เชื่อม "+ เพิ่มชิ้นใหม่" ใน picker กับ `/wardrobe/new?from=builder&slot=X` — บันทึกชิ้นเสร็จพากลับมาใส่
  ในช่องที่กำลังเลือกอยู่ทันที ไม่ผ่านจอ "บันทึกแล้ว" ปกติ (ตาม flow เพิ่มชิ้นหน้า 3: "มาจาก Builder? ใช่ →
  ใส่ชิ้นในช่องที่กำลังเลือกอยู่") ใช้ `item.slot` จริงจาก response ไม่ใช่ query param เดิม เผื่อผู้ใช้เปลี่ยน
  หมวดในฟอร์มจนช่องเปลี่ยนไป
- ทดสอบจริงผ่านแท็บ Chrome ที่ผู้ใช้ล็อกอินค้าง: เลือกท่า+ชิ้น → sheet ทำงานปกติ → กดลองชุด → เช็กตรงใน
  Postgres จริงพบว่า `try_ons.status = succeeded` และมีแถวใน `looks` แล้ว — mock adapter หน่วง 3 วิ
  แล้วยิง webhook กลับมาที่ `localhost:3000/api/webhooks/try-on` สำเร็จทั้งกระบวนการ (จองโควต้า → ส่ง AI →
  webhook → บันทึกลุค) นี่คือครั้งแรกที่ pipeline try-on ทั้งระบบทำงานจบจริงตั้งแต่ตั้งสแต็กมา
- ระหว่างพยายาม verify เอง เจอว่า browser pane ในตัว Claude เข้า `supabase.co` โดยตรงไม่ได้ (โดเมนนอกถูก
  บล็อก) และลองเอา magic link ที่ขอจาก pane ไปกดในเบราว์เซอร์ของผู้ใช้แทน — ได้ error "ลิงก์หมดอายุ" เพราะ
  PKCE code_verifier อยู่คนละเบราว์เซอร์กัน (เป็น error state ที่เขียนไว้ตั้งแต่แก้บั๊ก login ทำงานถูกต้อง)
  สรุปคือถ้าจะ verify เต็ม flow ต้องขอ+กดลิงก์ในเบราว์เซอร์เดียวกันเท่านั้น

**ทำไมถึงเลือกแบบนี้:**
- ใช้ `UDrawer` (Nuxt UI, ตัวเดียวกับที่ build บน vaul-vue) แทนการทำหน้าแยกสำหรับ S12 เพราะ wireframe
  ระบุชัดว่าเป็น "sheet บน S11" ไม่ใช่หน้าใหม่ — คุมด้วย `open` prop เป็น computedget/set ผูกกับ
  `pickerSlot` (null = ปิด) แทนการเก็บ boolean แยก ลดจำนวน state ที่ต้อง sync กัน
- ไม่ทำ special-case แยกสำหรับ "มาจาก onboarding" ตอน auto-fill — ใช้ logic เดียว (มีชิ้นในตู้ก็เติมให้
  เสมอ) เพราะลดความซับซ้อนและยังตอบโจทย์ onboarding ได้เหมือนเดิม

**ผลที่ตามมา / สิ่งที่ต้องระวังต่อไป:**
- ตอนนี้ลองชุดสำเร็จได้จริงแล้ว แต่**ไม่มีที่ให้ผู้ใช้เห็นผลลัพธ์เลย** นอกจาก query DB ตรง ๆ — S05/S06
  ต้องทำต่อทันทีเป็นลำดับถัดไป ไม่งั้นฟีเจอร์นี้ใช้งานจริงไม่ได้ทั้งที่ backend ทำงานสมบูรณ์แล้ว
- ยังไม่ทำ nav bar 4 แท็บถาวร — ทุกหน้ายังเป็น full-screen แยกกันหมด (`/builder` เข้าได้แค่ผ่าน
  onboarding ③ หรือพิมพ์ URL เอง)

---

## [2026-09-23] S05 Lookbook + S06 รายละเอียดลุค

**ทำอะไร:**
- API ใหม่ทั้งหมดผ่าน `withUserDb` ไม่มี migration ใหม่ (ตาราง/RLS/column grant มีอยู่แล้วจาก data model):
  `GET /api/looks` (การลองที่ค้างอยู่ queued/running + ลุคที่สำเร็จเรียงใหม่สุดก่อน พร้อม occasionIds ต่อลุค),
  `GET/POST /api/occasions` (ระบบ `user_id null` + ของผู้ใช้เอง), `GET /api/looks/[id]` (รายละเอียด: รูป ·
  ชิ้นที่ใช้ทุกช่องรวม accessory ที่แนบดูคู่ · โอกาส · dislike reason), `PATCH /api/looks/[id]`
  (แก้ได้แค่ is_favorite/note ตาม column grant), `PUT /api/looks/[id]/occasions` (แทนที่ทั้งชุด),
  `POST /api/looks/[id]/dislike` (upsert ผ่าน onConflictDoUpdate — กดซ้ำ = แก้เหตุผล)
- `shared/look.ts`: `DISLIKE_REASONS`/`DISLIKE_REASON_LABEL` + zod schema ของทั้ง 4 endpoint ที่รับ body
- หน้า `/` เขียนใหม่เป็น S05 จริง (เดิมเป็น placeholder ว่างเสมอ): skeleton โหลด · empty state ·
  การ์ดการลองที่ค้างอยู่ด้านบน · filter โอกาส (chip) + ⭐ · grid 2 คอลัมน์ลิงก์ไปหน้า S06
- หน้าใหม่ `/looks/[id]` (S06): รูปลุค + ปุ่ม ⭐ ทับมุมขวาบน · แถบชิ้นที่ใช้ (แสดง "ชิ้นถูกลบแล้ว" ถ้า
  item_id เป็น null จาก FK set null) · chip โอกาสกดสลับได้ทันที + ช่องตั้งเอง · โน้ตแก้แล้วต้องกดบันทึกเอง
  (กันยิง API ทุกตัวอักษร) · ปุ่ม Remix/แชร์ปิดไว้ "เร็ว ๆ นี้" (ui-decision ใช้ `UBadge`/`disabled` แบบ
  onboarding.vue) · 👎 เปิด `UDrawer` เลือกเหตุผล
- unit test `tests/look.test.ts` ครอบ schema ทั้งหมดใน `shared/look.ts`

**ทำไมถึงเลือกแบบนี้:**
- ไม่ทำ endpoint ลบลุค — wireframe S06 ไม่มีปุ่มลบ (มีแค่ Remix/👎/แชร์) จึงไม่ทำเผื่อ ลดความซับซ้อนเรื่อง
  ลบไฟล์จริงใน bucket `looks` (กฎเหล็กข้อ 1) ไว้ตอนทำ S15 "ลบ twin/ข้อมูลทั้งหมด" ทีเดียว
- Remix/แชร์ยังเป็นปุ่ม disabled ไม่ใช่ของจริงบางส่วน — แม้ `outfitSchema`/`start_try_on()` รองรับ
  `remixOfLookId` อยู่แล้ว แต่ S07 ต้องมีหน้าจอเทียบคู่ลุคต้นทาง-ลุคใหม่ตาม wireframe ซึ่งเป็นงานแยก
  ทำครึ่ง ๆ กลางทางแล้วปล่อยไว้จะสับสนกว่าไม่ทำเลย
- โอกาส (occasion) กดที่ chip แล้วอัปเดตทันทีผ่าน `PUT .../occasions` (ไม่ต้องกด "บันทึก" แยก) เพราะ
  เป็นการสลับเปิด/ปิดไม่กี่ตัว ต่างจากโน้ตที่เป็นข้อความยาวควรกดยืนยันเอง

**ผลที่ตามมา / สิ่งที่ต้องระวังต่อไป:**
- ยัง verify ผ่านเบราว์เซอร์แบบล็อกอินจริงไม่ได้ในเซสชันนี้ — โปรเจกต์ต่อ Supabase จริงแล้วและ magic link
  ต้องกดในเบราว์เซอร์เดียวกับที่ขอ (browser pane เข้า `supabase.co` ตรงไม่ได้ตามที่เจอไว้ตอนทำ Builder)
  ตรวจแค่ `npm run check` ผ่าน (typecheck + unit 42) และยิง curl ตรงไปที่ route ใหม่ทั้งหมดยืนยันว่า
  register ถูกต้องและตกไปที่ `requireUser` (401) โดยไม่ error กลางทาง — ผู้ใช้ควรลองจริงผ่าน `npm run dev`
  อีกที · ระหว่าง verify เจอว่ามีอีก session รัน `npm run dev` ค้างอยู่ที่ port 3000 อยู่แล้ว จึงเพิ่ม config
  ชั่วคราวใน `.claude/launch.json` ให้รันที่ 3001 แทน (`npm run dev -- --port 3001`) แล้วเอาออกหลัง verify
  เสร็จ — ไม่กระทบ session เดิม
- `look_occasions` insert ไม่เช็กว่า `occasionId` เป็นของระบบหรือของผู้ใช้เองจริง (พึ่ง RLS ของ
  `look_occasions` ที่เช็กแค่ความเป็นเจ้าของ "ลุค" ไม่เช็กความเป็นเจ้าของ "โอกาส") — ผลกระทบต่ำเพราะ
  ผู้ใช้ต้องรู้ uuid ของโอกาสคนอื่นก่อนถึงจะลองอ้างได้ และผลคือแค่แท็กลุคตัวเองด้วยโอกาสที่มองไม่เห็นชื่อ
- nav bar 4 แท็บถาวรยังไม่ทำ — จาก `/looks/[id]` กลับ `/` ด้วยปุ่มลูกศรเท่านั้น

---

## [2026-09-23] ผู้ใช้ verify S05/S06 จริงผ่าน `npm run dev` แล้ว

**ทำอะไร:**
ผู้ใช้ทดสอบเองในเบราว์เซอร์จริง (ล็อกอินค้างอยู่แล้ว) — ส่ง screenshot ของ `/` และ `/looks/[id]` มายืนยัน:
filter โอกาส/⭐ ใน Lookbook แสดงถูกต้อง · การ์ดลุคคลิกเข้ารายละเอียดได้ · หน้ารายละเอียดโชว์รูปลุค ·
ชิ้นที่ใช้ (เสื้อ+ท่อนล่าง) · chip โอกาสครบ 4 ค่าเริ่มต้น + ช่องตั้งเอง · โน้ต · ปุ่ม Remix/แชร์ disabled
พร้อมข้อความ "เร็ว ๆ นี้" · ปุ่ม 👎 ไม่ถูกใจ — ครบตามที่ตั้งใจทำทุกจุด ไม่มีจุดไหนพัง

**ทำไมถึงเลือกแบบนี้:**
รูปที่เห็นในการ์ด/รายละเอียดเป็นข้อความ "ลุคตัวอย่าง (mock)" เพราะ mock try-on adapter คืน
`placeholderImageUrl` คงที่เสมอ (`server/utils/try-on/mock.ts`) ไม่ใช่บั๊กของหน้า Lookbook — เป็นแบบนี้
จนกว่าจะเลือก AI provider จริง

**ผลที่ตามมา / สิ่งที่ต้องระวังต่อไป:**
S05/S06 ปิดงานได้จริง ไม่ต้องกลับมาแก้เพิ่มเว้นแต่เจอบั๊กใหม่ — ไปต่อ S07 Remix ตามคิวใน HOTCACHE ได้เลย

---

## [2026-09-23] แก้บั๊กหน้าโหลดช้า — `await useFetch()` ต่อกันหลายบรรทัดยิงเรียงคิว

**ทำอะไร:**
ผู้ใช้แจ้งว่ากดเข้า `/looks/[id]` แล้วโหลดช้า — พบว่าโค้ดเขียน `const a = await useFetch(x); const b =
await useFetch(y)` ต่อกันหลายบรรทัด ซึ่ง JS จะรอ `x` เสร็จก่อนถึงจะเริ่มยิง `y` (ไม่ใช่พร้อมกันอย่างที่ตั้งใจ)
รวมกับแต่ละ API เปิด Postgres connection ใหม่ทุกครั้ง (`openDb()`) + เซ็น signed URL รูปเป็น HTTPS call
แยกไปที่ Supabase Storage ทำให้ latency สะสมต่อคำขอค่อนข้างมาก พอมี 2-3 คำขอต่อแถวจึงรู้สึกช้าเห็นได้ชัด
แก้เป็น `Promise.all([useFetch(x), useFetch(y)])` (แพทเทิร์นที่ Nuxt แนะนำเอง) ที่ `/` (S05, 3 คำขอ),
`/looks/[id]` (S06, 2 คำขอ) และเจอบั๊กเดียวกันที่ `/builder` (S11, 3 คำขอ) เลยแก้พร้อมกัน

**ทำไมถึงเลือกแบบนี้:**
`useFetch()` เริ่มยิงคำขอทันทีตอนถูกเรียก (ไม่ต้องรอ `await`) — สิ่งที่ทำให้ช้าคือบรรทัดถัดไปไม่ถูกเรียก
จนกว่า `await` ก่อนหน้าจะ resolve ต่างหาก การรวมเป็น `Promise.all` จึงแก้ตรงจุดโดยไม่ต้องแตะ logic อื่น
ในหน้าเลย และไม่ต้องแก้ฝั่ง API/DB connection ซึ่งเป็นสถาปัตยกรรมเดิมที่มีเหตุผลอยู่แล้ว (stack-setup:
ห้ามสร้าง client ระดับ module)

**ผลที่ตามมา / สิ่งที่ต้องระวังต่อไป:**
- `onboarding.vue` และ `wardrobe/index.vue` มี `useFetch` แค่ตัวเดียวต่อหน้า ไม่มีบั๊กนี้
- หน้าใหม่ที่ fetch มากกว่า 1 endpoint ต้องเขียนเป็น `Promise.all` ตั้งแต่แรก ไม่ใช่ `await` เรียงบรรทัด
- ถ้าผู้ใช้ยังรู้สึกช้าหลังแก้นี้ ปัญหาน่าจะอยู่ที่ per-request DB connection/signed URL ของสถาปัตยกรรมเอง
  (ต้องคุยเรื่อง connection pooling หรือลด signed URL call ต่อหน้า ซึ่งเป็นการเปลี่ยนสถาปัตยกรรม ไม่ใช่ bug fix เล็ก ๆ)

---

## [2026-09-23] แก้ตัวการหลักของหน้าโหลดช้า — เปลี่ยน DB connection เป็น pool ระดับ process

**ทำอะไร:**
ผู้ใช้บอกว่ายังช้าอยู่ ~4 วิ แม้แก้ `useFetch` เรียงคิวไปแล้ว — เข้าถึงล็อกอินจริงของผู้ใช้ไม่ได้ (magic link
ต้องกดในเบราว์เซอร์เดียวกับที่ขอ) เลยเขียนสคริปต์ node เล็ก ๆ ต่อ `NUXT_DATABASE_URL`/`SUPABASE_URL` จริง
ตรงจากเครื่อง dev วัดเวลา "เปิด connection ใหม่ + query แรก" 3 รอบ ได้ 636ms / 729ms / **2253ms** และ
วัด raw network RTT ไป Supabase Auth ได้ 1456ms / 1122ms / 92ms (รอบหลังเร็วเพราะ TLS session resume) —
สรุปว่า `openDb()` เปิด `postgres(url, {max:1})` ใหม่ทุก request (ตาม ADR-0006 เดิม) คือสาเหตุหลัก ไม่ใช่
`useFetch` เรียงคิวอย่างเดียว
เปลี่ยน `server/utils/db.ts` ให้เก็บ `postgres()` client (`max: 10`) ไว้ที่ module scope สร้างครั้งแรกที่
ต้องใช้แล้ว reuse ตลอดอายุ process แทน · เจอบั๊กเดียวกัน (await sign() ทีละ property) ซ้ำใน
`server/api/looks/[id].get.ts` เลยแก้ไปด้วย (เซ็นรูปลุค+ชิ้นพร้อมกัน) · ปรับ `server/api/webhooks/try-on.post.ts`
กับ `server/api/cron/try-ons.get.ts` ที่เคยเรียก `close()` เองให้ตรงกับ signature ใหม่ (ไม่ต้อง close อีกต่อไป
เพราะ pool อยู่ยาวทั้ง process) · เพิ่มส่วน "แก้ไขเพิ่มเติม" ใน ADR-0006 อธิบายเหตุผลทั้งหมด แทนที่จะแก้เนื้อหา
เดิมทับ (ADR ไม่ใช่ append-only แบบ WORKLOG แต่ก็ไม่ควรลบประวัติการตัดสินใจเดิมทิ้ง)

**ทำไมถึงเลือกแบบนี้:**
- `set local role`/`set_config` ที่ใช้ตั้ง RLS claims อยู่ในขอบเขต transaction เดียวเท่านั้น ปลอดภัยที่จะ
  reuse pool ข้าม request เพราะแต่ละ transaction ยืม connection คนละตัวจาก pool เสมอ ไม่มีทางเห็นค่ากัน
- รูปแบบนี้ (shared pool + `sql.begin()`/`db.transaction()` ต่อ request) ถูกใช้อยู่แล้วใน
  `tests/db/helpers.ts` (`asUser`/`asAnon`) มาตั้งแต่ตั้งสแต็ก และเทส RLS ผ่านมาตลอด — ยืนยันว่า pattern
  นี้ถูกต้อง ไม่ใช่ของใหม่ที่ไม่เคยพิสูจน์
- ไม่แก้เป็น `getDb(workspaceId)` หรือ pool ขนาดใหญ่ผิดปกติ — แอปนี้ฐานเดียว ผู้ใช้น้อย `max: 10` ต่อ
  process เพียงพอและไม่เสี่ยงชนเพดาน connection ของ Supabase

**ผลที่ตามมา / สิ่งที่ต้องระวังต่อไป:**
- ยืนยัน `npm run check` ผ่าน (typecheck + unit 42) และ `npm run test:db` ผ่านครบ 18 ข้อบน Postgres จริง
  (สร้าง cluster ทดสอบที่ port 55433 แยกจาก session อื่นที่ใช้ port 55432 ค้างอยู่พอดี)
- **ยังไม่ได้ยืนยันจากผู้ใช้จริงว่าหลังแก้นี้เร็วขึ้นแค่ไหน** — รอ feedback รอบถัดไป
- เหลือ timing log ชั่วคราว (`console.log('[timing] ...')` มาร์ก `TODO(perf-debug)`) ใน
  `server/utils/auth.ts` (auth.getUser) และ `server/utils/storage.ts` (createSignedUrl) ไว้เผื่อยังช้าอยู่
  ต้องดูว่าเวลาไปกองที่ auth หรือ signing แทน — ถ้าผู้ใช้ยืนยันว่าเร็วพอแล้วให้ลบ log พวกนี้ทิ้ง
- ถ้า deploy ขึ้น Vercel จริงต้องคิดเรื่องจำนวน connection รวมตอนมีหลาย serverless instance พร้อมกัน
  (`max: 10` ต่อ instance) — ตอนนี้ยังเป็นแอปให้เพื่อนใช้ ขนาดเล็ก ไม่รีบ

---

## [2026-09-23] ตั้ง Gmail SMTP + ยืนยัน connection pool fix ผ่านจริง + เจอ ERR_CONNECTION_REFUSED ปลอมเป็นบั๊ก

**ทำอะไร:**
ก่อนจะยืนยัน fix เรื่องหน้าโหลดช้าได้ ผู้ใช้เจอด่านแรก: ทดสอบ magic link ติดกันหลายรอบจนชน
"email rate limit exceeded" ของ Supabase built-in mailer — ไกด์ผู้ใช้ตั้ง Gmail Custom SMTP ทีละขั้น
(เปิด 2-Step Verification → สร้าง App Password → กรอกใน Supabase Authentication → Emails → SMTP
provider settings) จนสำเร็จ ("Successfully updated settings")

ระหว่างนั้นผู้ใช้ขอให้ "ลองรันทีครับ" — พยายามล็อกอินเองแทนผู้ใช้ด้วย `supabase.auth.admin.generateLink()`
(ใช้ secret key เขียนสคริปต์ชั่วคราว ลบทิ้งหลังใช้) เพื่อเลี่ยงข้อจำกัดที่กดอีเมลจริงไม่ได้ — ได้ action_link
มาแต่พอตามไปจนสุด (curl ตาม redirect) กลับเป็น token แบบ implicit (`#access_token=...`) ไม่ใช่ `?code=...`
แบบ PKCE ที่ `/auth/confirm` ต้องการ (ดู `app/pages/auth/confirm.vue`) — หน้าเว็บเลยค้าง "กำลังเข้าสู่ระบบ…"
ตลอดไปเพราะไม่มี `code` ให้แลก สรุปว่าวิธีนี้ใช้ไม่ได้จริง เพราะ `generateLink()` เป็นการสร้างฝั่ง admin
ไม่มี `code_verifier` จับคู่ (สร้างได้เฉพาะตอน client เรียก `signInWithOtp()` เอง) — เป็นพฤติกรรมที่ถูกต้อง
ของ PKCE ไม่ใช่บั๊ก แต่แปลว่า Claude ล็อกอินแทนผู้ใช้ผ่าน route นี้ไม่ได้จริง ๆ (ต้องมีอีเมลเท่านั้น)

ผู้ใช้เลยกลับไปลองด้วยอีเมลจริงในเบราว์เซอร์ตัวเอง (SMTP ทำงานแล้ว) ได้ `?code=...` ที่ถูกต้อง — แต่กด
แล้วเจอ `ERR_CONNECTION_REFUSED` เพราะจังหวะเดียวกันพอดี Claude เพิ่งสั่ง `preview_stop` ปิด dev server
ของตัวเองไปหลังจบการทดลอง `generateLink()` (คิดว่าทดสอบเสร็จแล้ว) — เข้าใจผิดว่าเป็นบั๊กแป๊บหนึ่ง ก่อนจะ
รู้ว่าเป็นเพราะไม่มี server ฟังอยู่ที่ port 3000 เลย ไม่เกี่ยวกับโค้ด แก้โดยเปิด dev server ใหม่แล้วให้ผู้ใช้
กด "โหลดใหม่" หน้าเดิม (โค้ดใน URL ยังไม่หมดอายุ) ก็ผ่านได้ปกติ
สุดท้ายผู้ใช้ยืนยันว่า **Lookbook เร็วขึ้นจริง** — ลบ timing log ชั่วคราวออกจาก `auth.ts`/`storage.ts` แล้ว

**ทำไมถึงเลือกแบบนี้:**
- ไม่ลองไล่ reverse-engineer วิธี inject session แบบ implicit เข้า cookie ของ `@nuxtjs/supabase` เอง
  (เช่นเขียน `sb-<ref>-auth-token` cookie ตรง ๆ) เพราะเสี่ยงเดารูปแบบผิดและเสียเวลาไม่คุ้ม ในเมื่อทางที่
  ถูกต้องจริง (ผู้ใช้กดลิงก์จากอีเมลเอง) ใช้เวลาไม่กี่นาทีเมื่อ SMTP พร้อมแล้ว
- บอกผู้ใช้ตรง ๆ ว่า generateLink ใช้ไม่ได้และทำไม แทนที่จะปิดเงียบแล้วลองวิธีอื่นต่อไปเรื่อย ๆ — ป้องกัน
  ผู้ใช้เข้าใจผิดว่าโค้ด auth มีปัญหา ทั้งที่จริงคือพฤติกรรม PKCE ที่ถูกต้องแล้ว

**ผลที่ตามมา / สิ่งที่ต้องระวังต่อไป:**
- **บทเรียนสำคัญ**: ถ้าสั่ง `preview_stop` ปิด dev server ของตัวเองระหว่างเซสชัน ต้องเช็กก่อนว่าผู้ใช้ไม่ได้
  กำลังจะทดสอบอะไรที่ต้องพึ่ง server นั้นอยู่ในจังหวะเดียวกัน — ปิดเร็วเกินไปทำให้ผู้ใช้เข้าใจผิดว่าเป็นบั๊ก
- `docs/SETUP.md` §1 มีขั้นตอนตั้ง Gmail SMTP ครบแล้ว ใช้อ้างอิงได้เลยถ้าต้อง setup environment ใหม่
- ไม่มี test อัตโนมัติสำหรับ auth flow เต็มรูปแบบ (ต้องมีอีเมลจริงเสมอ) — ยังต้องพึ่งผู้ใช้ทดสอบมือทุกครั้ง
  ที่แตะโค้ด auth/login

---

## งานถัดไป
ดู `HOTCACHE.md`
