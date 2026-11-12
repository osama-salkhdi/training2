-- =====================================================================
--  منصة تدريب أولمبياد الرياضيات (درعا) — قاعدة البيانات (Supabase / PostgreSQL) — الإصدار 1
--  آمن لإعادة التشغيل (idempotent): يمكن تنفيذه أكثر من مرة دون حذف بيانات.
--  التنفيذ: لوحة Supabase ← SQL Editor ← الصق الملف كاملاً ← Run
-- =====================================================================

-- ---------- 1) الجداول ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null,
  name        text not null default '',
  role        text not null default 'student',
  student_id  text,
  created_at  timestamptz not null default now()
);
alter table public.profiles add column if not exists student_id text;
alter table public.profiles drop constraint if exists profiles_role_chk;
alter table public.profiles add constraint profiles_role_chk check (role in ('dev','admin','mentor','student'));
-- الإصدار 3: دور «المرشد» يندمج في «المشرف»
update public.profiles set role = 'admin' where role = 'mentor';

create table if not exists public.settings (
  id          int primary key default 1,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);
do $$ begin
  alter table public.settings add constraint settings_single_row check (id = 1);
exception when duplicate_object then null; end $$;

create table if not exists public.students (
  id text primary key, track_id text, data jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now());
alter table public.students add column if not exists track_id text;
alter table public.students add column if not exists exam_no text;
create unique index if not exists students_exam_no_uq on public.students(exam_no) where exam_no is not null and exam_no <> '';

create table if not exists public.tasks (
  id text primary key, track_id text, data jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now());

create table if not exists public.submissions (
  id          text primary key,
  task_id     text not null,
  student_id  text not null,
  status      text not null default 'submitted',
  score       numeric,
  feedback    text not null default '',
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);
do $$ begin
  alter table public.submissions add constraint submissions_status_chk check (status in ('submitted','graded','returned'));
exception when duplicate_object then null; end $$;
create index if not exists submissions_student_idx on public.submissions(student_id);

create table if not exists public.sessions (
  id text primary key, data jsonb not null default '{}'::jsonb);

create table if not exists public.notes (
  id text primary key, student_id text not null, data jsonb not null default '{}'::jsonb);

create table if not exists public.activity (
  id          text primary key,
  data        jsonb not null default '{}'::jsonb,
  created_by  uuid default auth.uid(),
  created_at  timestamptz not null default now()
);

create table if not exists public.surveys (
  id text primary key, data jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now());

create table if not exists public.survey_responses (
  id          text primary key default gen_random_uuid()::text,
  survey_id   text not null references public.surveys(id) on delete cascade,
  student_id  text,            -- يبقى فارغاً في الاستبيانات المجهولة
  track_id    text,
  data        jsonb not null default '{}'::jsonb,
  created_on  date not null default current_date   -- تاريخ فقط بلا وقت، لتقليل إمكانية الربط في المجهول
);
create index if not exists survey_responses_survey_idx on public.survey_responses(survey_id);

create table if not exists public.survey_participation (
  survey_id   text not null references public.surveys(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_on  date not null default current_date,
  primary key (survey_id, user_id)
);

-- الاختبارات: الأسئلة والإجابات الصحيحة هنا، ولا يقرؤها إلا الكادر
create table if not exists public.exams (
  id text primary key, data jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now());

create table if not exists public.exam_attempts (
  id           text primary key default gen_random_uuid()::text,
  exam_id      text not null references public.exams(id) on delete cascade,
  student_id   text,
  user_id      uuid not null references auth.users(id) on delete cascade,
  status       text not null default 'in_progress',
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  duration_sec int,
  score        numeric,
  max_score    numeric,
  answers      jsonb not null default '{}'::jsonb,
  q_times      jsonb not null default '{}'::jsonb,
  late         boolean not null default false
);
create unique index if not exists exam_attempts_one_per_user on public.exam_attempts(exam_id, user_id);

create table if not exists public.notifications (
  id          text primary key,
  title       text not null default '',
  body        text not null default '',
  target      text not null default 'all',      -- all | track | student | staff
  track_id    text,
  student_id  text,
  created_by  uuid default auth.uid(),
  created_at  timestamptz not null default now()
);
create table if not exists public.notification_reads (
  notification_id text not null references public.notifications(id) on delete cascade,
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  read_at         timestamptz not null default now(),
  primary key (notification_id, user_id)
);

-- المراحل الثلاث: الاسم والحالة وقائمة المسموح لهم داخل data
create table if not exists public.stages (
  id text primary key, data jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now());
-- كلمات سر المراحل: يقرؤها الكادر فقط، والطالب يُتحقَّق من كلمته عبر unlock_stage
create table if not exists public.stage_secrets (
  stage_id text primary key, password text not null, updated_at timestamptz not null default now());
-- من دخل أي مرحلة (بعد إدخال كلمة السر الصحيحة)
create table if not exists public.stage_unlocks (
  stage_id    text not null,
  user_id     uuid not null references auth.users(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (stage_id, user_id)
);
-- ملفات المحاضرات وأسئلة الدورات (الملف نفسه في Storage bucket «materials»)
create table if not exists public.materials (
  id text primary key, stage_id text not null, data jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now());
create index if not exists materials_stage_idx on public.materials(stage_id);
-- بطاقات دخول الطلاب (اسم المستخدم وكلمة السر كما وُلّدت) ليصدّرها المشرف. للكادر فقط.
create table if not exists public.student_credentials (
  student_id text primary key, username text not null default '', password text not null default '', updated_at timestamptz not null default now());

-- ---------- 2) دوال الصلاحيات (security definer) ----------
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as
$$ select role from public.profiles where id = auth.uid() $$;

-- المطور: كل الصلاحيات، بما فيها إعدادات الموقع وإنشاء المشرفين
create or replace function public.is_dev() returns boolean
language sql stable security definer set search_path = public as
$$ select coalesce((select role = 'dev' from public.profiles where id = auth.uid()), false) $$;

-- is_admin يبقى للتوافق: المطور أو المشرف
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select coalesce((select role in ('dev','admin') from public.profiles where id = auth.uid()), false) $$;

-- الكادر: المطور والمشرفون
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as
$$ select coalesce((select role in ('dev','admin','mentor') from public.profiles where id = auth.uid()), false) $$;

create or replace function public.my_student_id() returns text
language sql stable security definer set search_path = public as
$$ select student_id from public.profiles where id = auth.uid() $$;

create or replace function public.my_track_id() returns text
language sql stable security definer set search_path = public as
$$ select s.track_id from public.students s where s.id = public.my_student_id() $$;

-- هل يحق للمستخدم الحالي دخول المرحلة؟ الكادر دائماً. الطالب: المرحلة مفتوحة + (غير محصورة أو اسمه في القائمة) + أدخل كلمة السر
create or replace function public.can_stage(p_stage text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_staff() or coalesce(p_stage,'') = '' or exists (
    select 1 from public.stages g
     where g.id = p_stage
       and coalesce((g.data->>'open')::boolean, false)
       and (not coalesce((g.data->>'restrict')::boolean, false)
            or coalesce(g.data->'allowed','[]'::jsonb) ? coalesce(public.my_student_id(),''))
       and exists (select 1 from public.stage_unlocks u where u.stage_id = g.id and u.user_id = auth.uid())) $$;

-- دخول المرحلة بكلمة السر
create or replace function public.unlock_stage(p_stage text, p_password text) returns void
language plpgsql security definer set search_path = public as $$
declare g public.stages%rowtype; v_pw text;
begin
  if auth.uid() is null then raise exception 'يجب تسجيل الدخول'; end if;
  select * into g from public.stages where id = p_stage;
  if not found or not coalesce((g.data->>'open')::boolean, false) then raise exception 'هذه المرحلة مغلقة حالياً'; end if;
  if not public.is_staff() and coalesce((g.data->>'restrict')::boolean, false)
     and not (coalesce(g.data->'allowed','[]'::jsonb) ? coalesce(public.my_student_id(),'')) then
    raise exception 'غير مسموح لك بدخول هذه المرحلة، راجع المشرف';
  end if;
  select password into v_pw from public.stage_secrets where stage_id = p_stage;
  if v_pw is null or v_pw = '' then raise exception 'لم تُحدَّد كلمة سر لهذه المرحلة بعد'; end if;
  if trim(coalesce(p_password,'')) <> v_pw then
    perform pg_sleep(1);  -- إبطاء محاولات التخمين
    raise exception 'كلمة السر غير صحيحة';
  end if;
  insert into public.stage_unlocks(stage_id, user_id) values (p_stage, auth.uid()) on conflict do nothing;
end $$;
revoke all on function public.unlock_stage(text, text) from public, anon;
grant execute on function public.unlock_stage(text, text) to authenticated;

-- تغيير كلمة سر المرحلة (للكادر): يُخرج كل من دخلها ليُدخلوا الكلمة الجديدة
create or replace function public.set_stage_password(p_stage text, p_password text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'هذه العملية للمشرف فقط'; end if;
  if length(trim(coalesce(p_password,''))) < 3 then raise exception 'كلمة السر 3 أحرف على الأقل'; end if;
  insert into public.stage_secrets(stage_id, password) values (p_stage, trim(p_password))
  on conflict (stage_id) do update set password = excluded.password, updated_at = now();
  delete from public.stage_unlocks where stage_id = p_stage;
end $$;
revoke all on function public.set_stage_password(text, text) from public, anon;
grant execute on function public.set_stage_password(text, text) to authenticated;

-- الطالب لا يستطيع وضع علامة لنفسه أو تغيير حالة تسليمه
create or replace function public.submissions_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.is_staff() then
    new.updated_at := now();
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.status := 'submitted'; new.score := null; new.feedback := '';
  else
    new.status := 'submitted'; new.score := old.score; new.feedback := old.feedback;
    new.student_id := old.student_id; new.task_id := old.task_id;
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists submissions_guard on public.submissions;
create trigger submissions_guard before insert or update on public.submissions
  for each row execute function public.submissions_guard();

-- منع أي مستخدم من تغيير دوره أو ربط حسابه بطالب آخر (إلا المشرف)
create or replace function public.profiles_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_dev() and auth.uid() is not null then
    raise exception 'غير مسموح';
  end if;
  return new;
end $$;
drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.profiles_guard();

-- إجابة الاستبيان: مرة واحدة لكل مستخدم، والمجهول لا يُخزَّن معه اسم الطالب
create or replace function public.submit_survey(p_survey text, p_answers jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  s        public.surveys%rowtype;
  v_sid    text;
  v_track  text;
  v_target text;
begin
  if auth.uid() is null then raise exception 'يجب تسجيل الدخول'; end if;
  select * into s from public.surveys where id = p_survey;
  if not found or coalesce(s.data->>'status','') <> 'open' then
    raise exception 'الاستبيان غير متاح للإجابة';
  end if;
  v_sid := public.my_student_id();
  select track_id into v_track from public.students where id = v_sid;
  v_target := coalesce(s.data->>'trackId','');
  if v_target <> '' and coalesce(v_track,'') <> v_target and not public.is_staff() then
    raise exception 'هذا الاستبيان ليس لمسارك';
  end if;
  begin
    insert into public.survey_participation(survey_id, user_id) values (p_survey, auth.uid());
  exception when unique_violation then
    raise exception 'سبق أن أجبت على هذا الاستبيان';
  end;
  insert into public.survey_responses(survey_id, student_id, track_id, data)
  values (p_survey,
          case when coalesce((s.data->>'anonymous')::boolean, false) then null else v_sid end,
          v_track, coalesce(p_answers, '{}'::jsonb));
end $$;
revoke all on function public.submit_survey(text, jsonb) from public, anon;
grant execute on function public.submit_survey(text, jsonb) to authenticated;

-- ---------- 3) تفعيل RLS ----------
alter table public.profiles             enable row level security;
alter table public.settings             enable row level security;
alter table public.students             enable row level security;
alter table public.tasks                enable row level security;
alter table public.submissions          enable row level security;
alter table public.sessions             enable row level security;
alter table public.notes                enable row level security;
alter table public.activity             enable row level security;
alter table public.surveys              enable row level security;
alter table public.survey_responses     enable row level security;
alter table public.survey_participation enable row level security;
alter table public.exams                enable row level security;
alter table public.exam_attempts        enable row level security;
alter table public.notifications        enable row level security;
alter table public.notification_reads   enable row level security;
alter table public.stages               enable row level security;
alter table public.stage_secrets        enable row level security;
alter table public.stage_unlocks        enable row level security;
alter table public.materials            enable row level security;
alter table public.student_credentials  enable row level security;

-- ---------- 4) السياسات ----------
-- الحسابات: الكادر يرى الجميع، والطالب يرى حسابه فقط. الإنشاء والحذف عبر Edge Function فقط.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (public.is_staff() or id = auth.uid());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (public.is_dev()) with check (public.is_dev());

-- إعدادات الموقع: قراءة للجميع، تعديل للمطور فقط
drop policy if exists settings_select on public.settings;
create policy settings_select on public.settings for select to authenticated using (true);
drop policy if exists settings_write on public.settings;
create policy settings_write on public.settings for all to authenticated
  using (public.is_dev()) with check (public.is_dev());

-- الطلاب: الكادر يرى ويعدّل الجميع، والطالب يرى ملفه فقط
drop policy if exists students_select on public.students;
create policy students_select on public.students for select to authenticated
  using (public.is_staff() or id = public.my_student_id());
drop policy if exists students_write on public.students;
create policy students_write on public.students for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- الوظائف: يقرؤها الجميع (الطالب يرى ما يخص مساره من الواجهة)، ويديرها الكادر
drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks for select to authenticated
  using (public.is_staff() or track_id is null or track_id = '' or track_id = public.my_track_id());
drop policy if exists tasks_write on public.tasks;
create policy tasks_write on public.tasks for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- التسليمات: الطالب يرى ويسلّم ما يخصه فقط، ولا يعدّل تسليماً تم تقييمه
drop policy if exists subs_select on public.submissions;
create policy subs_select on public.submissions for select to authenticated
  using (public.is_staff() or student_id = public.my_student_id());
drop policy if exists subs_insert on public.submissions;
create policy subs_insert on public.submissions for insert to authenticated
  with check (public.is_staff() or student_id = public.my_student_id());
drop policy if exists subs_update on public.submissions;
create policy subs_update on public.submissions for update to authenticated
  using (public.is_staff() or (student_id = public.my_student_id() and status <> 'graded'))
  with check (public.is_staff() or student_id = public.my_student_id());
drop policy if exists subs_delete on public.submissions;
create policy subs_delete on public.submissions for delete to authenticated using (public.is_staff());

-- الجلسات: قراءة للجميع (لحساب نسبة الحضور)، وتعديل للكادر
drop policy if exists sessions_select on public.sessions;
create policy sessions_select on public.sessions for select to authenticated using (true);
drop policy if exists sessions_write on public.sessions;
create policy sessions_write on public.sessions for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- ملاحظات المرشد: الطالب يقرأ ملاحظاته فقط
drop policy if exists notes_select on public.notes;
create policy notes_select on public.notes for select to authenticated
  using (public.is_staff() or student_id = public.my_student_id());
drop policy if exists notes_write on public.notes;
create policy notes_write on public.notes for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- سجل النشاطات: الكادر يقرأ، والجميع يضيف باسمه
drop policy if exists activity_select on public.activity;
create policy activity_select on public.activity for select to authenticated using (public.is_staff());
drop policy if exists activity_insert on public.activity;
create policy activity_insert on public.activity for insert to authenticated
  with check (created_by = auth.uid());
drop policy if exists activity_delete on public.activity;
create policy activity_delete on public.activity for delete to authenticated using (public.is_staff());

-- الاستبيانات: الطالب يرى المنشور منها لمساره فقط
drop policy if exists surveys_select on public.surveys;
create policy surveys_select on public.surveys for select to authenticated
  using (public.is_staff() or (
        coalesce(data->>'status','') in ('open','closed')
    and (coalesce(data->>'trackId','') = '' or data->>'trackId' = public.my_track_id())));
drop policy if exists surveys_write on public.surveys;
create policy surveys_write on public.surveys for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- الإجابات: يقرؤها الكادر فقط، والإضافة عبر submit_survey فقط
drop policy if exists responses_select on public.survey_responses;
create policy responses_select on public.survey_responses for select to authenticated using (public.is_staff());
drop policy if exists responses_delete on public.survey_responses;
create policy responses_delete on public.survey_responses for delete to authenticated using (public.is_staff());

drop policy if exists participation_select on public.survey_participation;
create policy participation_select on public.survey_participation for select to authenticated
  using (public.is_staff() or user_id = auth.uid());
drop policy if exists participation_delete on public.survey_participation;
create policy participation_delete on public.survey_participation for delete to authenticated using (public.is_staff());

-- الاختبارات: الكادر فقط. الطالب يصل إليها عبر الدوال (بلا إجابات صحيحة)
drop policy if exists exams_staff on public.exams;
create policy exams_staff on public.exams for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists attempts_select on public.exam_attempts;
create policy attempts_select on public.exam_attempts for select to authenticated
  using (public.is_staff() or user_id = auth.uid());
drop policy if exists attempts_delete on public.exam_attempts;
create policy attempts_delete on public.exam_attempts for delete to authenticated using (public.is_staff());

-- الإشعارات: الطالب يرى العامة ومساره وما أُرسل إليه
drop policy if exists notif_select on public.notifications;
create policy notif_select on public.notifications for select to authenticated
  using (public.is_staff()
      or target = 'all'
      or (target = 'track' and track_id = public.my_track_id())
      or (target = 'student' and student_id = public.my_student_id()));
drop policy if exists notif_insert on public.notifications;
create policy notif_insert on public.notifications for insert to authenticated
  with check (public.is_staff() and created_by = auth.uid());
drop policy if exists notif_update on public.notifications;
create policy notif_update on public.notifications for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
drop policy if exists notif_delete on public.notifications;
create policy notif_delete on public.notifications for delete to authenticated using (public.is_staff());

drop policy if exists reads_select on public.notification_reads;
create policy reads_select on public.notification_reads for select to authenticated
  using (public.is_staff() or user_id = auth.uid());
drop policy if exists reads_insert on public.notification_reads;
create policy reads_insert on public.notification_reads for insert to authenticated
  with check (user_id = auth.uid());

-- المراحل: يراها الجميع (الاسم والحالة)، ويعدّلها الكادر
drop policy if exists stages_select on public.stages;
create policy stages_select on public.stages for select to authenticated using (true);
drop policy if exists stages_write on public.stages;
create policy stages_write on public.stages for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- كلمات سر المراحل: للكادر فقط (قراءة). الكتابة عبر set_stage_password
drop policy if exists stage_secrets_select on public.stage_secrets;
create policy stage_secrets_select on public.stage_secrets for select to authenticated using (public.is_staff());

-- سجل الدخول: الطالب يرى سجله، والكادر يرى الجميع ويحذف. الإضافة عبر unlock_stage فقط
drop policy if exists stage_unlocks_select on public.stage_unlocks;
create policy stage_unlocks_select on public.stage_unlocks for select to authenticated
  using (public.is_staff() or user_id = auth.uid());
drop policy if exists stage_unlocks_delete on public.stage_unlocks;
create policy stage_unlocks_delete on public.stage_unlocks for delete to authenticated using (public.is_staff());

-- الملفات: لا يراها الطالب إلا بعد دخول مرحلتها
drop policy if exists materials_select on public.materials;
create policy materials_select on public.materials for select to authenticated using (public.can_stage(stage_id));
drop policy if exists materials_write on public.materials;
create policy materials_write on public.materials for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- بطاقات الدخول: للكادر فقط
drop policy if exists creds_staff on public.student_credentials;
create policy creds_staff on public.student_credentials for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- ---------- 5) تخزين الملفات (Storage) ----------
-- كل طالب يرفع داخل مجلد باسم معرّفه auth.uid()، والكادر يقرأ الجميع. الحد 20MB لكل ملف.
do $$ begin
  insert into storage.buckets (id, name, public, file_size_limit)
  values ('submissions', 'submissions', false, 20971520)
  on conflict (id) do nothing;
exception when undefined_table then null; end $$;

do $$ begin
  drop policy if exists olymp_files_select on storage.objects;
  create policy olymp_files_select on storage.objects for select to authenticated
    using (bucket_id = 'submissions' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff()));
  drop policy if exists olymp_files_insert on storage.objects;
  create policy olymp_files_insert on storage.objects for insert to authenticated
    with check (bucket_id = 'submissions' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_dev()));
  drop policy if exists olymp_files_update on storage.objects;
  create policy olymp_files_update on storage.objects for update to authenticated
    using (bucket_id = 'submissions' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_dev()));
  drop policy if exists olymp_files_delete on storage.objects;
  create policy olymp_files_delete on storage.objects for delete to authenticated
    using (bucket_id = 'submissions' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff()));
exception when undefined_table or invalid_schema_name then null; end $$;

-- ملفات المحاضرات: bucket خاص «materials»، المسار s<رقم المرحلة>/<الملف>. الحد 50MB.
-- يرفع ويحذف الكادر فقط، ويقرأ الطالب ملفات المرحلة التي دخلها فقط.
do $$ begin
  insert into storage.buckets (id, name, public, file_size_limit)
  values ('materials', 'materials', false, 52428800)
  on conflict (id) do nothing;
exception when undefined_table then null; end $$;
do $$ begin
  drop policy if exists olymp_mat_select on storage.objects;
  create policy olymp_mat_select on storage.objects for select to authenticated
    using (bucket_id = 'materials' and public.can_stage(substr((storage.foldername(name))[1], 2)));
  drop policy if exists olymp_mat_insert on storage.objects;
  create policy olymp_mat_insert on storage.objects for insert to authenticated
    with check (bucket_id = 'materials' and public.is_staff());
  drop policy if exists olymp_mat_update on storage.objects;
  create policy olymp_mat_update on storage.objects for update to authenticated
    using (bucket_id = 'materials' and public.is_staff());
  drop policy if exists olymp_mat_delete on storage.objects;
  create policy olymp_mat_delete on storage.objects for delete to authenticated
    using (bucket_id = 'materials' and public.is_staff());
exception when undefined_table or invalid_schema_name then null; end $$;

-- ---------- 6) التحديث اللحظي (Realtime) ----------
do $$
declare t text;
begin
  foreach t in array array['settings','students','tasks','submissions','stages','stage_unlocks','stage_secrets','materials','student_credentials',
                           'sessions','notes','activity','surveys','survey_responses','survey_participation',
                           'exams','exam_attempts','notifications','notification_reads']
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object or undefined_object then null;
    end;
  end loop;
end $$;

-- =====================================================================
-- 7) الاختبارات: التصحيح والوقت على الخادم، والإجابات الصحيحة لا تصل للطالب قبل التسليم
-- =====================================================================
create or replace function public._num(t text) returns numeric
language sql immutable as $$ select case when t ~ '^\s*-?\d+(\.\d+)?\s*$' then t::numeric else null end $$;

-- الحد الزمني الكلي بالثواني (أو null إن لم يكن هناك مؤقت)
create or replace function public._exam_limit_sec(e public.exams) returns numeric
language sql stable as $$
  select case coalesce(e.data->>'timerMode','none')
    when 'total' then public._num(e.data->>'totalMinutes') * 60
    when 'perQuestion' then (select sum(coalesce(public._num(q->>'sec'), public._num(e.data->>'perQuestionSec'), 60))
                             from jsonb_array_elements(coalesce(e.data->'questions','[]'::jsonb)) q)
    else null end $$;

create or replace function public._exam_public(e public.exams) returns jsonb
language sql stable as $$
  select jsonb_build_object(
    'id', e.id, 'title', coalesce(e.data->>'title',''), 'desc', coalesce(e.data->>'desc',''),
    'status', coalesce(e.data->>'status','draft'), 'trackId', coalesce(e.data->>'trackId',''), 'stage', coalesce(e.data->>'stage',''),
    'timerMode', coalesce(e.data->>'timerMode','none'), 'totalMinutes', public._num(e.data->>'totalMinutes'),
    'perQuestionSec', public._num(e.data->>'perQuestionSec'), 'limitSec', public._exam_limit_sec(e),
    'shuffle', coalesce((e.data->>'shuffle')::boolean, false), 'showAnswers', coalesce((e.data->>'showAnswers')::boolean, true),
    'passMark', public._num(e.data->>'passMark'), 'openFrom', e.data->>'openFrom', 'openTo', e.data->>'openTo',
    'count', jsonb_array_length(coalesce(e.data->'questions','[]'::jsonb))) $$;

-- إنهاء المحاولة وحساب العلامة من الأسئلة المخزنة على الخادم
create or replace function public._finalize_attempt(p_id text) returns void
language plpgsql security definer set search_path = public as $$
declare a public.exam_attempts%rowtype; e public.exams%rowtype; q jsonb;
        v_score numeric := 0; v_max numeric := 0; v_pts numeric; v_lim numeric; v_el numeric;
begin
  select * into a from public.exam_attempts where id = p_id for update;
  if not found or a.status = 'submitted' then return; end if;
  select * into e from public.exams where id = a.exam_id;
  for q in select * from jsonb_array_elements(coalesce(e.data->'questions','[]'::jsonb)) loop
    v_pts := coalesce(public._num(q->>'points'), 1);
    v_max := v_max + v_pts;
    if (a.answers->>(q->>'id')) is not null and (a.answers->>(q->>'id')) = (q->>'correct') then
      v_score := v_score + v_pts;
    end if;
  end loop;
  v_lim := public._exam_limit_sec(e);
  v_el := extract(epoch from now() - a.started_at);
  update public.exam_attempts set status = 'submitted', finished_at = now(),
         duration_sec = case when v_lim is not null then least(v_el, v_lim)::int else v_el::int end,
         score = v_score, max_score = v_max, late = (v_lim is not null and v_el > v_lim + 60)
   where id = p_id;
end $$;
revoke all on function public._finalize_attempt(text) from public, anon, authenticated;

-- قائمة اختبارات الطالب (بلا أسئلة)
create or replace function public.list_my_exams() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  return coalesce((
    select jsonb_agg(public._exam_public(e) || jsonb_build_object('attempt',
             (select jsonb_build_object('id', a.id, 'status', a.status, 'score', a.score, 'max', a.max_score,
                     'duration', a.duration_sec, 'started_at', a.started_at, 'finished_at', a.finished_at, 'late', a.late)
                from public.exam_attempts a where a.exam_id = e.id and a.user_id = auth.uid()))
           order by e.updated_at desc)
      from public.exams e
     where coalesce(e.data->>'status','') in ('open','closed')
       and public.can_stage(coalesce(e.data->>'stage',''))), '[]'::jsonb);
end $$;

-- بدء الاختبار بالرقم الامتحاني (أو استئنافه)
create or replace function public.start_exam(p_exam text, p_exam_no text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare e public.exams%rowtype; a public.exam_attempts%rowtype; v_sid text := public.my_student_id();
        v_no text; v_name text; v_track text; v_lim numeric; qs jsonb;
begin
  if auth.uid() is null then raise exception 'يجب تسجيل الدخول'; end if;
  if v_sid is null then raise exception 'هذا الحساب غير مرتبط بطالب'; end if;
  select * into e from public.exams where id = p_exam;
  if not found then raise exception 'الاختبار غير موجود'; end if;
  select exam_no, data->>'name', track_id into v_no, v_name, v_track from public.students where id = v_sid;
  if coalesce(v_no,'') = '' then raise exception 'لم يُحدَّد لك رقم امتحاني بعد، راجع المشرف'; end if;
  if trim(coalesce(p_exam_no,'')) <> v_no then raise exception 'الرقم الامتحاني غير صحيح'; end if;
  if not public.can_stage(coalesce(e.data->>'stage','')) then
    raise exception 'هذا الاختبار ضمن مرحلة لم تدخلها بعد'; end if;
  select * into a from public.exam_attempts where exam_id = p_exam and user_id = auth.uid();
  if found and a.status = 'submitted' then raise exception 'سبق أن قدّمت هذا الاختبار'; end if;
  if not found then
    if coalesce(e.data->>'status','') <> 'open' then raise exception 'الاختبار غير متاح حالياً'; end if;
    if nullif(e.data->>'openFrom','') is not null and now() < (e.data->>'openFrom')::timestamptz then
      raise exception 'لم يحن موعد الاختبار بعد'; end if;
    if nullif(e.data->>'openTo','') is not null and now() > (e.data->>'openTo')::timestamptz then
      raise exception 'انتهت فترة إتاحة الاختبار'; end if;
    insert into public.exam_attempts(exam_id, student_id, user_id) values (p_exam, v_sid, auth.uid()) returning * into a;
  else
    v_lim := public._exam_limit_sec(e);
    if v_lim is not null and extract(epoch from now() - a.started_at) > v_lim + 60 then
      perform public._finalize_attempt(a.id);
      return jsonb_build_object('finished', true, 'attempt_id', a.id);
    end if;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('id', q->>'id', 'text', q->>'text', 'options', coalesce(q->'options','[]'::jsonb),
           'points', coalesce(public._num(q->>'points'),1), 'sec', public._num(q->>'sec'))), '[]'::jsonb)
    into qs from jsonb_array_elements(coalesce(e.data->'questions','[]'::jsonb)) q;
  return public._exam_public(e) || jsonb_build_object('attempt_id', a.id, 'started_at', a.started_at, 'server_now', now(),
         'answers', a.answers, 'student_name', v_name, 'exam_no', v_no, 'questions', qs);
end $$;

-- حفظ الإجابات أثناء الاختبار (حماية من انقطاع الإنترنت)
create or replace function public.save_exam_progress(p_attempt text, p_answers jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare a public.exam_attempts%rowtype; e public.exams%rowtype; v_lim numeric;
begin
  select * into a from public.exam_attempts where id = p_attempt and user_id = auth.uid();
  if not found then raise exception 'محاولة غير موجودة'; end if;
  if a.status = 'submitted' then return jsonb_build_object('finished', true); end if;
  select * into e from public.exams where id = a.exam_id;
  v_lim := public._exam_limit_sec(e);
  if v_lim is not null and extract(epoch from now() - a.started_at) > v_lim + 60 then
    perform public._finalize_attempt(a.id); return jsonb_build_object('finished', true);
  end if;
  update public.exam_attempts set answers = coalesce(p_answers, '{}'::jsonb) where id = a.id;
  return jsonb_build_object('ok', true);
end $$;

-- نتيجة المحاولة (للطالب صاحبها أو للكادر)
create or replace function public.exam_result(p_attempt text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare a public.exam_attempts%rowtype; e public.exams%rowtype; v_show boolean; qs jsonb;
begin
  select * into a from public.exam_attempts where id = p_attempt;
  if not found or (a.user_id <> auth.uid() and not public.is_staff()) then raise exception 'غير مسموح'; end if;
  if a.status <> 'submitted' then raise exception 'لم يُسلَّم الاختبار بعد'; end if;
  select * into e from public.exams where id = a.exam_id;
  v_show := public.is_staff() or coalesce((e.data->>'showAnswers')::boolean, true);
  select coalesce(jsonb_agg(jsonb_build_object('id', q->>'id', 'text', q->>'text', 'options', coalesce(q->'options','[]'::jsonb),
           'points', coalesce(public._num(q->>'points'),1), 'chosen', public._num(a.answers->>(q->>'id')),
           'correct', case when v_show then public._num(q->>'correct') end,
           'explanation', case when v_show then q->>'explanation' end,
           'ok', (a.answers->>(q->>'id')) is not null and (a.answers->>(q->>'id')) = (q->>'correct'),
           'time', public._num(a.q_times->>(q->>'id')))), '[]'::jsonb)
    into qs from jsonb_array_elements(coalesce(e.data->'questions','[]'::jsonb)) q;
  return public._exam_public(e) || jsonb_build_object('attempt_id', a.id, 'score', a.score, 'max', a.max_score,
         'duration', a.duration_sec, 'started_at', a.started_at, 'finished_at', a.finished_at, 'late', a.late,
         'showAnswers', v_show, 'questions', qs);
end $$;

-- التسليم النهائي
create or replace function public.submit_exam(p_attempt text, p_answers jsonb, p_qtimes jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare a public.exam_attempts%rowtype; e public.exams%rowtype; v_lim numeric;
begin
  select * into a from public.exam_attempts where id = p_attempt and user_id = auth.uid();
  if not found then raise exception 'محاولة غير موجودة'; end if;
  if a.status <> 'submitted' then
    select * into e from public.exams where id = a.exam_id;
    v_lim := public._exam_limit_sec(e);
    -- بعد انتهاء الوقت بأكثر من دقيقتين لا تُقبل إجابات جديدة، وتُعتمد المحفوظة
    if v_lim is null or extract(epoch from now() - a.started_at) <= v_lim + 120 then
      update public.exam_attempts set answers = coalesce(p_answers, '{}'::jsonb) where id = a.id;
    end if;
    update public.exam_attempts set q_times = coalesce(p_qtimes, '{}'::jsonb) where id = a.id;
    perform public._finalize_attempt(a.id);
  end if;
  return public.exam_result(p_attempt);
end $$;

revoke all on function public.list_my_exams() from public, anon;
revoke all on function public.start_exam(text, text) from public, anon;
revoke all on function public.save_exam_progress(text, jsonb) from public, anon;
revoke all on function public.exam_result(text) from public, anon;
revoke all on function public.submit_exam(text, jsonb, jsonb) from public, anon;
grant execute on function public.list_my_exams() to authenticated;
grant execute on function public.start_exam(text, text) to authenticated;
grant execute on function public.save_exam_progress(text, jsonb) to authenticated;
grant execute on function public.exam_result(text) to authenticated;
grant execute on function public.submit_exam(text, jsonb, jsonb) to authenticated;

-- =====================================================================
-- 8) النسخة الاحتياطية الكاملة والاستعادة على خادم جديد (للمطور فقط)
--    تشمل الحسابات بكلمات مرورها المشفّرة، فيدخل الجميع بنفس أسمائهم وكلمات مرورهم.
-- =====================================================================
create or replace function public.export_auth_users() returns jsonb
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_dev() then raise exception 'هذه العملية للمطور فقط'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', u.id, 'email', u.email, 'encrypted_password', u.encrypted_password,
                    'created_at', u.created_at, 'email_confirmed_at', u.email_confirmed_at)) from auth.users u), '[]'::jsonb);
end $$;
revoke all on function public.export_auth_users() from public, anon;
grant execute on function public.export_auth_users() to authenticated;

create or replace function public.restore_backup(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare u jsonb; v_id uuid; v_old uuid; n_new int := 0; n_map int := 0; n_rows int := 0; c int;
begin
  if not public.is_dev() then raise exception 'هذه العملية للمطور فقط'; end if;
  create temp table if not exists _idmap(old uuid primary key, new uuid not null) on commit drop;
  delete from _idmap;

  -- 1) الحسابات: الموجود يُترك كما هو، والمطابق بالاسم يُربط، والجديد يُنشأ بنفس معرّفه وكلمة مروره المشفّرة
  for u in select * from jsonb_array_elements(coalesce(p->'auth_users','[]'::jsonb)) loop
    v_old := (u->>'id')::uuid;
    select id into v_id from auth.users where id = v_old;
    if found then insert into _idmap values (v_old, v_id) on conflict do nothing; continue; end if;
    select id into v_id from auth.users where lower(email) = lower(u->>'email');
    if found then insert into _idmap values (v_old, v_id) on conflict do nothing; n_map := n_map + 1; continue; end if;
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at,
                            raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change)
    values ('00000000-0000-0000-0000-000000000000', v_old, 'authenticated', 'authenticated', u->>'email', u->>'encrypted_password',
            coalesce((u->>'email_confirmed_at')::timestamptz, now()), coalesce((u->>'created_at')::timestamptz, now()), now(),
            '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, '', '', '', '');
    insert into auth.identities (user_id, provider_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
    values (v_old, v_old::text, jsonb_build_object('sub', v_old::text, 'email', u->>'email', 'email_verified', true), 'email', now(), now(), now());
    insert into _idmap values (v_old, v_old);
    n_new := n_new + 1;
  end loop;

  -- 2) الجداول (upsert: إعادة الاستعادة آمنة)
  insert into public.profiles (id, username, name, role, student_id, created_at)
  select coalesce(m.new, r.id), r.username, r.name, r.role, r.student_id, coalesce(r.created_at, now())
    from jsonb_populate_recordset(null::public.profiles, coalesce(p->'profiles','[]'::jsonb)) r
    left join _idmap m on m.old = r.id
   where exists (select 1 from auth.users x where x.id = coalesce(m.new, r.id))
  on conflict (id) do update set username = excluded.username, name = excluded.name, role = excluded.role, student_id = excluded.student_id;
  get diagnostics c = row_count; n_rows := n_rows + c;

  insert into public.settings select * from jsonb_populate_recordset(null::public.settings, coalesce(p->'settings','[]'::jsonb))
  on conflict (id) do update set data = excluded.data, updated_at = excluded.updated_at;
  insert into public.students (id, track_id, data, updated_at, exam_no)
  select id, track_id, data, coalesce(updated_at, now()), exam_no from jsonb_populate_recordset(null::public.students, coalesce(p->'students','[]'::jsonb))
  on conflict (id) do update set track_id = excluded.track_id, data = excluded.data, updated_at = excluded.updated_at, exam_no = excluded.exam_no;
  insert into public.tasks select * from jsonb_populate_recordset(null::public.tasks, coalesce(p->'tasks','[]'::jsonb))
  on conflict (id) do update set track_id = excluded.track_id, data = excluded.data, updated_at = excluded.updated_at;
  insert into public.submissions select * from jsonb_populate_recordset(null::public.submissions, coalesce(p->'submissions','[]'::jsonb))
  on conflict (id) do update set task_id = excluded.task_id, student_id = excluded.student_id, status = excluded.status,
     score = excluded.score, feedback = excluded.feedback, data = excluded.data, updated_at = excluded.updated_at;
  insert into public.sessions select * from jsonb_populate_recordset(null::public.sessions, coalesce(p->'sessions','[]'::jsonb))
  on conflict (id) do update set data = excluded.data;
  insert into public.notes select * from jsonb_populate_recordset(null::public.notes, coalesce(p->'notes','[]'::jsonb))
  on conflict (id) do update set student_id = excluded.student_id, data = excluded.data;
  insert into public.activity (id, data, created_by, created_at)
  select r.id, r.data, coalesce(m.new, r.created_by), r.created_at
    from jsonb_populate_recordset(null::public.activity, coalesce(p->'activity','[]'::jsonb)) r left join _idmap m on m.old = r.created_by
  on conflict (id) do nothing;
  insert into public.surveys select * from jsonb_populate_recordset(null::public.surveys, coalesce(p->'surveys','[]'::jsonb))
  on conflict (id) do update set data = excluded.data, updated_at = excluded.updated_at;
  insert into public.survey_responses select * from jsonb_populate_recordset(null::public.survey_responses, coalesce(p->'survey_responses','[]'::jsonb))
  on conflict (id) do nothing;
  insert into public.survey_participation (survey_id, user_id, created_on)
  select r.survey_id, coalesce(m.new, r.user_id), r.created_on
    from jsonb_populate_recordset(null::public.survey_participation, coalesce(p->'survey_participation','[]'::jsonb)) r left join _idmap m on m.old = r.user_id
   where exists (select 1 from auth.users x where x.id = coalesce(m.new, r.user_id))
  on conflict do nothing;
  insert into public.exams select * from jsonb_populate_recordset(null::public.exams, coalesce(p->'exams','[]'::jsonb))
  on conflict (id) do update set data = excluded.data, updated_at = excluded.updated_at;
  insert into public.exam_attempts (id, exam_id, student_id, user_id, status, started_at, finished_at, duration_sec, score, max_score, answers, q_times, late)
  select r.id, r.exam_id, r.student_id, coalesce(m.new, r.user_id), r.status, r.started_at, r.finished_at, r.duration_sec, r.score, r.max_score,
         coalesce(r.answers,'{}'::jsonb), coalesce(r.q_times,'{}'::jsonb), coalesce(r.late,false)
    from jsonb_populate_recordset(null::public.exam_attempts, coalesce(p->'exam_attempts','[]'::jsonb)) r left join _idmap m on m.old = r.user_id
   where exists (select 1 from auth.users x where x.id = coalesce(m.new, r.user_id))
  on conflict do nothing;
  insert into public.notifications (id, title, body, target, track_id, student_id, created_by, created_at)
  select r.id, r.title, r.body, r.target, r.track_id, r.student_id, coalesce(m.new, r.created_by), r.created_at
    from jsonb_populate_recordset(null::public.notifications, coalesce(p->'notifications','[]'::jsonb)) r left join _idmap m on m.old = r.created_by
  on conflict (id) do nothing;
  insert into public.notification_reads (notification_id, user_id, read_at)
  select r.notification_id, coalesce(m.new, r.user_id), r.read_at
    from jsonb_populate_recordset(null::public.notification_reads, coalesce(p->'notification_reads','[]'::jsonb)) r left join _idmap m on m.old = r.user_id
   where exists (select 1 from auth.users x where x.id = coalesce(m.new, r.user_id))
  on conflict do nothing;

  insert into public.stages select * from jsonb_populate_recordset(null::public.stages, coalesce(p->'stages','[]'::jsonb))
  on conflict (id) do update set data = excluded.data, updated_at = excluded.updated_at;
  insert into public.stage_secrets select * from jsonb_populate_recordset(null::public.stage_secrets, coalesce(p->'stage_secrets','[]'::jsonb))
  on conflict (stage_id) do update set password = excluded.password, updated_at = excluded.updated_at;
  insert into public.stage_unlocks (stage_id, user_id, unlocked_at)
  select r.stage_id, coalesce(m.new, r.user_id), r.unlocked_at
    from jsonb_populate_recordset(null::public.stage_unlocks, coalesce(p->'stage_unlocks','[]'::jsonb)) r left join _idmap m on m.old = r.user_id
   where exists (select 1 from auth.users x where x.id = coalesce(m.new, r.user_id))
  on conflict do nothing;
  insert into public.materials select * from jsonb_populate_recordset(null::public.materials, coalesce(p->'materials','[]'::jsonb))
  on conflict (id) do update set stage_id = excluded.stage_id, data = excluded.data, updated_at = excluded.updated_at;
  insert into public.student_credentials select * from jsonb_populate_recordset(null::public.student_credentials, coalesce(p->'student_credentials','[]'::jsonb))
  on conflict (student_id) do update set username = excluded.username, password = excluded.password, updated_at = excluded.updated_at;

  return jsonb_build_object('users_created', n_new, 'users_matched', n_map,
                            'id_map', (select coalesce(jsonb_object_agg(old::text, new::text), '{}'::jsonb) from _idmap where old <> new));
end $$;
revoke all on function public.restore_backup(jsonb) from public, anon;
grant execute on function public.restore_backup(jsonb) to authenticated;

-- انتهى ✓

