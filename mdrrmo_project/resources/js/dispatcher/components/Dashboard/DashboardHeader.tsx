import { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { Clock, Radio } from 'lucide-react';
import { toPascalCase } from '@/shared/utils/utils';

export default function DashboardHeader() {
    const { auth } = usePage().props as any;
    const user = auth?.user;
    const dispatcherName = user?.first_name ? toPascalCase(user.first_name) : 'Dispatcher';

    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const timeStr = currentTime.toLocaleTimeString('en-PH', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
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
        <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-[#F61509] border border-rose-500/20">
                            <Radio className="w-3 h-3 animate-pulse" />
                            Dispatch Central
                        </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                        {greeting},{' '}
                        <span className="text-[#F61509]">
                            {dispatcherName}
                        </span>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Live command center for MDRRMO emergency responses and dispatches.
                    </p>
                </div>
                <div className="flex flex-col sm:items-end bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 px-4 py-2.5 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-1.5 text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                        <Clock className="w-4 h-4 text-[#F61509]" />
                        <span>{timeStr}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{dateStr}</p>
                </div>
            </div>
        </div>
    );
}
