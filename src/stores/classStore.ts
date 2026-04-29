import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { ALL_ROUTES, CLASS_COLORS } from '@/lib/constants';
import type { UserClass } from '@/types';

interface ClassState {
  classes: UserClass[];
  loading: boolean;
  fetchClasses: () => Promise<void>;
  addClass: (c: Omit<UserClass, 'id' | 'created_at'>) => Promise<UserClass | null>;
  updateClass: (id: string, data: Partial<UserClass>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
}

// Default classes seeded locally when table is empty
const DEFAULT_CLASSES: Omit<UserClass, 'id' | 'created_at'>[] = [
  {
    name: 'Administrador',
    base_role: 'admin',
    color: CLASS_COLORS[0],
    permissions: ALL_ROUTES.map(r => ({ route: r.route, label: r.label, allowed: true })),
  },
  {
    name: 'Professor',
    base_role: 'professor',
    color: CLASS_COLORS[1],
    permissions: ALL_ROUTES.map(r => ({
      route: r.route, label: r.label,
      allowed: ![ '/fablab/users', '/fablab/dashboard' ].includes(r.route),
    })),
  },
  {
    name: 'Funcionário',
    base_role: 'funcionario',
    color: CLASS_COLORS[2],
    permissions: ALL_ROUTES.map(r => ({
      route: r.route, label: r.label,
      allowed: ['/fablab/home', '/fablab/inventory', '/fablab/schedule', '/fablab/blog'].includes(r.route),
    })),
  },
  {
    name: 'Aluno',
    base_role: 'student',
    color: CLASS_COLORS[3],
    permissions: ALL_ROUTES.map(r => ({
      route: r.route, label: r.label,
      allowed: ['/student/quiz', '/student/grades', '/student/proposal', '/fablab/blog'].includes(r.route),
    })),
  },
];

export const useClassStore = create<ClassState>((set, get) => ({
  classes: [],
  loading: false,

  fetchClasses: async () => {
    set({ loading: true });
    const { data, error } = await supabase.from('user_classes').select('*').order('name');
    if (!error && data && data.length > 0) {
      set({ classes: data as UserClass[], loading: false });
    } else {
      // Seed defaults if table empty or not found
      set({ classes: DEFAULT_CLASSES.map((c, i) => ({ ...c, id: `default-${i}`, created_at: new Date().toISOString() })), loading: false });
    }
  },

  addClass: async (c) => {
    const { data, error } = await supabase.from('user_classes').insert({ ...c, created_at: new Date().toISOString() }).select().single();
    if (!error && data) {
      set({ classes: [...get().classes, data as UserClass] });
      return data as UserClass;
    }
    return null;
  },

  updateClass: async (id, data) => {
    if (id.startsWith('default-')) {
      set({ classes: get().classes.map(c => c.id === id ? { ...c, ...data } : c) });
      return;
    }
    await supabase.from('user_classes').update(data).eq('id', id);
    set({ classes: get().classes.map(c => c.id === id ? { ...c, ...data } : c) });
  },

  deleteClass: async (id) => {
    if (!id.startsWith('default-')) await supabase.from('user_classes').delete().eq('id', id);
    set({ classes: get().classes.filter(c => c.id !== id) });
  },
}));
