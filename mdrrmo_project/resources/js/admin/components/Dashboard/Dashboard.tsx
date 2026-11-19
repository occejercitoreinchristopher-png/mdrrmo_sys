import DashboardHeader from './DashboardHeader';
import DashboardCards from './DashboardCards';
import DashboardCharts from './DashboardCharts';
import TopResidentsPanel from '@/dispatcher/components/Dashboard/TopResidentsPanel';
import RecentIncidentsTable from './RecentIncidentsTable';
import RecentDispatchTable from './RecentDispatchTable';

export default function Dashboard({
    stats = {},
    charts = {},
    community = {},
    recentIncidents = [],
    recentDispatches = [],
    extraData = {},
}: any) {
    return (
        <div className="space-y-6">
            <DashboardHeader />
            <DashboardCards stats={stats} />
            <DashboardCharts charts={charts} />
            <TopResidentsPanel community={community} linkPrefix="/admin/residents" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RecentIncidentsTable incidents={recentIncidents} />
                <RecentDispatchTable dispatches={recentDispatches} />
            </div>
        </div>
    );
}
