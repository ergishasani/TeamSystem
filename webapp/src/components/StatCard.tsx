import type { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  accent?: boolean;
  sub?: string;
}

export default function StatCard({ title, value, icon: Icon, accent, sub }: Props) {
  return (
    <div className="bg-app-card border border-app-border rounded-xl p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${accent ? 'bg-app-accent-dim' : 'bg-app-surface'}`}>
        <Icon size={20} className={accent ? 'text-app-accent' : 'text-app-muted'} />
      </div>
      <div>
        <p className="text-app-muted text-sm">{title}</p>
        <p className="text-white text-2xl font-bold mt-0.5">{value}</p>
        {sub && <p className="text-app-muted text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );
}
