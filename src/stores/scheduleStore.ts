import { create } from 'zustand';
import type { Schedule } from '@/types';
import { supabase } from '@/lib/supabase';

interface ScheduleState {
  schedules: Schedule[];
  loading: boolean;
  fetchSchedules: () => Promise<void>;
  addSchedule: (s: Omit<Schedule, 'id'>) => Promise<void>;
  updateSchedule: (id: string, data: Partial<Schedule>) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  schedules: [],
  loading: false,

  fetchSchedules: async () => {
    set({ loading: true });
    const { data } = await supabase
      .from('schedules')
      .select('*, schedule_materials(*)')
      .order('date', { ascending: true });
    set({ schedules: (data as Schedule[]) ?? [], loading: false });
  },

  addSchedule: async (s) => {
    const { schedule_materials, ...rest } = s as Schedule;
    const { data } = await supabase.from('schedules').insert(rest).select().single();
    if (data) {
      set({ schedules: [{ ...(data as Schedule), schedule_materials: [] }, ...get().schedules] });
    }
  },

  updateSchedule: async (id, data) => {
    const { schedule_materials, ...rest } = data as Partial<Schedule>;
    const { data: updated } = await supabase.from('schedules').update(rest).eq('id', id).select().single();
    if (updated) {
      set({
        schedules: get().schedules.map((s) =>
          s.id === id ? { ...s, ...(updated as Schedule) } : s
        ),
      });
    }
  },

  deleteSchedule: async (id) => {
    await supabase.from('schedules').delete().eq('id', id);
    set({ schedules: get().schedules.filter((s) => s.id !== id) });
  },
}));
