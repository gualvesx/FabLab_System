/**
 * ProjectsAttendance.tsx — FabLab Platform · Módulo Projetos
 * Sistema de presença: marca presença/falta/justificada por aluno e data,
 * opcionalmente filtrado por projeto. Persiste em `public.attendance`.
 */
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, X, FileText, Calendar, Save, FolderKanban, ArrowLeft, Users, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageTransition } from '@/components/layout/PageTransition';
import { useStudentStore } from '@/stores/studentStore';
import { useAttendanceStore } from '@/stores/attendanceStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import type { Attendance } from '@/types';

interface ProjectOption { id: string; title: string; }

const STATUS_CONFIG = {
  presente:    { label: 'Presente',    icon: Check,    color: '#059669', bg: 'rgba(5,150,105,0.12)' },
  falta:       { label: 'Falta',       icon: X,        color: '#DC2626', bg: 'rgba(220,38,38,0.12)' },
  justificada: { label: 'Justificada', icon: FileText, color: '#D97706', bg: 'rgba(217,119,6,0.12)' },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export function ProjectsAttendance() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const urlProjectId = searchParams.get('project') || '';

  const { students, fetchStudents } = useStudentStore();
  const { records, fetchByDate, markBulk, deleteAttendance, loading } = useAttendanceStore();

  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectId, setProjectId] = useState(urlProjectId);
  const [date, setDate] = useState(todayISO());
  const [draft, setDraft] = useState<Record<string, StatusKey>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { fetchStudents(); }, []);
  useEffect(() => {
    supabase.from('projects').select('id, title').order('title').then(({ data }) => {
      if (data) setProjects(data as ProjectOption[]);
    });
  }, []);
  useEffect(() => { fetchByDate(date, projectId || undefined); }, [date, projectId]);

  const currentProject = projects.find(p => p.id === projectId);

  const scopedStudents = useMemo(
    () => students.filter(s => !projectId || s.project_id === projectId),
    [students, projectId]
  );

  // Ao trocar de data/turma, sincroniza o rascunho com o que já está salvo
  useEffect(() => {
    const next: Record<string, StatusKey> = {};
    records.forEach(r => { next[r.student_id] = r.status as StatusKey; });
    setDraft(next);
    setSaved(false);
  }, [records]);

  const setStatus = (studentId: string, status: StatusKey) => {
    setDraft(p => ({ ...p, [studentId]: status }));
    setSaved(false);
  };

  const markAllPresent = () => {
    const next: Record<string, StatusKey> = {};
    scopedStudents.forEach(s => { next[s.id] = 'presente'; });
    setDraft(next);
    setSaved(false);
  };

  const handleSave = async () => {
    const payload = scopedStudents
      .filter(s => draft[s.id])
      .map(s => ({
        student_id: s.id,
        project_id: projectId || undefined,
        date,
        status: draft[s.id],
        notes: '',
        registered_by: user?.name || '',
      }));
    if (payload.length === 0) return;
    setSaving(true);
    await markBulk(payload as Omit<Attendance, 'id' | 'created_at' | 'updated_at'>[]);
    setSaving(false);
    setSaved(true);
  };

  const counts = useMemo(() => {
    const c = { presente: 0, falta: 0, justificada: 0, unmarked: 0 };
    scopedStudents.forEach(s => {
      const st = draft[s.id];
      if (st) c[st]++; else c.unmarked++;
    });
    return c;
  }, [scopedStudents, draft]);

  return (
    <PageTransition>
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          {currentProject && (
            <button onClick={() => navigate('/projects/manage')} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-1.5">
              <ArrowLeft size={12} /> <FolderKanban size={12} /> {currentProject.title}
            </button>
          )}
          <h1 className="text-xl font-extrabold">{t('attendance.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('attendance.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="pl-8 h-9 w-40 text-sm" />
          </div>
          <Select value={projectId || 'all'} onValueChange={v => setProjectId(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9 w-52 text-sm"><SelectValue placeholder={t('gifted.allProjects')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('gifted.allProjects')}</SelectItem>
              {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Resumo do dia */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {(Object.keys(STATUS_CONFIG) as StatusKey[]).map(k => {
          const cfg = STATUS_CONFIG[k];
          return (
            <div key={k} className="bg-card border border-border rounded-xl p-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg, color: cfg.color }}>
                <cfg.icon size={15} />
              </div>
              <div>
                <div className="text-lg font-extrabold leading-none">{counts[k]}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{cfg.label}</div>
              </div>
            </div>
          );
        })}
        <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-muted text-muted-foreground">
            <Users size={15} />
          </div>
          <div>
            <div className="text-lg font-extrabold leading-none">{counts.unmarked}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('attendance.unmarked')}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <Button size="sm" variant="outline" onClick={markAllPresent}>{t('attendance.markAllPresent')}</Button>
        <Button size="sm" onClick={handleSave} disabled={saving || scopedStudents.length === 0}>
          <Save size={14} className="mr-1.5" />
          {saving ? t('app.loading') : saved ? t('attendance.saved') : t('attendance.save')}
        </Button>
      </div>

      {/* Lista de alunos */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <div className="w-5 h-5 border-2 border-border border-t-green-500 rounded-full animate-spin" />
          {t('app.loading')}
        </div>
      ) : scopedStudents.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users size={40} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium">{t('attendance.noStudents')}</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
          {scopedStudents.map(s => {
            const current = draft[s.id];
            return (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {s.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.grade}</div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  {(Object.keys(STATUS_CONFIG) as StatusKey[]).map(k => {
                    const cfg = STATUS_CONFIG[k];
                    const active = current === k;
                    return (
                      <button
                        key={k}
                        title={cfg.label}
                        onClick={() => setStatus(s.id, k)}
                        className={cn('w-8 h-8 rounded-lg flex items-center justify-center border transition-all')}
                        style={active
                          ? { background: cfg.color, borderColor: cfg.color, color: '#fff' }
                          : { borderColor: 'var(--border)', color: 'var(--text-secondary)' }
                        }
                      >
                        <cfg.icon size={14} />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Histórico recente do dia (registros já salvos) */}
      {records.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2">{t('attendance.history')}</h2>
          <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
            {records.map(r => {
              const s = students.find(st => st.id === r.student_id);
              const cfg = STATUS_CONFIG[r.status as StatusKey] || STATUS_CONFIG.presente;
              return (
                <div key={r.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className="flex-1 truncate">{s?.name || r.student_id}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ color: cfg.color, background: cfg.bg }}>
                    {cfg.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{r.registered_by}</span>
                  <button onClick={() => deleteAttendance(r.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </PageTransition>
  );
}
