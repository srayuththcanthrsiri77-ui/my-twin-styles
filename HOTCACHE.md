# 🔥 HOTCACHE

> อ่านไฟล์นี้หลัง `HANDOFF.md` · **ห้ามเกิน 500 คำ** (`wc -w`)
> เขียนทับในที่เดิมทุกครั้งที่ทำงานเสร็จเป็นชิ้น — ไม่ใช่ต่อท้าย
> Updated: **2026-10-09**

## โปรเจกต์นี้คืออะไร
Mobile-first PWA (UI ไทย) — ผู้ใช้สร้าง twin จากรูปเต็มตัว เอาชิ้นจากตู้เสื้อผ้า (มีแล้ว/อยากได้) มาจัดเป็นชุด
ให้ AI ลองบน twin ผลเป็นลุคใน lookbook ไว้ดูเป็น ref ตอนแต่งตัว หรือแชร์ถามเพื่อนผ่านลิงก์
**บริบทสำคัญ: เป็นงานส่งอาจารย์ตรวจ (ไม่ใช่ของขาย) deadline จันทร์ 12 ต.ค. 2026 — ให้ scope เล็กไว้ก่อน**

## ตอนนี้อยู่ตรงไหน
- ✅ **`prod` merge กับ `main` แล้วครั้งแรก (2026-10-09)**: production (`my-twin-styles.vercel.app`) เคยค้างที่
  commit แรกสุดตอน deploy มาตลอด (nav bar/PWA/ADR-0008 ไม่เคยขึ้นจริงเลย) — ตัดสินใจ merge ทันทีเพราะ
  deadline กระชั้น ไม่รอ AI provider แล้ว **ลบการ์ดกัน `mock` บน production ออกแล้ว**
  (`server/utils/try-on/index.ts`) เพราะไม่มีแผนขายจริง
- ✅ **ล็อกอินเปลี่ยนจาก magic link → กรอกรหัส OTP แล้ว verify จริงบนมือถือสำเร็จ**: magic link พังซ้ำบนมือถือ
  จริงเพราะอีเมล/บริการสแกนลิงก์เปิด URL ล่วงหน้าก่อนผู้ใช้กด (token ใช้ครั้งเดียวโดนใช้ไปก่อน) — แก้ถาวรด้วย
  กรอกรหัส 8 หลักจากอีเมลแทนกดลิงก์ (`app/pages/login.vue` + ต้องเพิ่ม `{{ .Token }}` ใน Supabase email
  template เอง) อีกจุดที่แก้คือต้อง `.trim()` รหัสก่อนส่ง (copy จากอีเมลติดช่องว่างมาด้วยได้)
- ⏳ **S17 PWA ติดตั้งจริงบน Android/iOS**: ล็อกอินผ่านแล้ว ยังไม่ได้ลองกด "ติดตั้งแอป"/Add to Home Screen จริง
- ✅ S01–S16 ครบ verify จริงแล้วทุกหน้า · S17 PWA+Push verify จริงแล้วบน desktop Chrome
- ⏸️ AI provider จริง (fal.ai) เขียนเสร็จแต่พักไว้ (ADR-0008) — ไม่มีเจ้าไหนฟรีจริง ใช้ `mock` ต่อ (ตอนนี้
  `mock` รันบน production ได้แล้วหลังลบการ์ดออก)

## กฎเหล็ก
1. ไม่มีทางที่คนอื่นเห็นรูปท่า (twin) · แอดมินไม่เห็นทั้งรูปท่าและรูปลุค (ADR-0003)
2. ทุกการลองผ่านโควต้ารายคน + เพดานรวม ก่อนเรียก AI (ADR-0002)
3. secret key ใช้ได้ที่ `server/utils/privileged` ที่เดียว (ADR-0005)
4. query ในนามผู้ใช้ผ่าน `withUserDb()` เท่านั้น (ADR-0006)

## งานถัดไป
1. ทดสอบติดตั้ง PWA จริงบน Android/iOS (ล็อกอินผ่านแล้ว เหลือแค่กดติดตั้ง)
2. **ทุกครั้งที่แก้โค้ดใหม่ ต้องให้ผู้ใช้รันเองใน terminal** (Claude Code บล็อก push `prod` อัตโนมัติ):
   `git checkout prod && git merge main --ff-only && git push origin prod && git checkout main`
   (แล้ว `git push origin main` ให้ origin/main sync ด้วย)
3. "ลบข้อมูลทั้งหมด" (ลบบัญชีถาวร) ยังไม่เคยทดสอบ — **ห้าม Claude รันแทนแม้ผู้ใช้จะขอให้ช่วยเทส**
4. ⚠️ บัญชี `srayuththcanthrsiri77@gmail.com` ตั้ง `daily_quota=100` ชั่วคราว (ปกติ 5) — ถามก่อนปรับกลับ
อื่น ๆ: เชิญ VoramethP · ถ้าวันหลังจะเปิดให้คนทั่วไปใช้จริง พิจารณาใส่การ์ดกัน mock บน production กลับ

## กับดักที่เคยเจอ
- repo **public** — commit ใช้อีเมล noreply ของ GitHub ห้ามเปลี่ยนกลับ · JSON เข้า SQL cast `::text::jsonb`
  เสมอ · pin `typescript@6` · npm 11 บล็อก install script → รัน `npx nuxt prepare` เองหลัง `npm i` รอบแรก
- เครื่องนี้ไม่มี `curl` — ใช้ `node -e`+`fetch()` แทน · เช็คหน้าที่ render ฝั่ง client เท่านั้น (เช่นหลัง submit
  form) **เช็คผ่าน fetch SSR ไม่เจอแน่นอน** เพราะ SSR ส่งแค่ state เริ่มต้น ต้องเช็คข้อความที่ render ตอน SSR
  จริงแทน (เช่นข้อความปุ่ม ไม่ใช่ข้อความที่โผล่หลัง interaction)
- **Vercel: Production Branch ต้องมีจริง · deploy แรกขึ้น Production เสมอและค้างอยู่ที่ commit นั้นตลอดจนกว่า
  จะ push ของจริงเข้า branch ที่ผูกไว้** (ไม่ auto-sync กับ `main` เอง) · GitHub App ติดตั้งได้แค่บน repo ที่
  เป็นเจ้าของเอง
- **Claude Code บล็อก `git push origin prod` อัตโนมัติทุกครั้ง** (classifier เห็นเป็น "Production Deploy")
  ต้องให้ผู้ใช้รันเองใน terminal เสมอ ไม่มีทางเลี่ยง
- **Supabase magic link พังบนมือถือจริงจาก link-prescanning** (อีเมล/บริการสแกนความปลอดภัยเปิด URL ก่อนผู้ใช้
  กด) ใช้ `verifyOtp` กรอกรหัสแทนกดลิงก์แก้ได้ถาวร · ต้อง `.trim()` รหัสก่อน verify เสมอ (copy จากอีเมลติด
  ช่องว่างได้ง่าย) · token ของโปรเจกต์นี้เป็น 8 หลัก ไม่ใช่ 6
- `app.vue` ต้องมี `<NuxtLayout>` ครอบ `<NuxtPage>` ไม่งั้น `definePageMeta({ layout })` เงียบๆ ไม่มีผลเลย

---
📜 ประวัติเต็ม: `docs/WORKLOG.md` · 📐 กฎทั้งหมด: `CLAUDE.md` · 📖 คำศัพท์: `CONTEXT.md`
