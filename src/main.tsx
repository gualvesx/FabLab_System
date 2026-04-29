import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './i18n' // must load before any component renders
import App from './App.tsx'

// Mount app first for fastest FCP
const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

// Init Supabase auth after paint (non-blocking)
import('./lib/supabase').then(({ supabase }) => {
  import('./stores/authStore').then(({ useAuthStore }) => {
    useAuthStore.getState().loadSession();
    supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        useAuthStore.setState({ user: null, isAuthenticated: false });
      } else {
        useAuthStore.getState().loadSession();
      }
    });
  });
});
