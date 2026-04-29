import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      loadSession: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          set({ user: null, isAuthenticated: false });
          return;
        }
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          set({ user: profile as User, isAuthenticated: true });
        } else {
          const meta = session.user.user_metadata ?? {};
          const fallback: User = {
            id: session.user.id,
            name: meta.name ?? session.user.email ?? 'Usuário',
            email: session.user.email ?? '',
            role: (meta.role as User['role']) ?? 'professor',
            unit: meta.unit ?? '',
            active: true,
          };
          set({ user: fallback, isAuthenticated: true });
        }
      },

      login: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.session) return false;

        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.session.user.id)
          .single();

        if (profile) {
          set({ user: profile as User, isAuthenticated: true });
        } else {
          const meta = data.session.user.user_metadata ?? {};
          const fallback: User = {
            id: data.session.user.id,
            name: meta.name ?? email,
            email,
            role: (meta.role as User['role']) ?? 'professor',
            unit: meta.unit ?? '',
            active: true,
          };
          set({ user: fallback, isAuthenticated: true });
        }
        return true;
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'sesi-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
