-- S16 แอดมิน — ทุกฟังก์ชันเช็ก role = 'admin' เองข้างใน (SECURITY DEFINER ข้าม RLS ได้ แต่คุมด้วยเช็กนี้แทน)
-- เรียกได้จาก session ผู้ใช้ authenticated ตรง ๆ ไม่ต้องผ่านโซนสิทธิ์พิเศษเลย (เหมือน admin_stats() เดิม)
-- ADR-0003: ห้ามคืนรูปท่า/รูปลุคให้แอดมินเด็ดขาด — คืนได้แค่ id/เหตุผล/ตัวเลขสถิติเท่านั้น

CREATE FUNCTION public.assert_admin() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
END $$;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.assert_admin() FROM PUBLIC, anon;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.assert_admin() TO authenticated;--> statement-breakpoint

-- ปรับเพดานรวมทั้งระบบ (S16: "เพดานรวม / วัน" + บันทึก)
CREATE FUNCTION public.admin_set_global_cap(p_cap int) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM public.assert_admin();
  IF p_cap < 0 THEN RAISE EXCEPTION 'invalid_cap' USING ERRCODE = 'P0001'; END IF;
  UPDATE public.app_settings SET global_daily_cap = p_cap WHERE id = 1;
END $$;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.admin_set_global_cap(int) FROM PUBLIC, anon;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.admin_set_global_cap(int) TO authenticated;--> statement-breakpoint

-- ปรับโควต้ารายคน (S16: ตาราง "ผู้ใช้" คอลัมน์ "บันทึก" ต่อแถว)
CREATE FUNCTION public.admin_set_user_quota(p_user_id uuid, p_quota int) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM public.assert_admin();
  IF p_quota < 0 THEN RAISE EXCEPTION 'invalid_quota' USING ERRCODE = 'P0001'; END IF;
  UPDATE public.profiles SET daily_quota = p_quota WHERE user_id = p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'user_not_found' USING ERRCODE = 'P0002'; END IF;
END $$;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.admin_set_user_quota(uuid, int) FROM PUBLIC, anon;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.admin_set_user_quota(uuid, int) TO authenticated;--> statement-breakpoint

-- รายชื่อผู้ใช้ + ใช้วันนี้ + โควต้า (S16: ตาราง "ผู้ใช้" + ค้นหาอีเมล)
-- อีเมลอ่านจาก auth.users ได้เพราะฟังก์ชันรันด้วยสิทธิ์เจ้าของ (SECURITY DEFINER) — แพทเทิร์นมาตรฐานของ Supabase
CREATE FUNCTION public.admin_list_users(p_search text DEFAULT NULL, p_limit int DEFAULT 50)
RETURNS TABLE (user_id uuid, email text, created_at timestamptz, daily_quota int, used_today int)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM public.assert_admin();
  RETURN QUERY
    SELECT p.user_id, u.email::text, p.created_at, p.daily_quota, coalesce(du.used, 0) AS used_today
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.user_id
    LEFT JOIN public.daily_usage du ON du.user_id = p.user_id AND du.day = (now() AT TIME ZONE 'Asia/Bangkok')::date
    WHERE p_search IS NULL OR p_search = '' OR u.email ILIKE '%' || p_search || '%'
    ORDER BY p.created_at DESC
    LIMIT p_limit;
END $$;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.admin_list_users(text, int) FROM PUBLIC, anon;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.admin_list_users(text, int) TO authenticated;--> statement-breakpoint

-- รายการ 👎 ล่าสุด (S16) — คืนแค่ look_id (ไม่มีรูป) + เหตุผล + เวลา ตาม ADR-0003
CREATE FUNCTION public.admin_recent_dislikes(p_limit int DEFAULT 20)
RETURNS TABLE (look_id uuid, reason public.dislike_reason, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM public.assert_admin();
  RETURN QUERY
    SELECT d.look_id, d.reason, d.created_at
    FROM public.look_dislikes d
    ORDER BY d.created_at DESC
    LIMIT p_limit;
END $$;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.admin_recent_dislikes(int) FROM PUBLIC, anon;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.admin_recent_dislikes(int) TO authenticated;
