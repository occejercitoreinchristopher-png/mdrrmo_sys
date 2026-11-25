import DashboardHeader from './DashboardHeader';
import DashboardStatCards from './DashboardCards';
import DashboardPerformanceChart from './DashboardPerformanceChart';
import DashboardPieCard from './DashboardPieCard';
import DashboardLocationCard from './DashboardLocationCard';

interface DashboardProps {
    stats?: any;
    charts?: any;
    community?: any;
    recentIncidents?: any[];
    recentDispatches?: any[];
    extraData?: any;
    initialAiSummary?: any;
    [key: string]: any;
}

export default function Dashboard({
    stats = {},
    charts = {},
    recentIncidents = [],
    recentDispatches = [],
    extraData = {},
    initialAiSummary,
}: DashboardProps) {
    return (
        <div className="space-y-6">
            {/* Top Greeting & Quick Actions Header with AI Summary Trigger & Clock */}
            <DashboardHeader initialAiSummary={initialAiSummary} />

            {/* Main Dashboard Layout (2-Column Architecture matching reference) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column (8 cols): 2x2 Stat Cards + Wide Performance Bar Chart */}
                <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                    <DashboardStatCards stats={stats} />
                    <DashboardPerformanceChart charts={charts} />
                </div>

                {/* Right Column (4 cols): Live System Operations / Activity Card + Top Locations Card */}
                <div className="lg:col-span-5 xl:col-span-4 space-y-6">
                    <DashboardPieCard
                        stats={stats}
                        charts={charts}
                        recentIncidents={recentIncidents}
                        recentDispatches={recentDispatches}
                        extraData={extraData}
                    />
                    <DashboardLocationCard charts={charts} extraData={extraData} />
                </div>
            </div>
        </div>
    );
}
