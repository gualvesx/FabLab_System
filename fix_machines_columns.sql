-- ═══════════════════════════════════════════════════════════════════
-- FabLab Platform — Ajuste da tabela `machines` para bater com o
-- componente FabMachinery.tsx (que até agora só usava localStorage).
-- Cole no SQL Editor do Supabase e execute.
-- ═══════════════════════════════════════════════════════════════════

-- O componente usa "category" (não "type") e guarda os eventos
-- agendados (limpeza/manutenção) dentro da própria máquina.
ALTER TABLE public.machines
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'Outro',
  ADD COLUMN IF NOT EXISTS scheduled_events jsonb NOT NULL DEFAULT '[]';

-- O componente usa 5 status (operacional, manutencao, limpeza,
-- aguardando_peca, inativo) — a constraint criada antes só previa 3
-- e usava "inativa" em vez de "inativo". Substituindo:
ALTER TABLE public.machines DROP CONSTRAINT IF EXISTS machines_status_check;
ALTER TABLE public.machines
  ADD CONSTRAINT machines_status_check
  CHECK (status = ANY (ARRAY['operacional'::text, 'manutencao'::text, 'limpeza'::text, 'aguardando_peca'::text, 'inativo'::text]));

ALTER TABLE public.machines ALTER COLUMN status SET DEFAULT 'operacional';

-- Reaproveita/atualiza dados que já estejam com o valor antigo "inativa"
UPDATE public.machines SET status = 'inativo' WHERE status = 'inativa';
