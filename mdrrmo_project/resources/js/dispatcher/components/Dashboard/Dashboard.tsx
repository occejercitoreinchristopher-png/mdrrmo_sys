import DashboardHeader from './DashboardHeader';
import DashboardCards, { DashboardStats } from './DashboardCards';
import DashboardCharts from './DashboardCharts';
import RecentIncidentsTable from './RecentIncidentsTable';
import RecentDispatchTable from './RecentDispatchTable';

interface DashboardProps {
    stats?: DashboardStats;
    charts?: any;
    recentIncidents?: any[];
    recentDispatches?: any[];
}

export default function Dashboard({ stats = {}, charts = {}, recentIncidents = [], recentDispatches = [] }: DashboardProps) {
    return (
        <div>
            <DashboardHeader />
            <DashboardCards stats={stats} />
            <DashboardCharts charts={charts} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <RecentIncidentsTable incidents={recentIncidents} />
                <RecentDispatchTable dispatches={recentDispatches} />
            </div>
        </div>
    );
}
