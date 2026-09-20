import { clsx } from 'clsx';
import { ShieldAlert, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

interface StatusBadgeProps {
    status: string;
    className?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    showDot?: boolean;
}

export default function StatusBadge({
    status,
    className,
    size = 'md',
    showDot = false,
}: StatusBadgeProps) {
    const s = (status || '').toLowerCase();

    let Icon = Info;
    let colorClass = 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300 border-slate-200 dark:border-white/20';
    let dotColorClass = 'bg-slate-400 dark:bg-slate-400';
    let label = status;

    switch (s) {
        // Incident Statuses
        case 'pending':
            Icon = AlertTriangle;
            colorClass = 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30';
            dotColorClass = 'bg-amber-500';
            break;
        case 'dispatched':
            Icon = CheckCircle2;
            colorClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30';
            dotColorClass = 'bg-emerald-500';
            break;
        case 'resolved':
            Icon = CheckCircle2;
            colorClass = 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30';
            dotColorClass = 'bg-blue-500';
            break;
        case 'false_alarm':
        case 'cancelled':
            Icon = ShieldAlert;
            colorClass = 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-500/30';
            dotColorClass = 'bg-rose-500';
            label = s === 'false_alarm' ? 'False Alarm' : 'Cancelled';
            break;

        // Priorities
        case 'critical':
            Icon = ShieldAlert;
            colorClass = 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-500/30';
            dotColorClass = 'bg-rose-500';
            break;
        case 'high':
            Icon = AlertTriangle;
            colorClass = 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 border-orange-200 dark:border-orange-500/30';
            dotColorClass = 'bg-orange-500';
            break;
        case 'moderate':
            Icon = Info;
            colorClass = 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30';
            dotColorClass = 'bg-amber-500';
            break;
            
        // Responder Statuses
        case 'available':
            Icon = CheckCircle2;
            colorClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30';
            dotColorClass = 'bg-emerald-500';
            break;
        case 'busy':
        case 'en_route':
        case 'on_scene':
            Icon = AlertTriangle;
            colorClass = 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30';
            dotColorClass = 'bg-blue-500';
            label = s === 'en_route' ? 'En Route' : s === 'on_scene' ? 'On Scene' : 'Busy';
            break;
        case 'off_duty':
            Icon = Info;
            colorClass = 'bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-400 border-slate-300 dark:border-white/20';
            dotColorClass = 'bg-slate-400';
            label = 'Off Duty';
            break;
            
        // Leave request statuses
        case 'approved':
            Icon = CheckCircle2;
            colorClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30';
            dotColorClass = 'bg-emerald-500';
            break;
        case 'rejected':
            Icon = ShieldAlert;
            colorClass = 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-500/30';
            dotColorClass = 'bg-rose-500';
            break;

        default:
            label = status ? status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ') : 'Unknown';
    }

    const sizeClasses = {
        xs: 'px-1.5 py-0.5 text-[10px] gap-1',
        sm: 'px-2 py-0.5 text-xs gap-1',
        md: 'px-2.5 py-1 text-xs gap-1.5',
        lg: 'px-3 py-1.5 text-sm gap-2',
    }[size] || 'px-2.5 py-1 text-xs gap-1.5';

    const iconSizes = {
        xs: 'w-2.5 h-2.5',
        sm: 'w-3 h-3',
        md: 'w-3.5 h-3.5',
        lg: 'w-4 h-4',
    }[size] || 'w-3.5 h-3.5';

    const dotSizes = {
        xs: 'w-1.5 h-1.5',
        sm: 'w-1.5 h-1.5',
        md: 'w-2 h-2',
        lg: 'w-2.5 h-2.5',
    }[size] || 'w-2 h-2';

    return (
        <span
            className={clsx(
                'inline-flex items-center rounded-full font-semibold border backdrop-blur-sm',
                sizeClasses,
                colorClass,
                className
            )}
        >
            {showDot ? (
                <span className={clsx('rounded-full shrink-0', dotSizes, dotColorClass)} />
            ) : (
                <Icon className={clsx('shrink-0', iconSizes)} />
            )}
            {label}
        </span>
    );
}
