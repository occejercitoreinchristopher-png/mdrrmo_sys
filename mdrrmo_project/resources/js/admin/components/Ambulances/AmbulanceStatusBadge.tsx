import { CheckCircle2, Truck, Wrench, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface AmbulanceStatusBadgeProps {
    status?: string | null;
    size?: 'sm' | 'md' | 'lg';
    showPulse?: boolean;
    className?: string;
}

export default function AmbulanceStatusBadge({
    status = 'available',
    size = 'md',
    showPulse = true,
    className = '',
}: AmbulanceStatusBadgeProps) {
    const s = (status || '').toLowerCase();

    let label = 'Available';
    let Icon = CheckCircle2;
    let badgeStyle = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';

    if (s === 'dispatched' || s === 'busy' || s === 'en_route') {
        label = 'Dispatched';
        Icon = Truck;
        badgeStyle = 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30';
    } else if (s === 'maintenance' || s === 'repair') {
        label = 'Maintenance';
        Icon = Wrench;
        badgeStyle = 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
    } else if (s === 'inactive' || s === 'decommissioned') {
        label = 'Decommissioned';
        Icon = AlertCircle;
        badgeStyle = 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30';
    }

    const sizeClasses = {
        sm: 'text-[10px] px-2 py-0.5 gap-1.5',
        md: 'text-xs px-2.5 py-1 gap-1.5',
        lg: 'text-sm px-3.5 py-1.5 gap-2',
    }[size];

    return (
        <span
            className={clsx(
                'inline-flex items-center font-bold rounded-full border shadow-xs tracking-wide transition-all whitespace-nowrap',
                badgeStyle,
                sizeClasses,
                className
            )}
        >
            {showPulse && s === 'available' ? (
                <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
            ) : showPulse && (s === 'dispatched' || s === 'busy') ? (
                <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
            ) : (
                <Icon className={size === 'sm' ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'} />
            )}
            <span>{label}</span>
        </span>
    );
}
