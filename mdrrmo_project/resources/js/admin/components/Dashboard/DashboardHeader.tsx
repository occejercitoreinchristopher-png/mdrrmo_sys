import { useState, useEffect } from 'react';
import { usePage, Link } from '@inertiajs/react';
import { UserPlus, Ambulance, BarChart3, Clock, Sparkles, Shield, FileText } from 'lucide-react';

export default function DashboardHeader() {
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
                <div className="flex items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-red-600/10 text-red-600 dark:text-red-400 border border-red-500/25">
                        <Shield className="w-3 h-3 text-red-500" />
                        Executive Admin Command
                    </span>
                    <span className="text-slate-400 text-xs hidden sm:inline">•</span>
                    <span className="text-slate-400 text-xs font-mono hidden sm:inline">
                        Municipality of Opol
                    </span>
                </div>
                <h1 suppressHydrationWarning className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                    {greeting},{' '}
                    <span className="text-red-600 dark:text-red-500">
                        {adminName}
                    </span>
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Command-level municipal emergency monitoring, operational fleet analytics, and community governance.
                </p>
            </div>

            {/* Quick Actions & Live Clock */}
            <div className="flex flex-wrap items-center gap-2.5 sm:self-end">
                {/* Clock */}
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

                <Link
                    href="/admin/users"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-all cursor-pointer active:scale-95"
                >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Users</span>
                </Link>

                <Link
                    href="/admin/ambulances"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-white/10 transition-all cursor-pointer active:scale-95"
                >
                    <Ambulance className="w-3.5 h-3.5 text-blue-500" />
                    <span>Fleet</span>
                </Link>

                <Link
                    href="/admin/reports"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-red-600/10 text-red-600 dark:text-red-400 border border-red-500/20 shadow-sm hover:bg-red-600/20 transition-all cursor-pointer active:scale-95"
                >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Reports</span>
                </Link>
            </div>
        </div>
    );
}
