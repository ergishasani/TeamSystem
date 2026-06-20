import { Outlet } from 'react-router-dom';
import PlatformSidebar from './PlatformSidebar';
import PlatformTopBar from './PlatformTopBar';

export default function PlatformLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <PlatformSidebar />
      <div className="flex-1 flex flex-col overflow-hidden bg-[#f0ece4]">
        <PlatformTopBar />
        <main className="flex-1 overflow-y-auto px-8 pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
