-- 인스타·쓰레드 「지금 올리기 · 예약하기」 — tools/social_setup.py 가 실행합니다 (Supabase SQL Editor에 직접 붙여도 됩니다).
-- 팀 로그인(authenticated)만 게시 요청·미디어 업로드를 할 수 있고, 토큰 표는 서비스 롤(Edge Function)만 읽습니다.
-- {{PROJECT_URL}} 은 setup 스크립트가 채웁니다. 예약 실행 비밀값은 Vault(social_cron_secret)에 둡니다.

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  platform text not null check (platform in ('instagram', 'threads')),
  draft_id text,
  cat_id integer,
  topic text,
  caption text not null default '',
  reply_text text,
  media jsonb not null default '[]'::jsonb,       -- [{url, path, type: IMAGE|VIDEO}]
  collaborators text[] not null default '{}',
  scheduled_at timestamptz,
  status text not null default 'scheduled'
    check (status in ('queued', 'scheduled', 'publishing', 'processing', 'published', 'failed', 'canceled')),
  attempts integer not null default 0,
  result jsonb,
  error text,
  published_at timestamptz
);
create index if not exists social_posts_due_idx on public.social_posts (status, scheduled_at);
create index if not exists social_posts_draft_idx on public.social_posts (draft_id);

alter table public.social_posts enable row level security;
drop policy if exists social_posts_team on public.social_posts;
create policy social_posts_team on public.social_posts for all to authenticated using (true) with check (true);

-- 토큰: 정책 없음 = 팀 로그인·공개 키로는 읽을 수 없고 Edge Function(서비스 롤)만 읽고 갱신
create table if not exists public.social_tokens (
  platform text primary key,
  user_id text not null,
  username text,
  access_token text not null,
  refreshed_at timestamptz not null default now()
);
alter table public.social_tokens enable row level security;

-- 미디어 저장소: 공개 읽기(인스타·쓰레드 서버가 주소로 가져감) · 쓰기/삭제는 팀 로그인만
insert into storage.buckets (id, name, public, file_size_limit)
values ('social-media', 'social-media', true, 52428800)
on conflict (id) do update set public = true;

drop policy if exists social_media_insert on storage.objects;
create policy social_media_insert on storage.objects for insert to authenticated with check (bucket_id = 'social-media');
drop policy if exists social_media_update on storage.objects;
create policy social_media_update on storage.objects for update to authenticated using (bucket_id = 'social-media');
drop policy if exists social_media_delete on storage.objects;
create policy social_media_delete on storage.objects for delete to authenticated using (bucket_id = 'social-media');
drop policy if exists social_media_select on storage.objects;
create policy social_media_select on storage.objects for select to authenticated using (bucket_id = 'social-media');

-- 1분마다 예약 확인
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.unschedule(jobid) from cron.job where jobname = 'social-publish-due';
select cron.schedule('social-publish-due', '* * * * *', $job$
  select net.http_post(
    url := '{{PROJECT_URL}}/functions/v1/social-publish',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'social_cron_secret' limit 1)),
    body := '{"action":"due"}'::jsonb,
    timeout_milliseconds := 120000);
$job$);
