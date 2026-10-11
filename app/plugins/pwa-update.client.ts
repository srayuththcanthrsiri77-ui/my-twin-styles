// S17: registerType 'autoUpdate' อัปเดต service worker เบื้องหลังเงียบๆ แต่หน้าที่เปิดอยู่
// (โดยเฉพาะ PWA ที่ติดตั้งแล้ว ไม่มีปุ่มรีเฟรช) จะยังรันโค้ดเก่าค้างอยู่จนกว่าจะปิดแอปแล้วเปิดใหม่
// — เคยทำให้ผู้ใช้ไม่เห็นฟีเจอร์ใหม่ (ปุ่มลบลุค) ทั้งที่ deploy สำเร็จแล้ว จึงต้องเตือนให้กดรีเฟรชเอง
export default defineNuxtPlugin((nuxtApp) => {
  const toast = useToast()
  let notified = false

  nuxtApp.hook('app:mounted', () => {
    watch(
      () => nuxtApp.$pwa?.needRefresh,
      (needRefresh) => {
        if (!needRefresh || notified) return
        notified = true
        toast.add({
          title: 'มีเวอร์ชันใหม่ของแอป',
          description: 'กดเพื่อโหลดเวอร์ชันล่าสุด',
          color: 'info',
          duration: 0,
          actions: [{ label: 'รีเฟรช', onClick: () => nuxtApp.$pwa?.updateServiceWorker(true) }],
        })
      },
      { immediate: true },
    )
  })
})
