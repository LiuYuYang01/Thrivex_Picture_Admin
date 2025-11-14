import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserStore {
  token: string;
  setToken: (data: string) => void;
  quitLogin: () => void;
}

export default create(
  persist<UserStore>(
    (set) => ({
      token: '',
      setToken: (token: string) => set(() => ({ token })),
      // 退出登录
      quitLogin: () =>
        set(() => {
          localStorage.clear();
          sessionStorage.clear();

          return {
            token: '',
          };
        }),
    }),
    {
      name: 'user_storage',
    }
  )
);
