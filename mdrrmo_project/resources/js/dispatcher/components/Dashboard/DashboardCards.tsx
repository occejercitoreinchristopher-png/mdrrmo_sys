import { Users, AlertTriangle, Ambulance, CheckCircle2, Clock, Truck } from 'lucide-react';
import DispatcherStatCard from './DispatcherStatCard';

export default function DashboardCards({ stats = {} }) {
    const cards = [
        {
            title: 'Active Incidents',
            value: stats.active_incidents ?? 0,
            icon: AlertTriangle,
            color: 'crimson',
            trend: stats.incidents_trend,
            trendLabel: 'vs last month',
        },
        {
            title: 'Pending Dispatch',
            value: stats.pending_dispatch ?? 0,
            icon: Clock,
            color: 'orange',
        },
        {
            title: 'Resolved Today',
            value: stats.resolved_today ?? 0,
            icon: CheckCircle2,
            color: 'emerald',
            trend: null,
            trendLabel: undefined,
        },
        {
            title: 'Ambulances Available',
            value: stats.available_ambulances ?? 0,
            icon: Ambulance,
            color: 'teal',
        },
        {
            title: 'Total Dispatches',
            value: stats.total_dispatches ?? 0,
            icon: Truck,
            color: 'orange',
        },
        {
            title: 'Total Responders',
            value: stats.total_users ?? 0,
            icon: Users,
            color: 'violet',
            trend: stats.users_trend,
            trendLabel: 'vs last month',
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            {cards.map((card) => (
                <DispatcherStatCard key={card.title} {...card} />
            ))}
        </div>
    );
}
