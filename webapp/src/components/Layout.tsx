import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

type Role = 'employer_admin' | 'provider_admin';

interface Props {
  role: Role;
}

export default function Layout({ role }: Props) {
  return (
    <div className="flex min-h-screen bg-[#111]">
      <Sidebar role={role} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
