-- 플래너 동기화 표. Supabase SQL Editor에서 한 번 실행합니다.
-- 출석·문자·신청서는 이 표를 쓰지 않습니다.
--
-- 팀 로그인
-- 1. Authentication에서 팀 계정 하나를 만듭니다.
-- 2. 주소와 공개 키(anon)만 planner-sync-config.js에 넣습니다. 서비스 롤 키는 넣지 않습니다.
-- 3. 로그인한 사용자만 표를 읽고 씁니다. 로그인 전에는 플래너가 이 기기 저장만 사용합니다.
-- 4. 가장 최신인 기기 하나에서만 「이 기기 내용 넣기」를 누릅니다. 표에 줄이 있으면 넣기는 거절됩니다.

create sequence if not exists planner_entity_change_seq;

create table if not exists public.planner_entities (
  key text primary key,
  value jsonb,
  revision integer not null default 0,
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  mutation_id text,
  change_seq bigint not null default nextval('planner_entity_change_seq')
);

create index if not exists planner_entities_change_seq_idx
  on public.planner_entities (change_seq);

alter table public.planner_entities enable row level security;

drop policy if exists planner_entities_team on public.planner_entities;
create policy planner_entities_team
  on public.planner_entities
  for all
  to authenticated
  using (true)
  with check (true);

create or replace function public.planner_apply_mutation(
  p_key text,
  p_value jsonb,
  p_deleted boolean,
  p_base_revision integer,
  p_mutation_id text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.planner_entities%rowtype;
  next_rev integer;
  seq bigint;
begin
  if auth.uid() is null then
    return jsonb_build_object('status', 'error', 'message', 'login required', 'key', p_key);
  end if;
  if p_key is null or length(btrim(p_key)) = 0 then
    return jsonb_build_object('status', 'error', 'message', 'empty key');
  end if;
  if p_base_revision is null or p_base_revision < 0 then
    p_base_revision := 0;
  end if;
  if p_deleted then
    p_value := null;
  end if;

  select * into row from public.planner_entities where key = p_key for update;

  if found and row.mutation_id is not null and row.mutation_id = p_mutation_id and length(p_mutation_id) > 0 then
    return jsonb_build_object(
      'status', 'idempotent',
      'key', p_key,
      'mutationId', p_mutation_id,
      'revision', row.revision,
      'changeSeq', row.change_seq
    );
  end if;

  if found and (
    row.revision = p_base_revision
    or (row.deleted is not distinct from coalesce(p_deleted, false) and row.value is not distinct from p_value)
  ) then
    next_rev := row.revision + 1;
    update public.planner_entities
      set value = p_value,
          deleted = coalesce(p_deleted, false),
          revision = next_rev,
          updated_at = now(),
          mutation_id = nullif(p_mutation_id, ''),
          change_seq = nextval('planner_entity_change_seq')
      where key = p_key
      returning revision, change_seq into next_rev, seq;
    return jsonb_build_object(
      'status', 'ok',
      'key', p_key,
      'mutationId', p_mutation_id,
      'revision', next_rev,
      'changeSeq', seq
    );
  end if;

  if not found and p_base_revision = 0 then
    insert into public.planner_entities (key, value, revision, deleted, updated_at, mutation_id)
    values (p_key, p_value, 1, coalesce(p_deleted, false), now(), nullif(p_mutation_id, ''))
    returning revision, change_seq into next_rev, seq;
    return jsonb_build_object(
      'status', 'ok',
      'key', p_key,
      'mutationId', p_mutation_id,
      'revision', next_rev,
      'changeSeq', seq
    );
  end if;

  return jsonb_build_object(
    'status', 'conflict',
    'key', p_key,
    'mutationId', p_mutation_id,
    'revision', case when found then row.revision else 0 end,
    'value', case when found then row.value else null end,
    'deleted', case when found then row.deleted else true end,
    'updatedAt', case when found then row.updated_at else null end
  );
end;
$$;

create or replace function public.planner_apply_batch(p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  one jsonb;
  accepted jsonb := '[]'::jsonb;
  conflicts jsonb := '[]'::jsonb;
  seq bigint;
begin
  if auth.uid() is null then
    return jsonb_build_object('result', 'error', 'message', '팀 로그인이 필요합니다.');
  end if;
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    return jsonb_build_object('result', 'error', 'message', '항목이 없습니다.');
  end if;

  for item in select * from jsonb_array_elements(p_rows)
  loop
    one := public.planner_apply_mutation(
      item->>'key',
      case when coalesce((item->>'deleted')::boolean, false) then null else item->'value' end,
      coalesce((item->>'deleted')::boolean, false),
      coalesce((item->>'baseEntityRevision')::int, 0),
      coalesce(item->>'mutationId', '')
    );
    if one->>'status' = 'conflict' then
      conflicts := conflicts || jsonb_build_array(one);
    elsif one->>'status' = 'ok' or one->>'status' = 'idempotent' then
      accepted := accepted || jsonb_build_array(one);
    else
      return jsonb_build_object('result', 'error', 'message', coalesce(one->>'message', '저장 실패'), 'key', one->>'key');
    end if;
  end loop;

  select max(change_seq) into seq from public.planner_entities;
  return jsonb_build_object(
    'result', case when jsonb_array_length(conflicts) > 0 then 'partial' else 'success' end,
    'accepted', accepted,
    'conflicts', conflicts,
    'changeSeq', coalesce(seq, 0)
  );
end;
$$;

create or replace function public.planner_import_batch(p_rows jsonb, p_continue boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  k text;
  n integer := 0;
  seq bigint;
begin
  if auth.uid() is null then
    return jsonb_build_object('result', 'error', 'message', '팀 로그인이 필요합니다.');
  end if;
  perform pg_advisory_xact_lock(481201);
  if not coalesce(p_continue, false) and exists (select 1 from public.planner_entities) then
    return jsonb_build_object('result', 'error', 'message', '이미 사용 중인 표입니다. 넣기는 빈 표에서 한 번만 합니다.');
  end if;
  if coalesce(p_continue, false) and exists (
    select 1 from public.planner_entities
    where coalesce(mutation_id, '') not like 'import:%'
  ) then
    return jsonb_build_object('result', 'error', 'message', '이미 사용 중인 표입니다. 넣기는 빈 표에서 한 번만 합니다.');
  end if;
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    return jsonb_build_object('result', 'error', 'message', '넣을 항목이 없습니다.');
  end if;

  for item in select * from jsonb_array_elements(p_rows)
  loop
    k := item->>'key';
    if k is null or length(btrim(k)) = 0 then
      continue;
    end if;
    insert into public.planner_entities (key, value, revision, deleted, updated_at, mutation_id)
    values (
      k,
      case when coalesce((item->>'deleted')::boolean, false) then null else item->'value' end,
      1,
      coalesce((item->>'deleted')::boolean, false),
      now(),
      'import:' || k
    )
    on conflict (key) do nothing;
    n := n + 1;
  end loop;

  select max(change_seq) into seq from public.planner_entities;
  return jsonb_build_object('result', 'success', 'imported', n, 'changeSeq', coalesce(seq, 0));
end;
$$;

revoke all on function public.planner_apply_mutation(text, jsonb, boolean, integer, text) from public;
revoke all on function public.planner_apply_batch(jsonb) from public;
revoke all on function public.planner_import_batch(jsonb, boolean) from public;
grant execute on function public.planner_apply_mutation(text, jsonb, boolean, integer, text) to authenticated;
grant execute on function public.planner_apply_batch(jsonb) to authenticated;
grant execute on function public.planner_import_batch(jsonb, boolean) to authenticated;
