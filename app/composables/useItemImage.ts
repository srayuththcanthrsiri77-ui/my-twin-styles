const MAX_LONG_SIDE = 1600 // ชิ้นเสื้อผ้าไม่ต้องละเอียดเท่ารูปท่า

// อ่านรูปที่ถ่าย/เลือก → ย่อเป็น JPEG ก่อนอัปโหลด (เหมือน usePoseImage แต่ไม่ต้องวัด metrics)
export async function prepareItemImage(file: File): Promise<{ blob: Blob, previewUrl: string }> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_LONG_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('แปลงรูปไม่สำเร็จ'))), 'image/jpeg', 0.9))
  return { blob, previewUrl: URL.createObjectURL(blob) }
}
