-- ================================================================
-- SESI FabLab · Plataforma Educacional — Schema v2025.3
-- Correções aplicadas:
--   • assessedBy → assessed_by (snake_case, sem aspas)
--   • date/time como tipos nativos (date, time, timestamptz)
--   • inventory_items com subcategory, unit_measure, location, min_stock
--   • user_classes para sistema de classes com permissões
--   • RLS remove TODAS as políticas existentes antes de recriar
--   • Trigger handle_new_user com security definer + set search_path
-- ================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ================================================================
-- FUNÇÃO AUXILIAR: atualiza updated_at
-- ================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- ================================================================
-- 1. CLASSES DE USUÁRIO (antes de users, pois users referencia)
-- ================================================================
create table if not exists public.user_classes (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  base_role   text        not null default 'professor'
                check (base_role in ('admin','professor','funcionario','student')),
  color       text        not null default '#2563eb',
  permissions jsonb       not null default '[]',
  -- permissions: [{"route":"/fablab/inventory","label":"...","allowed":true}]
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_user_classes_role on public.user_classes (base_role);

create trigger user_classes_updated_at
  before update on public.user_classes
  for each row execute procedure public.set_updated_at();

-- ================================================================
-- 2. USUÁRIOS
-- ================================================================
create table if not exists public.users (
  id          uuid        primary key references auth.users on delete cascade,
  name        text        not null default '',
  email       text        not null default '',
  role        text        not null default 'professor'
                check (role in ('admin','professor','funcionario','student')),
  class_id    uuid        references public.user_classes on delete set null,
  unit        text        not null default '',
  active      boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_users_role     on public.users (role);
create index if not exists idx_users_active   on public.users (active);
create index if not exists idx_users_class    on public.users (class_id);
create unique index if not exists idx_users_email
  on public.users (email) where email <> '';

create trigger users_updated_at
  before update on public.users
  for each row execute procedure public.set_updated_at();

-- Trigger: cria perfil automaticamente ao registrar
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name, role, unit, active)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data->>'name',
      split_part(coalesce(new.email, 'usuario'), '@', 1)
    ),
    coalesce(new.raw_user_meta_data->>'role', 'professor'),
    coalesce(new.raw_user_meta_data->>'unit', ''),
    true
  )
  on conflict (id) do update
    set email = excluded.email, updated_at = now()
    where public.users.email <> excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ================================================================
-- 3. INVENTÁRIO
-- Novos campos: subcategory, unit_measure, location, min_stock
-- ================================================================
create table if not exists public.inventory_items (
  id              uuid        primary key default gen_random_uuid(),
  name            text        not null,
  category        text        not null default 'Equipamento'
                    check (category in (
                      'Equipamento','Eletrônico','Ferramenta',
                      'Insumo','Material','Consumível','EPI','Outro'
                    )),
  subcategory     text        not null default '',
  quantity        integer     not null default 0  check (quantity >= 0),
  total           integer     not null default 1  check (total >= 0),
  unit_measure    text        not null default 'un',
  status          text        not null default 'in' check (status in ('in','out')),
  description     text        not null default '',
  location        text        not null default '',    -- localização física
  min_stock       integer     not null default 0  check (min_stock >= 0),
  last_action     text        not null default '',
  last_action_by  text        not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_inventory_category  on public.inventory_items (category);
create index if not exists idx_inventory_status    on public.inventory_items (status);
create index if not exists idx_inventory_name_trgm on public.inventory_items using gin (name gin_trgm_ops);

create trigger inventory_items_updated_at
  before update on public.inventory_items
  for each row execute procedure public.set_updated_at();

-- Movimentações
create table if not exists public.movements (
  id          uuid        primary key default gen_random_uuid(),
  item_id     uuid        references public.inventory_items on delete cascade,
  item_name   text        not null default '',
  action      text        not null check (action in ('entrada','saida')),
  quantity    integer     not null default 1 check (quantity > 0),
  responsible text        not null default '',
  notes       text        not null default '',
  moved_at    timestamptz not null default now()
);

create index if not exists idx_movements_item on public.movements (item_id, moved_at desc);
create index if not exists idx_movements_date on public.movements (moved_at desc);

-- ================================================================
-- 4. AGENDAMENTOS
-- ================================================================
create table if not exists public.schedules (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  date        date        not null,
  start_time  time,
  end_time    time,
  responsible text        not null default '',
  class_name  text        not null default '',
  notes       text        not null default '',
  status      text        not null default 'pendente'
                check (status in ('pendente','confirmado','concluido','cancelado','remarcado')),
  created_by  uuid        references public.users on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_schedules_date   on public.schedules (date, status);
create index if not exists idx_schedules_status on public.schedules (status);

create trigger schedules_updated_at
  before update on public.schedules
  for each row execute procedure public.set_updated_at();

create table if not exists public.schedule_materials (
  id              uuid        primary key default gen_random_uuid(),
  schedule_id     uuid        not null references public.schedules on delete cascade,
  item_id         uuid        references public.inventory_items on delete set null,
  item_name       text        not null,
  quantity_used   integer     not null default 1 check (quantity_used > 0),
  registered_by   text        not null default '',
  registered_at   timestamptz not null default now()
);

create index if not exists idx_sched_mat_schedule on public.schedule_materials (schedule_id);

-- ================================================================
-- 5. SUGESTÕES DE PROJETOS
-- ================================================================
create table if not exists public.suggestions (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  description text        not null default '',
  tags        text[]      not null default '{}',
  author      text        not null default '',
  author_id   uuid        references public.users on delete set null,
  votes       integer     not null default 0 check (votes >= 0),
  status      text        not null default 'open'
                check (status in ('open','approved','rejected')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_suggestions_status on public.suggestions (status);
create index if not exists idx_suggestions_votes  on public.suggestions (votes desc);

create trigger suggestions_updated_at
  before update on public.suggestions
  for each row execute procedure public.set_updated_at();

-- ================================================================
-- 6. PROJETOS MAKER
-- ================================================================
create table if not exists public.projects (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  description text        not null default '',
  type        text        not null default 'Outro',
  link        text        not null default '',
  author      text        not null default '',
  author_id   uuid        references public.users on delete set null,
  class_name  text        not null default '',
  tags        text[]      not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_projects_type       on public.projects (type);
create index if not exists idx_projects_created    on public.projects (created_at desc);
create index if not exists idx_projects_title_trgm on public.projects using gin (title gin_trgm_ops);

create trigger projects_updated_at
  before update on public.projects
  for each row execute procedure public.set_updated_at();

-- ================================================================
-- 7. BLOG
-- ================================================================
create table if not exists public.blog_posts (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  content     text        not null default '',
  cover_url   text        not null default '',
  tags        text[]      not null default '{}',
  author      text        not null default '',
  author_id   uuid        references public.users on delete set null,
  author_role text        not null default '',
  published   boolean     not null default false,
  views       integer     not null default 0 check (views >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_blog_published  on public.blog_posts (published, created_at desc);
create index if not exists idx_blog_author     on public.blog_posts (author_id);
create index if not exists idx_blog_tags       on public.blog_posts using gin (tags);
create index if not exists idx_blog_title_trgm on public.blog_posts using gin (title gin_trgm_ops);

create trigger blog_posts_updated_at
  before update on public.blog_posts
  for each row execute procedure public.set_updated_at();

-- ================================================================
-- 8. RELATÓRIOS
-- ================================================================
create table if not exists public.reports (
  id                uuid        primary key default gen_random_uuid(),
  type              text        not null check (type in ('daily','weekly','monthly')),
  period_start      date        not null,
  period_end        date        not null,
  total_schedules   integer     not null default 0,
  total_completed   integer     not null default 0,
  total_pending     integer     not null default 0,
  total_cancelled   integer     not null default 0,
  generated_by      text        not null default '',
  generated_by_id   uuid        references public.users on delete set null,
  generated_at      timestamptz not null default now(),
  summary           jsonb       not null default '{}'
);

create index if not exists idx_reports_type on public.reports (type, generated_at desc);

create table if not exists public.material_usage (
  id          uuid        primary key default gen_random_uuid(),
  item_id     uuid        references public.inventory_items on delete set null,
  item_name   text        not null,
  category    text        not null default '',
  total_used  integer     not null default 0 check (total_used >= 0),
  times_used  integer     not null default 0 check (times_used >= 0),
  last_used   timestamptz,
  updated_at  timestamptz not null default now()
);

-- ================================================================
-- 9. ALTAS HABILIDADES — ALUNOS
-- ================================================================
create table if not exists public.students (
  id                  uuid        primary key default gen_random_uuid(),
  name                text        not null,
  birth_date          date,
  grade               text        not null default '',
  school              text        not null default '',
  status              text        not null default 'identificado'
                        check (status in ('identificado','em_avaliacao','monitoramento','concluido')),
  responsible_name    text        not null default '',
  responsible_contact text        not null default '',
  primary_areas       text[]      not null default '{}',
  notes               text        not null default '',
  identified_at       date,
  identified_by       text        not null default '',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_students_status    on public.students (status);
create index if not exists idx_students_name_trgm on public.students using gin (name gin_trgm_ops);

create trigger students_updated_at
  before update on public.students
  for each row execute procedure public.set_updated_at();

create table if not exists public.gifted_grades (
  id          uuid            primary key default gen_random_uuid(),
  student_id  uuid            not null references public.students on delete cascade,
  subject     text            not null,
  grade       numeric(4,2)    not null check (grade between 0 and 10),
  period      text            not null default '',
  date        date,
  notes       text            not null default '',
  created_at  timestamptz     not null default now()
);

create index if not exists idx_grades_student on public.gifted_grades (student_id, created_at desc);

-- CORRIGIDO: assessed_by (era "assessedBy" com aspas duplas)
create table if not exists public.gifted_skills (
  id          uuid        primary key default gen_random_uuid(),
  student_id  uuid        not null references public.students on delete cascade,
  area        text        not null,
  score       integer     not null default 0 check (score between 0 and 100),
  assessed_by text        not null default '',
  date        date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (student_id, area)
);

create index if not exists idx_skills_student on public.gifted_skills (student_id);

create trigger gifted_skills_updated_at
  before update on public.gifted_skills
  for each row execute procedure public.set_updated_at();

create table if not exists public.gifted_developments (
  id          uuid        primary key default gen_random_uuid(),
  student_id  uuid        not null references public.students on delete cascade,
  date        date,
  title       text        not null,
  description text        not null default '',
  category    text        not null default 'academico'
                check (category in ('academico','social','criativo','comportamental','atividade')),
  author      text        not null default '',
  created_at  timestamptz not null default now()
);

create index if not exists idx_developments_student on public.gifted_developments (student_id, created_at desc);

create table if not exists public.gifted_achievements (
  id          uuid        primary key default gen_random_uuid(),
  student_id  uuid        not null references public.students on delete cascade,
  title       text        not null,
  description text        not null default '',
  date        date,
  type        text        not null default 'outro'
                check (type in ('olimpiada','projeto','reconhecimento','publicacao','outro')),
  created_at  timestamptz not null default now()
);

create index if not exists idx_achievements_student on public.gifted_achievements (student_id, created_at desc);

-- ================================================================
-- 10. QUIZZES
-- ================================================================
create table if not exists public.quizzes (
  id                  uuid        primary key default gen_random_uuid(),
  title               text        not null,
  description         text        not null default '',
  subject             text        not null default '',
  time_limit          integer     not null default 30 check (time_limit > 0),
  status              text        not null default 'draft'
                        check (status in ('draft','published')),
  questions           jsonb       not null default '[]',
  assigned_students   text[]      not null default '{}',
  created_by          text        not null default '',
  created_by_id       uuid        references public.users on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_quizzes_status  on public.quizzes (status, created_at desc);

create trigger quizzes_updated_at
  before update on public.quizzes
  for each row execute procedure public.set_updated_at();

create table if not exists public.quiz_results (
  id            uuid        primary key default gen_random_uuid(),
  quiz_id       uuid        not null references public.quizzes on delete cascade,
  student_id    text        not null,
  student_uuid  uuid        references public.students on delete cascade,
  score         integer     not null default 0 check (score >= 0),
  max_score     integer     not null default 0 check (max_score >= 0),
  answers       jsonb       not null default '[]',
  completed_at  timestamptz not null default now(),
  time_taken    integer     not null default 0 check (time_taken >= 0)
);

create index if not exists idx_results_quiz    on public.quiz_results (quiz_id);
create index if not exists idx_results_student on public.quiz_results (student_id);

-- ================================================================
-- 11. PROPOSTAS DE TRABALHO
-- ================================================================
create table if not exists public.work_proposals (
  id                uuid        primary key default gen_random_uuid(),
  student_id        text        not null,
  student_uuid      uuid        references public.students on delete cascade,
  title             text        not null,
  description       text        not null default '',
  objectives        text        not null default '',
  methodology       text        not null default '',
  expected_results  text        not null default '',
  timeline          text        not null default '',
  status            text        not null default 'submitted'
                      check (status in ('submitted','under_review','approved','in_progress','completed')),
  feedback          text        not null default '',
  reviewed_by       uuid        references public.users on delete set null,
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_proposals_student on public.work_proposals (student_id);
create index if not exists idx_proposals_status  on public.work_proposals (status);

create trigger proposals_updated_at
  before update on public.work_proposals
  for each row execute procedure public.set_updated_at();

-- ================================================================
-- ROW LEVEL SECURITY
-- Remove TODAS as políticas existentes antes de recriar (idempotente)
-- ================================================================
do $$
declare
  tbl text;
  pol record;
  tbls text[] := array[
    'user_classes','users',
    'inventory_items','movements',
    'schedules','schedule_materials',
    'suggestions','projects','blog_posts',
    'reports','material_usage',
    'students','gifted_grades','gifted_skills',
    'gifted_developments','gifted_achievements',
    'quizzes','quiz_results','work_proposals'
  ];
begin
  foreach tbl in array tbls loop
    execute format('alter table public.%I enable row level security;', tbl);
    for pol in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = tbl
    loop
      execute format('drop policy if exists %I on public.%I;', pol.policyname, tbl);
    end loop;
    execute format(
      'create policy "auth_all" on public.%I for all to authenticated using (true) with check (true);',
      tbl
    );
  end loop;
end $$;

-- Leitura pública de posts publicados
create policy "anon_read_published"
  on public.blog_posts for select to anon using (published = true);

-- ================================================================
-- VIEWS ÚTEIS
-- ================================================================
create or replace view public.v_schedule_summary as
select
  status,
  count(*)                                                                as total,
  count(*) filter (where date = current_date)                             as today,
  count(*) filter (where date >= date_trunc('week', current_date)::date
                    and date <  (date_trunc('week', current_date) + interval '7 days')::date) as this_week
from public.schedules group by status;

create or replace view public.v_inventory_critical as
select id, name, category, subcategory, quantity, total, unit_measure, location,
  round(case when total > 0 then quantity::numeric/total*100 else 0 end, 1) as pct_remaining
from public.inventory_items
where total > 0 and quantity::numeric/total < 0.3
order by pct_remaining;

create or replace view public.v_student_grade_avg as
select s.id, s.name, s.grade as class, s.school, s.status,
  round(coalesce(avg(g.grade), 0), 2) as avg_grade,
  count(g.id) as grade_count
from public.students s
left join public.gifted_grades g on g.student_id = s.id
group by s.id, s.name, s.grade, s.school, s.status
order by avg_grade desc;

create or replace view public.v_blog_top as
select id, title, author, tags, views, created_at
from public.blog_posts where published = true
order by views desc, created_at desc limit 10;

-- ================================================================
-- DADOS INICIAIS — Classes padrão
-- ================================================================
insert into public.user_classes (name, base_role, color, permissions)
values
  ('Administrador', 'admin',       '#D42020', '[
    {"route":"/fablab/home","label":"FabLab · Início","allowed":true},
    {"route":"/fablab/dashboard","label":"FabLab · Dashboard","allowed":true},
    {"route":"/fablab/inventory","label":"FabLab · Inventário","allowed":true},
    {"route":"/fablab/schedule","label":"FabLab · Agendamentos","allowed":true},
    {"route":"/fablab/suggestions","label":"FabLab · Sugestões","allowed":true},
    {"route":"/fablab/projects","label":"FabLab · Projetos","allowed":true},
    {"route":"/fablab/blog","label":"FabLab · Blog","allowed":true},
    {"route":"/fablab/reports","label":"FabLab · Relatórios","allowed":true},
    {"route":"/fablab/users","label":"FabLab · Usuários","allowed":true},
    {"route":"/gifted/home","label":"Altas Hab. · Início","allowed":true},
    {"route":"/gifted/dashboard","label":"Altas Hab. · Dashboard","allowed":true},
    {"route":"/gifted/students","label":"Altas Hab. · Alunos","allowed":true},
    {"route":"/gifted/quiz-creator","label":"Altas Hab. · Quiz","allowed":true}
  ]'::jsonb),
  ('Professor',     'professor',   '#2563eb', '[
    {"route":"/fablab/home","label":"FabLab · Início","allowed":true},
    {"route":"/fablab/dashboard","label":"FabLab · Dashboard","allowed":false},
    {"route":"/fablab/inventory","label":"FabLab · Inventário","allowed":true},
    {"route":"/fablab/schedule","label":"FabLab · Agendamentos","allowed":true},
    {"route":"/fablab/suggestions","label":"FabLab · Sugestões","allowed":true},
    {"route":"/fablab/projects","label":"FabLab · Projetos","allowed":true},
    {"route":"/fablab/blog","label":"FabLab · Blog","allowed":true},
    {"route":"/fablab/reports","label":"FabLab · Relatórios","allowed":true},
    {"route":"/fablab/users","label":"FabLab · Usuários","allowed":false},
    {"route":"/gifted/home","label":"Altas Hab. · Início","allowed":true},
    {"route":"/gifted/dashboard","label":"Altas Hab. · Dashboard","allowed":true},
    {"route":"/gifted/students","label":"Altas Hab. · Alunos","allowed":true},
    {"route":"/gifted/quiz-creator","label":"Altas Hab. · Quiz","allowed":true}
  ]'::jsonb),
  ('Funcionário',   'funcionario', '#059669', '[
    {"route":"/fablab/home","label":"FabLab · Início","allowed":true},
    {"route":"/fablab/dashboard","label":"FabLab · Dashboard","allowed":false},
    {"route":"/fablab/inventory","label":"FabLab · Inventário","allowed":true},
    {"route":"/fablab/schedule","label":"FabLab · Agendamentos","allowed":true},
    {"route":"/fablab/suggestions","label":"FabLab · Sugestões","allowed":false},
    {"route":"/fablab/projects","label":"FabLab · Projetos","allowed":false},
    {"route":"/fablab/blog","label":"FabLab · Blog","allowed":true},
    {"route":"/fablab/reports","label":"FabLab · Relatórios","allowed":false},
    {"route":"/fablab/users","label":"FabLab · Usuários","allowed":false},
    {"route":"/gifted/home","label":"Altas Hab. · Início","allowed":false},
    {"route":"/gifted/dashboard","label":"Altas Hab. · Dashboard","allowed":false},
    {"route":"/gifted/students","label":"Altas Hab. · Alunos","allowed":false},
    {"route":"/gifted/quiz-creator","label":"Altas Hab. · Quiz","allowed":false}
  ]'::jsonb),
  ('Aluno',         'student',     '#7c3aed', '[
    {"route":"/fablab/home","label":"FabLab · Início","allowed":false},
    {"route":"/fablab/dashboard","label":"FabLab · Dashboard","allowed":false},
    {"route":"/fablab/inventory","label":"FabLab · Inventário","allowed":false},
    {"route":"/fablab/schedule","label":"FabLab · Agendamentos","allowed":false},
    {"route":"/fablab/suggestions","label":"FabLab · Sugestões","allowed":false},
    {"route":"/fablab/projects","label":"FabLab · Projetos","allowed":false},
    {"route":"/fablab/blog","label":"FabLab · Blog","allowed":true},
    {"route":"/fablab/reports","label":"FabLab · Relatórios","allowed":false},
    {"route":"/fablab/users","label":"FabLab · Usuários","allowed":false},
    {"route":"/gifted/home","label":"Altas Hab. · Início","allowed":false},
    {"route":"/gifted/dashboard","label":"Altas Hab. · Dashboard","allowed":false},
    {"route":"/gifted/students","label":"Altas Hab. · Alunos","allowed":false},
    {"route":"/gifted/quiz-creator","label":"Altas Hab. · Quiz","allowed":false},
    {"route":"/student/quiz","label":"Aluno · Quiz","allowed":true},
    {"route":"/student/grades","label":"Aluno · Notas","allowed":true},
    {"route":"/student/proposal","label":"Aluno · Proposta","allowed":true}
  ]'::jsonb)
on conflict do nothing;

-- ================================================================
-- SCRIPT DE RESET (dev only — descomente para usar)
-- ================================================================
/*
drop view  if exists public.v_blog_top, public.v_student_grade_avg,
                     public.v_inventory_critical, public.v_schedule_summary cascade;
drop table if exists
  public.work_proposals, public.quiz_results, public.quizzes,
  public.gifted_achievements, public.gifted_developments,
  public.gifted_skills, public.gifted_grades, public.students,
  public.material_usage, public.reports, public.blog_posts,
  public.projects, public.suggestions, public.schedule_materials,
  public.schedules, public.movements, public.inventory_items,
  public.users, public.user_classes cascade;
drop function if exists public.handle_new_user, public.set_updated_at cascade;
*/

select 'Schema SESI FabLab v2025.3 aplicado com sucesso!' as resultado;
