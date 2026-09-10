import AdminLayout from '@/admin/layouts/AdminLayout';
import ReportsDashboard from '@/admin/components/Reports/ReportsDashboard';

export default function ReportsPage({ stats, charts, incidents }) {
    return (
        <AdminLayout title="Reports & Analytics">
            <ReportsDashboard stats={stats ?? {}} charts={charts ?? {}} incidents={incidents ?? []} />
        </AdminLayout>
    );
}
