import DispatcherLayout from '@/dispatcher/layouts/DispatcherLayout';
import Dashboard from '@/dispatcher/components/Dashboard/Dashboard';
import { DashboardStats } from '@/dispatcher/components/Dashboard/DashboardCards';

interface DashboardPageProps {
    stats?: DashboardStats;
    charts?: any;
    recentIncidents?: any[];
    recentDispatches?: any[];
}

export default function DashboardPage({ stats, charts, recentIncidents, recentDispatches }: DashboardPageProps) {
    return (
        <DispatcherLayout title="Dashboard">
            <Dashboard
                stats={stats ?? {}}
                charts={charts ?? {}}
                recentIncidents={recentIncidents ?? []}
                recentDispatches={recentDispatches ?? []}
            />
        </DispatcherLayout>
    );
}
