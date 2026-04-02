import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axiosInstance';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('accessToken', data.accessToken);
        set({ user: data.user, accessToken: data.accessToken, isAuthenticated: true });
        return data.user;
      },

      logout: async () => {
        try { await api.post('/auth/logout'); } catch {}
        localStorage.removeItem('accessToken');
        set({ user: null, accessToken: null, isAuthenticated: false });
        window.location.href = '/login';
      },

      fetchMe: async () => {
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data.user, isAuthenticated: true });
        } catch {
          get().logout();
        }
      },
    }),
    {
      name: 'medflow-auth',
      partialState: (state) => ({ user: state.user }),
    }
  )
);

export default useAuthStore;