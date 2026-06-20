import type { LucideIcon } from 'lucide-react';
import { Construction } from 'lucide-react';

interface Props {
  title: string;
  description?: string;
  icon?: LucideIcon;
}

export default function StubPage({ title, description, icon: Icon = Construction }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-80 text-center">
      <div className="w-12 h-12 rounded-2xl bg-white border border-[#e5e0d8] flex items-center justify-center mb-4 shadow-sm">
        <Icon size={22} className="text-[#888]" />
      </div>
      <p className="text-[#1a1a1a] font-semibold text-base">{title}</p>
      <p className="text-[#aaa] text-sm mt-1.5 max-w-xs">
        {description ?? `The ${title} section is coming soon.`}
      </p>
    </div>
  );
}
