// =====================================================================
//  Edge Function: admin-users
//  إنشاء الحسابات وتعديلها وحذفها وتغيير كلمات السر.
//  المطور: كل الحسابات. المشرف: حسابات الطلاب فقط.
//  مفتاح service_role يُقرأ هنا من متغيرات البيئة في Supabase ولا يخرج أبداً إلى الواجهة.
// =====================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const DOMAIN = "olymp.local";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const cleanUser = (u: unknown) => String(u ?? "").trim().toLowerCase();
const validUser = (u: string) => /^[a-z0-9._-]{3,32}$/.test(u);
const ROLES = ["dev", "admin", "student"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });

    // 1) من المتصل؟ وهل هو مشرف؟
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: who, error: whoErr } = await admin.auth.getUser(token);
    if (whoErr || !who?.user) return json({ error: "يجب تسجيل الدخول" }, 401);
    const { data: me } = await admin.from("profiles").select("role").eq("id", who.user.id).maybeSingle();
    const isDev = me?.role === "dev";
    const isAdmin = me?.role === "admin" || me?.role === "mentor";
    if (!isDev && !isAdmin) return json({ error: "هذه العملية للمطور أو المشرف فقط" }, 403);
    // المشرف يدير حسابات الطلاب فقط
    const targetRole = async (id: string) => (await admin.from("profiles").select("role").eq("id", id).maybeSingle()).data?.role;

    const body = await req.json();
    const action = String(body.action ?? "");

    if (action === "create") {
      const username = cleanUser(body.username);
      const password = String(body.password ?? "");
      const role = String(body.role ?? "student");
      if (!validUser(username)) return json({ error: "اسم المستخدم: 3–32 حرفاً إنجليزياً أو أرقاماً أو . _ -" }, 400);
      if (password.length < 6) return json({ error: "كلمة المرور 6 أحرف على الأقل" }, 400);
      if (!ROLES.includes(role)) return json({ error: "دور غير صالح" }, 400);
      if (!isDev && role !== "student") return json({ error: "إنشاء المشرفين للمطور فقط" }, 403);
      const { data: created, error } = await admin.auth.admin.createUser({
        email: `${username}@${DOMAIN}`, password, email_confirm: true,
      });
      if (error) return json({ error: error.message.includes("already") ? "اسم المستخدم مستخدم مسبقاً" : error.message }, 400);
      const { error: pErr } = await admin.from("profiles").insert({
        id: created.user.id, username, name: String(body.name ?? username), role,
        student_id: role === "student" ? (body.student_id || null) : null,
      });
      if (pErr) {
        await admin.auth.admin.deleteUser(created.user.id);
        return json({ error: pErr.message }, 400);
      }
      return json({ id: created.user.id });
    }

    if (action === "update") {
      const id = String(body.id ?? "");
      if (!id) return json({ error: "id مفقود" }, 400);
      if (!isDev && (await targetRole(id)) !== "student") return json({ error: "المشرف يعدّل حسابات الطلاب فقط" }, 403);
      if (!isDev && body.role !== undefined && body.role !== "student") return json({ error: "تغيير الأدوار للمطور فقط" }, 403);
      const authPatch: Record<string, unknown> = {};
      const profPatch: Record<string, unknown> = {};
      if (body.username !== undefined) {
        const username = cleanUser(body.username);
        if (!validUser(username)) return json({ error: "اسم مستخدم غير صالح" }, 400);
        authPatch.email = `${username}@${DOMAIN}`; authPatch.email_confirm = true;
        profPatch.username = username;
      }
      if (body.password) {
        if (String(body.password).length < 6) return json({ error: "كلمة المرور 6 أحرف على الأقل" }, 400);
        authPatch.password = String(body.password);
      }
      if (body.name !== undefined) profPatch.name = String(body.name);
      if (body.role !== undefined) {
        if (!ROLES.includes(String(body.role))) return json({ error: "دور غير صالح" }, 400);
        if (id === who.user.id && body.role !== me?.role) return json({ error: "لا يمكنك تغيير دورك بنفسك" }, 400);
        profPatch.role = String(body.role);
      }
      if (body.student_id !== undefined) profPatch.student_id = body.student_id || null;
      if (Object.keys(authPatch).length) {
        const { error } = await admin.auth.admin.updateUserById(id, authPatch);
        if (error) return json({ error: error.message.includes("already") ? "اسم المستخدم مستخدم مسبقاً" : error.message }, 400);
      }
      if (Object.keys(profPatch).length) {
        const { error } = await admin.from("profiles").update(profPatch).eq("id", id);
        if (error) return json({ error: error.message }, 400);
      }
      return json({ ok: true });
    }

    if (action === "delete") {
      const id = String(body.id ?? "");
      if (id === who.user.id) return json({ error: "لا يمكنك حذف حسابك" }, 400);
      if (!isDev && (await targetRole(id)) !== "student") return json({ error: "المشرف يحذف حسابات الطلاب فقط" }, 403);
      const { error } = await admin.auth.admin.deleteUser(id);   // يحذف profiles تلقائياً (on delete cascade)
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    return json({ error: "عملية غير معروفة" }, 400);
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
