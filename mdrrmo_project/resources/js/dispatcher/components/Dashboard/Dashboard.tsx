import DashboardHeader from './DashboardHeader';
import DashboardCards from './DashboardCards';
import DashboardCharts from './DashboardCharts';
import RecentIncidentsTable from './RecentIncidentsTable';
import RecentDispatchTable from './RecentDispatchTable';

export default function Dashboard({ stats = {}, charts = {}, recentIncidents = [], recentDispatches = [] }) {
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
