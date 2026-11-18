import DashboardHeader from './DashboardHeader';
import DashboardCards, { DashboardStats } from './DashboardCards';
import DashboardCharts from './DashboardCharts';
import TopResidentsPanel, { CommunityInsights } from './TopResidentsPanel';
import RecentIncidentsTable from './RecentIncidentsTable';
import RecentDispatchTable from './RecentDispatchTable';

interface DashboardProps {
    stats?: DashboardStats;
    charts?: any;
    community?: CommunityInsights;
    recentIncidents?: any[];
    recentDispatches?: any[];
}

export default function Dashboard({
    stats = {},
    charts = {},
    community = {},
    recentIncidents = [],
    recentDispatches = [],
}: DashboardProps) {
    return (
        <div>
            <DashboardHeader />
            <DashboardCards stats={stats} />
            <DashboardCharts charts={charts} />
            <TopResidentsPanel community={community} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <RecentIncidentsTable incidents={recentIncidents} />
                <RecentDispatchTable dispatches={recentDispatches} />
            </div>
        </div>
    );
}
