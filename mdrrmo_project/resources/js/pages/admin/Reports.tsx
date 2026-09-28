import AdminLayout from '@/admin/layouts/AdminLayout';
import ReportsDashboard from '@/admin/components/Reports/ReportsDashboard';

export default function ReportsPage({ stats, incidents, lookups, filters }) {
    return (
        <AdminLayout title="Reports & Analytics">
            <ReportsDashboard 
                stats={stats ?? {}} 
                incidents={incidents ?? []} 
                lookups={lookups ?? {}} 
                initialFilters={filters ?? {}} 
            />
        </AdminLayout>
    );
}
