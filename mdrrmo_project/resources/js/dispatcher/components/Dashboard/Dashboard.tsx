import DashboardHeader from './DashboardHeader';
import DashboardCards, { DashboardStats } from './DashboardCards';
import DashboardCharts from './DashboardCharts';

interface DashboardProps {
    stats?: DashboardStats;
    charts?: any;
    community?: any;
    recentIncidents?: any[];
    recentDispatches?: any[];
    extraData?: any;
    aiSummary?: any;
}

export default function Dashboard({
    stats = {},
    charts = {},
    extraData = {},
    aiSummary,
}: DashboardProps) {
    return (
        <div className="space-y-6">
            <DashboardHeader initialAiSummary={aiSummary} />
            <DashboardCards stats={stats} />
            <DashboardCharts charts={charts} stats={stats} extraData={extraData} />
        </div>
    );
}
