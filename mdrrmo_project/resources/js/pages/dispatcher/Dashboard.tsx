import DispatcherLayout from '@/dispatcher/layouts/DispatcherLayout';
import Dashboard from '@/dispatcher/components/Dashboard/Dashboard';

export default function DashboardPage({ stats, charts, recentIncidents, recentDispatches }) {
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
