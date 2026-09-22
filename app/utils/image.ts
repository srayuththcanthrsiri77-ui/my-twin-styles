// ย่อรูปลง canvas แล้วส่งออกเป็น JPEG — ใช้ร่วมกันระหว่าง usePoseImage และ useItemImage
export async function resizeBitmapToJpeg(bitmap: ImageBitmap, maxLongSide: number, quality = 0.9): Promise<Blob> {
  const scale = Math.min(1, maxLongSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('แปลงรูปไม่สำเร็จ'))), 'image/jpeg', quality))
}
