import DashboardHeader from './DashboardHeader';
import DashboardCards, { DashboardStats } from './DashboardCards';
import DashboardCharts from './DashboardCharts';

interface DashboardProps {
    stats?: DashboardStats;
    charts?: any;
    community?: any;
    recentIncidents?: any[];
    recentDispatches?: any[];
}

export default function Dashboard({
    stats = {},
    charts = {},
}: DashboardProps) {
    return (
        <div className="space-y-6">
            <DashboardHeader />
            <DashboardCards stats={stats} />
            <DashboardCharts charts={charts} />
        </div>
    );
}
