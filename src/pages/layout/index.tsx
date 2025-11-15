import { Outlet } from 'react-router';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

export default () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 relative overflow-hidden">
      {/* 装饰性背景元素 */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-green-200/20 to-blue-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />
      
      <Sidebar />
      
      {/* 主内容区域 */}
      <main className="lg:ml-64 min-h-screen transition-all duration-300 relative z-10">
        <Header />
        
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
