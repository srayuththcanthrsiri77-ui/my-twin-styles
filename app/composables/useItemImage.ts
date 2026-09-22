const MAX_LONG_SIDE = 1600 // ชิ้นเสื้อผ้าไม่ต้องละเอียดเท่ารูปท่า

// อ่านรูปที่ถ่าย/เลือก → ย่อเป็น JPEG ก่อนอัปโหลด (เหมือน usePoseImage แต่ไม่ต้องวัด metrics)
export async function prepareItemImage(file: File): Promise<{ blob: Blob, previewUrl: string }> {
  const bitmap = await createImageBitmap(file)
  const blob = await resizeBitmapToJpeg(bitmap, MAX_LONG_SIDE)
  bitmap.close()
  return { blob, previewUrl: URL.createObjectURL(blob) }
}
