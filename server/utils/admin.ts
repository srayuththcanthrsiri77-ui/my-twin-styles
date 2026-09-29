// S16 แอดมิน — ฟังก์ชัน SQL เช็ก role = 'admin' เองข้างใน (drizzle/0003_admin_functions.sql)
// แปล error 'forbidden' จาก assert_admin() เป็น HTTP 403 ให้ endpoint ต่าง ๆ ใช้ร่วมกัน
export function adminError(err: unknown) {
  const message = String((err as { cause?: Error })?.cause?.message ?? err)
  if (message.includes('forbidden')) return createError({ statusCode: 403, statusMessage: 'forbidden' })
  return err
}
