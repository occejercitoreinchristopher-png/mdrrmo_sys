import AdminLayout from '@/admin/layouts/AdminLayout';
import DispatcherLayout from '@/dispatcher/layouts/DispatcherLayout';
import ReportsDashboard from '@/admin/components/Reports/ReportsDashboard';
import { usePage } from '@inertiajs/react';

export default function ReportsPage({ stats, incidents, lookups, filters, monthlyReportData }: any) {
    const { auth } = usePage<any>().props;
    const isDispatcher = auth?.user?.role === 'dispatcher';
    const Layout = isDispatcher ? DispatcherLayout : AdminLayout;

    return (
        <Layout title="Reports & Analytics">
            <ReportsDashboard 
                stats={stats ?? {}} 
                incidents={incidents ?? []} 
                lookups={lookups ?? {}} 
                initialFilters={filters ?? {}} 
                initialMonthlyReport={monthlyReportData ?? null}
            />
        </Layout>
    );
}
