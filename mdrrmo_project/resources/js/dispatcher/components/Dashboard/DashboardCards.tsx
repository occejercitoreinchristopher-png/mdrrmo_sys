import {
    AlertTriangle,
    Ambulance,
    CheckCircle2,
    HeartPulse,
    Shield,
    Trophy,
    Truck,
    UserCheck,
} from 'lucide-react';
import DispatcherStatCard from './DispatcherStatCard';
import { toPascalCase } from '@/shared/utils/utils';

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
    const topRes = stats.top_resolved_resident;

    const cards = [
        {
            title: 'Registered Residents',
            value: stats.total_residents ?? 0,
            subtitle: `${stats.verified_residents ?? 0} Verified • ${stats.pending_residents ?? 0} Pending`,
            icon: UserCheck,
            color: 'blue',
            trend: stats.residents_trend ?? null,
            href: '/dispatcher/residents',
        },
        {
            title: 'Active Incidents',
            value: stats.active_incidents ?? stats.pending_incidents ?? 0,
            subtitle: `${stats.pending_dispatch ?? 0} awaiting dispatch`,
            icon: AlertTriangle,
            color: 'crimson',
            trend: stats.incidents_trend ?? null,
            href: '/dispatcher/incidents?status=active',
        },
        {
            title: 'Resolved Incidents',
            value: stats.resolved_incidents ?? 0,
            subtitle: `${stats.resolved_today ?? 0} today • ${stats.resolution_rate ?? 0}% rate`,
            icon: CheckCircle2,
            color: 'emerald',
            href: '/dispatcher/incidents?status=history',
        },
        {
            title: 'Top Resolved Reporter',
            value: topRes ? topRes.resolved_reports : 0,
            valueSuffix: topRes ? 'resolved' : undefined,
            highlightName: topRes ? toPascalCase(topRes.name) : 'No reports yet',
            subtitle: topRes
                ? `${topRes.total_reports} total reports • Brgy. ${toPascalCase(topRes.barangay || 'Unassigned')}`
                : 'Awaiting resident reports',
            icon: Trophy,
            color: 'amber',
            href: topRes ? `/dispatcher/residents/${topRes.id}` : '/dispatcher/residents',
        },
        {
            title: 'Patients & PCRs',
            value: stats.total_patients ?? 0,
            subtitle: `${stats.total_pcrs ?? 0} PCR records logged`,
            icon: HeartPulse,
            color: 'rose',
            href: '/dispatcher/patients',
        },
        {
            title: 'Ambulances Ready',
            value: stats.available_ambulances ?? 0,
            valueSuffix: stats.total_ambulances ? `/ ${stats.total_ambulances}` : undefined,
            subtitle: 'Emergency response fleet',
            icon: Ambulance,
            color: 'teal',
        },
        {
            title: 'Total Dispatches',
            value: stats.total_dispatches ?? 0,
            subtitle: `${stats.active_dispatches ?? 0} active • ${stats.completed_dispatches ?? 0} completed`,
            icon: Truck,
            color: 'orange',
            href: '/dispatcher/dispatches',
        },
        {
            title: 'Responders On Duty',
            value: stats.available_responders ?? 0,
            valueSuffix: stats.total_responders ? `/ ${stats.total_responders}` : undefined,
            subtitle: 'Available field crew',
            icon: Shield,
            color: 'violet',
            href: '/dispatcher/responders',
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {cards.map((card, idx) => (
                <DispatcherStatCard key={card.title} {...card} delayMs={idx * 65} />
            ))}
        </div>
    );
}
