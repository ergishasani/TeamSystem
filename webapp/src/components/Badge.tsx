type Variant = 'green' | 'yellow' | 'red' | 'blue' | 'gray';

const variantClasses: Record<Variant, string> = {
  green: 'bg-green-500/20 text-green-400 border-green-500/30',
  yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  red: 'bg-red-500/20 text-red-400 border-red-500/30',
  blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  gray: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
};

interface Props {
  label: string;
  variant?: Variant;
}

export default function Badge({ label, variant = 'gray' }: Props) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantClasses[variant]}`}>
      {label}
    </span>
  );
}

export function statusBadge(status: string) {
  switch (status) {
    case 'pending': return { label: 'Pending', variant: 'yellow' as Variant };
    case 'approved': return { label: 'Approved', variant: 'green' as Variant };
    case 'rejected': return { label: 'Rejected', variant: 'red' as Variant };
    case 'cancelled': return { label: 'Cancelled', variant: 'gray' as Variant };
    case 'active': return { label: 'Active', variant: 'green' as Variant };
    case 'redeemed': return { label: 'Redeemed', variant: 'blue' as Variant };
    case 'expired': return { label: 'Expired', variant: 'gray' as Variant };
    case 'simulated_paid': return { label: 'Paid', variant: 'green' as Variant };
    default: return { label: status, variant: 'gray' as Variant };
  }
}
