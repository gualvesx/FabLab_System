-- ═══════════════════════════════════════════════════════════════════
-- FabLab Platform — Patch restante (só o que ainda falta no seu banco)
-- Cole no Supabase Dashboard > SQL Editor > New Query e execute tudo.
-- ═══════════════════════════════════════════════════════════════════

-- 1. students.project_id — liga o aluno a um projeto do módulo
--    Projetos (ProjectsStudents.tsx / ProjectsAttendance.tsx).
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS students_project_id_idx ON public.students (project_id);

-- 2. attendance — sistema de presença por projeto/data (ProjectsAttendance.tsx).
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
-- Confira também (fora do SQL Editor):
--   • Storage > Buckets — precisa existir um bucket público chamado
--     "fablab-files" (usado pelo módulo de Arquivos). Se ainda não
--     existe, rode a parte 3 do fix_schema_gaps.sql anterior, ou crie
--     manualmente pelo Dashboard: Storage > New bucket > "fablab-files"
--     (marcar como Public).
-- ═══════════════════════════════════════════════════════════════════
