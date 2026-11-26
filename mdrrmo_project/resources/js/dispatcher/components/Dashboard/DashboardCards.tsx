import {
    Ambulance,
    CheckCircle2,
    HeartPulse,
    Shield,
    UserCheck,
} from 'lucide-react';
import DispatcherStatCard from './DispatcherStatCard';

export interface TopResidentSummary {
    id: number;
    first_name: string;
    last_name: string;
    name: string;
    initials: string;
    profile_photo_url?: string | null;
    barangay?: string;
    is_verified?: boolean;
    total_reports: number;
    resolved_reports: number;
    active_reports: number;
    resolution_rate: number;
}

export interface DashboardStats {
    total_incidents?: number;
    active_incidents?: number;
    pending_incidents?: number;
    pending_dispatch?: number;
    resolved_incidents?: number;
    resolved_today?: number;
    resolution_rate?: number;
    incidents_trend?: number | null;
    total_residents?: number;
    verified_residents?: number;
    pending_residents?: number;
    active_resident_reporters?: number;
    residents_trend?: number | null;
    total_ambulances?: number;
    available_ambulances?: number;
    total_dispatches?: number;
    active_dispatches?: number;
    completed_dispatches?: number;
    completed_dispatches_today?: number;
    total_responders?: number;
    available_responders?: number;
    total_patients?: number;
    total_pcrs?: number;
    sim_caller_reports?: number;
    top_resolved_resident?: TopResidentSummary | null;
    [key: string]: any;
}

interface DashboardCardsProps {
    stats?: DashboardStats;
}

export default function DashboardCards({ stats = {} }: DashboardCardsProps) {
    // 5 Essential Command Center Cards with unified 2-3 color palette (Crimson, Blue, Emerald)
    const cards = [
        {
            title: 'Registered Residents',
            value: stats.total_residents ?? 0,
            icon: UserCheck,
            color: 'blue',
            href: '/dispatcher/residents',
        },
        {
            title: 'Ambulances Ready',
            value: stats.available_ambulances ?? 0,
            valueSuffix: stats.total_ambulances ? `/ ${stats.total_ambulances} units` : undefined,
            icon: Ambulance,
            color: 'emerald',
            href: '/dispatcher/dispatches',
        },
        {
            title: 'Responders On Duty',
            value: stats.available_responders ?? 0,
            valueSuffix: stats.total_responders ? `/ ${stats.total_responders} personnel` : undefined,
            icon: Shield,
            color: 'blue',
            href: '/dispatcher/responders',
        },
        {
            title: 'Resolved Incidents',
            value: stats.resolved_incidents ?? 0,
            icon: CheckCircle2,
            color: 'emerald',
            href: '/dispatcher/incidents?status=history',
        },
        {
            title: 'Patients & PCRs',
            value: stats.total_patients ?? 0,
            icon: HeartPulse,
            color: 'crimson',
            href: '/dispatcher/patients',
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
            {cards.map((card, idx) => (
                <DispatcherStatCard key={card.title} {...card} delayMs={idx * 65} />
            ))}
        </div>
    );
}
