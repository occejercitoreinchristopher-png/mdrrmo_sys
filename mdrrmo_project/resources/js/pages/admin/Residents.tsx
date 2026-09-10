import AdminLayout from '@/admin/layouts/AdminLayout';
import ResidentManagement from '@/admin/components/Residents/ResidentManagement';

export default function ResidentsPage({ users, pagination }) {
    return (
        <AdminLayout title="Resident Management">
            <ResidentManagement users={users ?? []} pagination={pagination} />
        </AdminLayout>
    );
}
