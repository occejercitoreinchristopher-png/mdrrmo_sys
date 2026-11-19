import AdminLayout from '@/admin/layouts/AdminLayout';
import Dashboard from '@/admin/components/Dashboard/Dashboard';

export default function DashboardPage({
    stats,
    charts,
    community,
    recentIncidents,
    recentDispatches,
    extraData,
}: any) {
    return (
        <AdminLayout title="Dashboard">
            <Dashboard
                stats={stats ?? {}}
                charts={charts ?? {}}
                community={community ?? {}}
                recentIncidents={recentIncidents ?? []}
                recentDispatches={recentDispatches ?? []}
                extraData={extraData ?? {}}
            />
        </AdminLayout>
    );
}
