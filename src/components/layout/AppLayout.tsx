import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { useLanguageStore } from '@/stores/languageStore';
import type { AppModule } from '@/types';
import i18n from '@/i18n';

export function AppLayout() {
  const { user, isAuthenticated } = useAuthStore();
  const { isDark } = useThemeStore();
  const { lang } = useLanguageStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/landing');
      return;
    }
    // Redirect student to student area
    if (user?.role === 'student' && !location.pathname.startsWith('/student')) {
      navigate('/student/quiz');
    }
  }, [isAuthenticated, user, navigate, location]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang]);

  const getActiveModule = (): AppModule => {
    if (location.pathname.startsWith('/fablab')) return 'fablab';
    if (location.pathname.startsWith('/gifted')) return 'gifted';
    if (location.pathname.startsWith('/student')) return 'student';
    return 'fablab';
  };

  const handleModuleChange = (mod: AppModule) => {
    if (mod === 'fablab') navigate('/fablab/home');
    else if (mod === 'gifted') navigate('/gifted/home');
  };

  if (!isAuthenticated || !user) return null;

  const activeModule = getActiveModule();

  // For students, show simplified layout
  if (user.role === 'student') {
    return (
      <div className="min-h-screen bg-background">
        <TopBar activeModule="student" onModuleChange={() => {}} />
        <div className="flex">
          <Sidebar module="student" role={user.role} collapsed={collapsed} />
          <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-h-[calc(100vh-64px)]">
            <Outlet />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar activeModule={activeModule} onModuleChange={handleModuleChange} />
      <div className="flex">
        <Sidebar module={activeModule} role={user.role} collapsed={collapsed} />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-h-[calc(100vh-64px)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
