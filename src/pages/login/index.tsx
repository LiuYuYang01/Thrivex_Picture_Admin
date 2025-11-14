import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Input, Button } from '@heroui/react';
import { FiUser, FiLock } from 'react-icons/fi';
import { loginAPI } from '@/api';
import { useUserStore } from '@/stores';
import { notification, message } from 'antd';
import type { LoginParams } from '@/types/user';

export default () => {
  const navigate = useNavigate();
  const setToken = useUserStore((state) => state.setToken);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<LoginParams>({
    username: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username.trim()) {
      notification.warning({
        message: '提示',
        description: '请输入用户名',
      });
      return;
    }

    if (!formData.password.trim()) {
      notification.warning({
        message: '提示',
        description: '请输入密码',
      });
      return;
    }

    setLoading(true);
    try {
      const { data } = await loginAPI(formData);
      if (data?.token) {
        setToken(data.token);
        message.success(`欢迎回来，${data.user?.name || data.user?.username || ''}!`);
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* 登录卡片 */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          {/* 登录表单 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="请输入用户名"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                startContent={<FiUser className="text-gray-400 text-xl" />}
                variant="bordered"
                size="lg"
                classNames={{
                  input: 'text-base',
                  inputWrapper: 'border-gray-200 hover:border-blue-400 focus-within:!border-blue-500 transition-colors',
                }}
              />

              <Input
                type="password"
                placeholder="请输入密码"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                startContent={<FiLock className="text-gray-400 text-xl" />}
                variant="bordered"
                size="lg"
                classNames={{
                  input: 'text-base',
                  inputWrapper: 'border-gray-200 hover:border-blue-400 focus-within:!border-blue-500 transition-colors',
                }}
              />
            </div>

            <Button type="submit" color="primary" size="lg" isLoading={loading} className="w-full text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>
        </div>
      </div>

      {/* 自定义动画样式 */}
      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};
