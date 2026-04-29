import { create } from 'zustand';
import type { Quiz, QuizResult } from '@/types';
import { supabase } from '@/lib/supabase';

interface QuizState {
  quizzes: Quiz[];
  results: QuizResult[];
  loading: boolean;
  fetchQuizzes: () => Promise<void>;
  fetchResults: () => Promise<void>;
  addQuiz: (q: Omit<Quiz, 'id' | 'created_at'>) => Promise<void>;
  updateQuiz: (id: string, data: Partial<Quiz>) => Promise<void>;
  deleteQuiz: (id: string) => Promise<void>;
  addResult: (r: Omit<QuizResult, 'id'>) => Promise<void>;
  getStudentQuizzes: (studentId: string) => Quiz[];
  getStudentResults: (studentId: string) => QuizResult[];
  getQuizResults: (quizId: string) => QuizResult[];
  hasCompletedQuiz: (studentId: string, quizId: string) => boolean;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  quizzes: [],
  results: [],
  loading: false,

  fetchQuizzes: async () => {
    set({ loading: true });
    const { data } = await supabase
      .from('quizzes')
      .select('*, questions(*)')
      .order('created_at', { ascending: false });
    set({ quizzes: (data as Quiz[]) ?? [], loading: false });
  },

  fetchResults: async () => {
    const { data } = await supabase
      .from('quiz_results')
      .select('*')
      .order('completed_at', { ascending: false });
    set({ results: (data as QuizResult[]) ?? [] });
  },

  addQuiz: async (q) => {
    const { questions, ...rest } = q as Quiz;
    const payload = { ...rest, created_at: new Date().toISOString() };
    const { data } = await supabase.from('quizzes').insert(payload).select().single();
    if (data) {
      set({ quizzes: [{ ...(data as Quiz), questions: questions ?? [] }, ...get().quizzes] });
    }
  },

  updateQuiz: async (id, data) => {
    const { questions, ...rest } = data as Partial<Quiz>;
    const { data: updated } = await supabase.from('quizzes').update(rest).eq('id', id).select().single();
    if (updated) {
      set({
        quizzes: get().quizzes.map((q) =>
          q.id === id ? { ...q, ...(updated as Quiz) } : q
        ),
      });
    }
  },

  deleteQuiz: async (id) => {
    await supabase.from('quizzes').delete().eq('id', id);
    set({ quizzes: get().quizzes.filter((q) => q.id !== id) });
  },

  addResult: async (r) => {
    const { data } = await supabase.from('quiz_results').insert(r).select().single();
    if (data) set({ results: [data as QuizResult, ...get().results] });
  },

  getStudentQuizzes: (studentId) => {
    return get().quizzes.filter(
      (q) => q.status === 'published' && q.assigned_students?.includes(studentId)
    );
  },

  getStudentResults: (studentId) => {
    return get().results.filter((r) => r.student_id === studentId);
  },

  getQuizResults: (quizId) => {
    return get().results.filter((r) => r.quiz_id === quizId);
  },

  hasCompletedQuiz: (studentId, quizId) => {
    return get().results.some((r) => r.student_id === studentId && r.quiz_id === quizId);
  },
}));
