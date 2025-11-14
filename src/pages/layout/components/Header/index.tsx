import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiBell, FiUser, FiLogOut, FiSettings, FiMaximize2, FiMinimize2, FiChevronDown } from 'react-icons/fi';
import { useNavigate } from 'react-router';
import { useUserStore } from '@/stores';

export default () => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notificationCount] = useState(3);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, quitLogin } = useUserStore();

  // 检测全屏状态
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 点击外部关闭用户菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 切换全屏
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // 退出登录
  const handleLogout = () => {
    quitLogin();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
      <div className="h-16 flex items-center justify-between px-4 lg:px-6">
        {/* 左侧：搜索框 */}
        <div className="flex-1 max-w-md">
          <div className={`relative transition-all duration-300 ${isSearchFocused ? 'scale-105' : ''}`}>
            <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors ${isSearchFocused ? 'text-primary' : ''}`} size={18} />
            <input
              type="text"
              placeholder="搜索功能、文件、用户..."
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 
                       bg-gray-50 focus:bg-white focus:border-primary focus:outline-none 
                       focus:ring-2 focus:ring-primary/20 transition-all duration-200
                       placeholder:text-gray-400 text-sm"
            />
            {isSearchFocused && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl 
                         border border-gray-200 p-2 max-h-64 overflow-y-auto"
              >
                <div className="text-sm text-gray-500 p-3 text-center">暂无搜索结果</div>
              </motion.div>
            )}
          </div>
        </div>

        {/* 右侧：操作按钮和用户菜单 */}
        <div className="flex items-center gap-2 lg:gap-4">
          {/* 全屏按钮 */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleFullscreen}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-primary 
                     transition-colors cursor-pointer"
          >
            {isFullscreen ? <FiMinimize2 size={20} /> : <FiMaximize2 size={20} />}
          </motion.button>

          {/* 通知按钮 */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-primary 
                     transition-colors cursor-pointer relative"
          >
            <FiBell size={20} />
            {notificationCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full 
                         border-2 border-white"
              />
            )}
            {notificationCount > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 
                             bg-red-500 text-white text-xs rounded-full flex items-center 
                             justify-center font-medium"
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </motion.button>

          {/* 用户菜单 */}
          <div className="relative" ref={userMenuRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 
                       transition-colors cursor-pointer"
            >
              <img src={user?.avatar} alt="" className="w-8 h-8 rounded-full" />
              <div className="hidden lg:block text-left">
                <p className="text-sm font-semibold text-gray-800">{user?.name || user?.username || ''}</p>
                <p className="text-xs text-gray-500">管理员</p>
              </div>
              <FiChevronDown className={`hidden lg:block text-gray-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} size={16} />
            </motion.button>

            {/* 用户下拉菜单 */}
            <AnimatePresence>
              {isUserMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl 
                           border border-gray-200 overflow-hidden z-50"
                >
                  {/* 用户信息 */}
                  <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-primary/5 to-purple-50">
                    <div className="flex items-center gap-3">
                      <img src={user?.avatar} alt="" className="w-12 h-12 rounded-full" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{user?.name}</p>
                        {/* <p className="text-xs text-gray-500 truncate">再渺小的星光，也有属于他的光芒！</p> */}
                      </div>
                    </div>
                  </div>

                  {/* 菜单项 */}
                  <div className="py-2">
                    <motion.button
                      whileHover={{ x: 4 }}
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        navigate('/profile');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 
                               hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <FiUser size={18} className="text-gray-500" />
                      <span className="text-sm">个人中心</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ x: 4 }}
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        navigate('/settings');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 
                               hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <FiSettings size={18} className="text-gray-500" />
                      <span className="text-sm">设置</span>
                    </motion.button>

                    <div className="my-1 border-t border-gray-200" />

                    <motion.button
                      whileHover={{ x: 4 }}
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-red-600 
                               hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <FiLogOut size={18} />
                      <span className="text-sm font-medium">退出登录</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};
