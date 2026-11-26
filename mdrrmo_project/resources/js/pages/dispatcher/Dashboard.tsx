import DispatcherLayout from '@/dispatcher/layouts/DispatcherLayout';
import Dashboard from '@/dispatcher/components/Dashboard/Dashboard';
import { DashboardStats } from '@/dispatcher/components/Dashboard/DashboardCards';
import { CommunityInsights } from '@/dispatcher/components/Dashboard/TopResidentsPanel';

interface DashboardPageProps {
    stats?: DashboardStats;
    charts?: any;
    community?: CommunityInsights;
    recentIncidents?: any[];
    recentDispatches?: any[];
    extraData?: any;
    aiSummary?: any;
}

export default function DashboardPage({
    stats,
    charts,
    community,
    recentIncidents,
    recentDispatches,
    extraData,
    aiSummary,
}: DashboardPageProps) {
    return (
        <DispatcherLayout title="Dashboard">
            <Dashboard
                stats={stats ?? {}}
                charts={charts ?? {}}
                community={community ?? {}}
                recentIncidents={recentIncidents ?? []}
                recentDispatches={recentDispatches ?? []}
                extraData={extraData ?? {}}
                aiSummary={aiSummary}
            />
        </DispatcherLayout>
    );
}
