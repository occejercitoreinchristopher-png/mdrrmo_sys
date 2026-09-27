import { Users, AlertTriangle, Ambulance, CheckCircle2, Clock, Truck } from 'lucide-react';
import StatCard from '@/shared/components/StatCard';

export interface DashboardStats {
    total_users?: number;
    active_incidents?: number;
    resolved_today?: number;
    pending_dispatch?: number;
    available_ambulances?: number;
    total_dispatches?: number;
    users_trend?: number | null;
    incidents_trend?: number | null;
    [key: string]: any;
}

interface DashboardCardsProps {
    stats?: DashboardStats;
}

export default function DashboardCards({ stats = {} }: DashboardCardsProps) {
    const cards = [
        {
            title: 'Total Users',
            value: stats.total_users ?? 0,
            icon: Users,
            color: 'blue',
            trend: stats.users_trend,
            trendLabel: 'vs last month',
        },
        {
            title: 'Active Incidents',
            value: stats.active_incidents ?? 0,
            icon: AlertTriangle,
            color: 'amber',
            trend: stats.incidents_trend,
            trendLabel: 'vs last month',
        },
        {
            title: 'Resolved Today',
            value: stats.resolved_today ?? 0,
            icon: CheckCircle2,
            color: 'green',
            trend: null,
            trendLabel: undefined,
        },
        {
            title: 'Pending Dispatch',
            value: stats.pending_dispatch ?? 0,
            icon: Clock,
            color: 'red',
        },
        {
            title: 'Ambulances Available',
            value: stats.available_ambulances ?? 0,
            icon: Ambulance,
            color: 'purple',
        },
        {
            title: 'Total Dispatches',
            value: stats.total_dispatches ?? 0,
            icon: Truck,
            color: 'blue',
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            {cards.map((card) => (
                <StatCard key={card.title} {...card} />
            ))}
        </div>
    );
}
