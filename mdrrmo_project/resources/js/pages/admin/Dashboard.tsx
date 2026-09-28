import AdminLayout from '@/admin/layouts/AdminLayout';
import Dashboard from '@/admin/components/Dashboard/Dashboard';

export default function DashboardPage({ stats, charts, recentIncidents, recentDispatches, extraData }) {
    return (
        <AdminLayout title="Dashboard">
            <Dashboard
                stats={stats ?? {}}
                charts={charts ?? {}}
                recentIncidents={recentIncidents ?? []}
                recentDispatches={recentDispatches ?? []}
                extraData={extraData ?? {}}
            />
        </AdminLayout>
    );
}
