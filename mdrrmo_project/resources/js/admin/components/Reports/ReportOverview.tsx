import { AlertTriangle, CheckCircle2, Clock, XCircle, FileText } from 'lucide-react';
import StatCard from '@/shared/components/StatCard';

export default function ReportOverview({ stats }) {
    const cards = [
        {
            title: 'Total Incidents',
            value: stats.total_incidents ?? 0,
            icon: FileText,
            color: 'blue',
        },
        {
            title: 'Verified',
            value: stats.verified_count ?? 0,
            icon: AlertTriangle,
            color: 'amber',
        },
        {
            title: 'Resolved',
            value: stats.resolved_count ?? 0,
            icon: CheckCircle2,
            color: 'green',
        },
        {
            title: 'Rejected',
            value: stats.rejected_count ?? 0,
            icon: XCircle,
            color: 'red',
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-rose-600 rounded-full" />
                <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase">
                    Report Overview
                </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                {cards.map((card) => (
                    <StatCard key={card.title} {...card} />
                ))}
            </div>
        </div>
    );
}
