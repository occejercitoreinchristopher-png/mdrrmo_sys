import DispatcherDashboardCharts from '@/dispatcher/components/Dashboard/DashboardCharts';

export default function DashboardCharts({ charts = {} }: { charts?: any }) {
    return <DispatcherDashboardCharts charts={charts} />;
}
