import { useEffect } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '@/admin/layouts/AdminLayout';
import Dashboard from '@/admin/components/Dashboard/Dashboard';

export default function DashboardPage({
    stats,
    charts,
    community,
    recentIncidents,
    recentDispatches,
    extraData,
    aiSummary,
}: any) {
    // Auto-refresh dashboard data every 12s so admin never has to press Ctrl+R
    useEffect(() => {
        const interval = setInterval(() => {
            if (typeof document !== 'undefined' && !document.hidden) {
                router.reload({ preserveScroll: true, preserveState: true });
            }
        }, 12000);
        return () => clearInterval(interval);
    }, []);

    return (
        <AdminLayout title="Dashboard">
            <Dashboard
                stats={stats ?? {}}
                charts={charts ?? {}}
                community={community ?? {}}
                recentIncidents={recentIncidents ?? []}
                recentDispatches={recentDispatches ?? []}
                extraData={extraData ?? {}}
                initialAiSummary={aiSummary}
            />
        </AdminLayout>
    );
}
