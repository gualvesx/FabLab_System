-- ═══════════════════════════════════════════════════════════════════
-- FabLab Platform — Patch de correção de schema
-- Cole no Supabase Dashboard > SQL Editor > New Query e execute tudo.
-- Gerado a partir da comparação entre o schema real (live) e o que o
-- código do front-end efetivamente lê/grava.
-- ═══════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────
-- 1. projects.status — ProjectsManage.tsx grava esse campo, mas a
--    coluna não existe. Sem isso, TODO salvamento de projeto falha.
-- ───────────────────────────────────────────────────────────────────
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ativo'
    CHECK (status = ANY (ARRAY['ativo'::text, 'concluido'::text, 'arquivado'::text]));

-- ───────────────────────────────────────────────────────────────────
-- 2. suggestions.suggestion_type / suggestions.category —
--    FabSuggestions.tsx grava os dois, nenhum existe. Sem isso, TODO
--    salvamento de sugestão falha.
-- ───────────────────────────────────────────────────────────────────
ALTER TABLE public.suggestions
  ADD COLUMN IF NOT EXISTS suggestion_type text NOT NULL DEFAULT 'geral'
    CHECK (suggestion_type = ANY (ARRAY['geral'::text, 'melhoria'::text, 'problema'::text])),
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'Outro';

-- ───────────────────────────────────────────────────────────────────
-- 3. fablab_files — tabela usada por FabFiles.tsx e que não existe
--    no banco ainda. (Idêntica ao que já está em supabase_setup.sql
--    do seu projeto — incluída aqui de novo por completude.)
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fablab_files (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  description   text DEFAULT '',
  category      text NOT NULL DEFAULT 'outro'
                CHECK (category IN ('stl','gcode','svg','dxf','3mf','glb','image','outro')),
  tags          text[]       DEFAULT '{}',
  gallery       text[]       DEFAULT '{}',
  file_name     text NOT NULL DEFAULT '',
  file_url      text NOT NULL DEFAULT '',
  storage_path  text NOT NULL DEFAULT '',
  size_bytes    bigint       DEFAULT 0,
  compressed    boolean      DEFAULT false,
  published     boolean      DEFAULT false,
  uploaded_by   text NOT NULL DEFAULT '',
  author_role   text         DEFAULT '',
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now(),
  project_id    uuid REFERENCES public.projects(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS fablab_files_category_idx  ON public.fablab_files (category);
CREATE INDEX IF NOT EXISTS fablab_files_published_idx ON public.fablab_files (published);
CREATE INDEX IF NOT EXISTS fablab_files_created_idx   ON public.fablab_files (created_at DESC);
CREATE INDEX IF NOT EXISTS fablab_files_tags_idx      ON public.fablab_files USING gin (tags);

ALTER TABLE public.fablab_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fablab_files_select" ON public.fablab_files;
CREATE POLICY "fablab_files_select" ON public.fablab_files FOR SELECT
  USING (
    published = true
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','professor'))
  );

DROP POLICY IF EXISTS "fablab_files_insert" ON public.fablab_files;
CREATE POLICY "fablab_files_insert" ON public.fablab_files FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "fablab_files_update" ON public.fablab_files;
CREATE POLICY "fablab_files_update" ON public.fablab_files FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','professor')));

DROP POLICY IF EXISTS "fablab_files_delete" ON public.fablab_files;
CREATE POLICY "fablab_files_delete" ON public.fablab_files FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','professor')));

-- Storage bucket para os arquivos (STL, gcode, imagens etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fablab-files', 'fablab-files', true, 104857600,
  ARRAY[
    'model/stl','model/gltf-binary','model/gltf+json',
    'application/octet-stream',
    'image/svg+xml','image/png','image/jpeg','image/webp','image/gif',
    'application/gzip','application/zip','application/pdf'
  ]
) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "fabfiles_storage_select" ON storage.objects;
CREATE POLICY "fabfiles_storage_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'fablab-files');

DROP POLICY IF EXISTS "fabfiles_storage_insert" ON storage.objects;
CREATE POLICY "fabfiles_storage_insert" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'fablab-files');

DROP POLICY IF EXISTS "fabfiles_storage_delete" ON storage.objects;
CREATE POLICY "fabfiles_storage_delete" ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'fablab-files'
    AND EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','professor'))
  );

-- ───────────────────────────────────────────────────────────────────
-- 4. machines + maintenance_tickets — hoje só existem em localStorage
--    (FabMachinery.tsx / FabMaintenance.tsx). Criando aqui para quem
--    quiser migrar esses módulos para o banco (não é usado ainda pelo
--    front-end — precisa trocar o localStorage por chamadas supabase
--    nesses dois arquivos para passar a valer).
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.machines (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  type          text NOT NULL DEFAULT '',
  location      text NOT NULL DEFAULT '',
  status        text NOT NULL DEFAULT 'operacional'
                CHECK (status IN ('operacional','manutencao','inativa')),
  brand         text DEFAULT '',
  model         text DEFAULT '',
  serial_number text DEFAULT '',
  acquired_at   date,
  last_maintenance date,
  notes         text DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "machines_select" ON public.machines;
CREATE POLICY "machines_select" ON public.machines FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "machines_write" ON public.machines;
CREATE POLICY "machines_write" ON public.machines FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','professor')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','professor')));

-- Nota: a versão desse rascunho em supabase_setup.sql referenciava
-- "public.inventory(id)", tabela que não existe — corrigido abaixo
-- para "public.inventory_items(id)".
CREATE TABLE IF NOT EXISTS public.maintenance_tickets (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id        uuid REFERENCES public.machines(id) ON DELETE SET NULL,
  machine_name      text NOT NULL,
  machine_location  text DEFAULT '',
  problem           text NOT NULL,
  priority          text NOT NULL DEFAULT 'media'
                    CHECK (priority IN ('baixa','media','alta','critica')),
  status            text NOT NULL DEFAULT 'aberto'
                    CHECK (status IN ('aberto','em_andamento','aguardando_peca','resolvido')),
  reported_by       text NOT NULL,
  assigned_to       text DEFAULT '',
  opened_at         timestamptz NOT NULL DEFAULT now(),
  resolved_at       timestamptz,
  logs              jsonb NOT NULL DEFAULT '[]',
  inventory_item_id uuid REFERENCES public.inventory_items(id) ON DELETE SET NULL
);

ALTER TABLE public.maintenance_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "maint_select" ON public.maintenance_tickets;
CREATE POLICY "maint_select" ON public.maintenance_tickets FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "maint_insert" ON public.maintenance_tickets;
CREATE POLICY "maint_insert" ON public.maintenance_tickets FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "maint_update" ON public.maintenance_tickets;
CREATE POLICY "maint_update" ON public.maintenance_tickets FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','professor')));
DROP POLICY IF EXISTS "maint_delete" ON public.maintenance_tickets;
CREATE POLICY "maint_delete" ON public.maintenance_tickets FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','professor')));

-- ───────────────────────────────────────────────────────────────────
-- 5. students.project_id — liga o aluno a um projeto do módulo
--    Projetos (ProjectsStudents.tsx). Não existia na tabela ainda.
--    SEM ISSO: os alunos cadastrados/filtrados por projeto não
--    ficam salvos vinculados a nenhum projeto.
-- ───────────────────────────────────────────────────────────────────
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS students_project_id_idx ON public.students (project_id);

-- ───────────────────────────────────────────────────────────────────
-- 6. attendance — novo sistema de presença por projeto/data.
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attendance (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  project_id  uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  date        date NOT NULL DEFAULT CURRENT_DATE,
  status      text NOT NULL DEFAULT 'presente'
              CHECK (status = ANY (ARRAY['presente'::text, 'falta'::text, 'justificada'::text])),
  notes       text NOT NULL DEFAULT '',
  registered_by text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, date)
);

CREATE INDEX IF NOT EXISTS attendance_date_idx       ON public.attendance (date);
CREATE INDEX IF NOT EXISTS attendance_project_id_idx ON public.attendance (project_id);
CREATE INDEX IF NOT EXISTS attendance_student_id_idx ON public.attendance (student_id);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attendance_select" ON public.attendance;
CREATE POLICY "attendance_select" ON public.attendance FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "attendance_write" ON public.attendance;
CREATE POLICY "attendance_write" ON public.attendance FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','professor','funcionario')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','professor','funcionario')));

-- ═══════════════════════════════════════════════════════════════════
-- Fim do patch.
--
-- Itens NÃO incluídos aqui (schema existe, mas não é lido/escrito
-- pelo front-end hoje — não bloqueiam nada, ficam como observação):
--   • fablabs          → mapa público usa lista fixa no código-fonte
--   • access_requests  → não há tela de aprovação de acesso no app
--   • reports / material_usage → só lidos (SELECT); nada no front-end
--     grava neles. Precisam de trigger/cron/edge function para serem
--     populados, senão a página de Relatórios fica sempre vazia.
-- ═══════════════════════════════════════════════════════════════════
