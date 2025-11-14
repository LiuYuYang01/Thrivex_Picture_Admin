import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  name: string;
  username: string;
  avatar: string;
}

interface UserStore {
  token: string;
  setToken: (data: string) => void;
  user: User;
  setUser: (data: User) => void;
  quitLogin: () => void;
}

export default create(
  persist<UserStore>(
    (set) => ({
      token: '',
      setToken: (token: string) => set(() => ({ token })),
      user: {} as User,
      setUser: (user: User) => set(() => ({ user })),
      // 退出登录
      quitLogin: () =>
        set(() => {
          localStorage.clear();
          sessionStorage.clear();

          return {
            token: '',
            user: {} as User,
          };
        }),
    }),
    {
      name: 'user_storage',
    }
  )
);
