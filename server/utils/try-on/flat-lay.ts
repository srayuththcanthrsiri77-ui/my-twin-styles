import type { RenderSlot } from '#shared/outfit'

export interface FlatLayImage {
  slot: RenderSlot
  type: string
  data: Uint8Array
}

const WIDTH = 600
const HEIGHT = 900
const PAD = 14 // ระยะขอบในการ์ด กันรูปชนมุมโค้ง

interface Box { x: number, y: number, w: number, h: number }

// ตำแหน่งการ์ดแต่ละช่องบนผืน 600×900 — ชั้นนอกอยู่ซ้ายคู่กับเสื้อ/เดรส ท่อนล่างอยู่ใต้เสื้อ
// แยกไม่ให้ทับกัน เพราะรูปชิ้นยังมีพื้นหลังติดมา ซ้อนกันแล้วจะดูรก
function layout(slots: Set<RenderSlot>): Partial<Record<RenderSlot, Box>> {
  const hasOuter = slots.has('outer')
  if (slots.has('dress')) {
    return hasOuter
      ? { outer: { x: 24, y: 40, w: 264, h: 480 }, dress: { x: 300, y: 40, w: 276, h: 820 } }
      : { dress: { x: 90, y: 40, w: 420, h: 820 } }
  }
  return hasOuter
    ? { outer: { x: 24, y: 40, w: 270, h: 420 }, top: { x: 306, y: 40, w: 270, h: 420 }, bottom: { x: 130, y: 480, w: 340, h: 380 } }
    : { top: { x: 100, y: 40, w: 400, h: 400 }, bottom: { x: 130, y: 460, w: 340, h: 400 } }
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// ภาพรวมชิ้นแบบวางราบ (flat-lay) — ผลลัพธ์ของ mock แทนรูปใส่บนตัวจริงจาก AI
// ใช้ SVG ฝังรูปเป็น data URI เพราะไม่ต้องพึ่ง library ประมวลผลภาพแบบ native ตอน deploy
// ห้ามรับรูปท่าเข้ามา — ลุคแชร์ผ่านลิงก์ได้ แต่รูปท่าห้ามออกนอกเจ้าของ (ADR-0003)
export function composeFlatLay(images: FlatLayImage[]): string {
  const boxes = layout(new Set(images.map(i => i.slot)))
  const cards = images.flatMap((img, i) => {
    const b = boxes[img.slot]
    if (!b) return []
    const type = ALLOWED_TYPES.includes(img.type) ? img.type : 'image/jpeg'
    const href = `data:${type};base64,${Buffer.from(img.data).toString('base64')}`
    return [
      `<clipPath id="c${i}"><rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="20"/></clipPath>`,
      `<rect x="${b.x}" y="${b.y + 4}" width="${b.w}" height="${b.h}" rx="20" fill="#000" opacity=".06"/>`,
      `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="20" fill="#fff"/>`,
      `<image clip-path="url(#c${i})" x="${b.x + PAD}" y="${b.y + PAD}" width="${b.w - 2 * PAD}" height="${b.h - 2 * PAD}" preserveAspectRatio="xMidYMid meet" href="${href}"/>`,
    ]
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">`
    + `<rect width="${WIDTH}" height="${HEIGHT}" fill="#f3efe9"/>${cards.join('')}</svg>`
}

export function flatLayDataUrl(images: FlatLayImage[]) {
  // encodeURIComponent แทน base64 ซ้อนชั้น — ข้อมูลข้างในเป็น base64 อยู่แล้ว เข้ารหัสซ้ำจะบวมอีก 1 ใน 3
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(composeFlatLay(images))}`
}
