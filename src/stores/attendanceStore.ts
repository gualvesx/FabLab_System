import { create } from 'zustand';
import type { Attendance } from '@/types';
import { supabase } from '@/lib/supabase';

interface AttendanceState {
  records: Attendance[];
  loading: boolean;
  /** Busca todos os registros de presença de uma data específica (opcionalmente filtrando por projeto). */
  fetchByDate: (date: string, projectId?: string) => Promise<void>;
  /** Busca o histórico completo de um aluno. */
  fetchByStudent: (studentId: string) => Promise<Attendance[]>;
  /** Marca (cria ou atualiza) a presença de um aluno em uma data — upsert por (student_id, date). */
  markAttendance: (record: Omit<Attendance, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  /** Marca presença em lote (ex: turma inteira em um dia). */
  markBulk: (records: Omit<Attendance, 'id' | 'created_at' | 'updated_at'>[]) => Promise<void>;
  deleteAttendance: (id: string) => Promise<void>;
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  records: [],
  loading: false,

  fetchByDate: async (date, projectId) => {
    set({ loading: true });
    let q = supabase.from('attendance').select('*').eq('date', date);
    if (projectId) q = q.eq('project_id', projectId);
    const { data } = await q;
    set({ records: (data as Attendance[]) ?? [], loading: false });
  },

  fetchByStudent: async (studentId) => {
    const { data } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false });
    return (data as Attendance[]) ?? [];
  },

  markAttendance: async (record) => {
    const { data } = await supabase
      .from('attendance')
      .upsert(record, { onConflict: 'student_id,date' })
      .select()
      .single();
    if (data) {
      set({
        records: [
          data as Attendance,
          ...get().records.filter(r => !(r.student_id === record.student_id && r.date === record.date)),
        ],
      });
    }
  },

  markBulk: async (records) => {
    if (records.length === 0) return;
    const { data } = await supabase
      .from('attendance')
      .upsert(records, { onConflict: 'student_id,date' })
      .select();
    if (data) {
      const saved = data as Attendance[];
      const keys = new Set(saved.map(r => `${r.student_id}__${r.date}`));
      set({
        records: [...saved, ...get().records.filter(r => !keys.has(`${r.student_id}__${r.date}`))],
      });
    }
  },

  deleteAttendance: async (id) => {
    await supabase.from('attendance').delete().eq('id', id);
    set({ records: get().records.filter(r => r.id !== id) });
  },
}));
