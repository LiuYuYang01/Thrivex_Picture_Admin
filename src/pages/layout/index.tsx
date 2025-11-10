import { Outlet } from 'react-router';
import Sidebar from './components/Sidebar';

export default () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      {/* 主内容区域 */}
      <main className="lg:ml-64 min-h-screen transition-all duration-300">
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
