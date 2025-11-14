// 用户相关类型

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    username: string;
    avatar: string;
    create_time: string;
  };
}

