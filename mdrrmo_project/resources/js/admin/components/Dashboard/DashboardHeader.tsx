import { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { Clock } from 'lucide-react';
import OperationalSummaryModal from './OperationalSummaryModal';

interface DashboardHeaderProps {
    initialAiSummary?: any;
}

export default function DashboardHeader({ initialAiSummary }: DashboardHeaderProps) {
    const { auth } = usePage().props as any;
    const user = auth?.user;
    const adminName = user?.first_name || 'Admin';

    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const timeStr = currentTime.toLocaleTimeString('en-PH', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    const dateStr = currentTime.toLocaleDateString('en-PH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const hour = currentTime.getHours();
    const greeting =
        hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-200/80 dark:border-white/10">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Dashboard
                </h1>
                <p suppressHydrationWarning className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                    {greeting},{' '}
                    <span className="text-red-600 dark:text-red-500 font-semibold">
                        {adminName}
                    </span>
                </p>
            </div>

            {/* AI Summary Button & Live Clock */}
            <div className="flex flex-wrap items-center gap-3 sm:self-center">
                {/* AI Operational Summary Modal Button */}
                <OperationalSummaryModal initialSummary={initialAiSummary} />

                {/* Live Clock */}
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow-sm text-right">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <div>
                        <p suppressHydrationWarning className="text-xs font-mono font-bold text-slate-900 dark:text-white tabular-nums leading-none">
                            {timeStr}
                        </p>
                        <p suppressHydrationWarning className="text-[10px] text-slate-400 mt-0.5 leading-none">
                            {dateStr}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
