import AdminLayout from '@/admin/layouts/AdminLayout';
import BarangayTable from '@/admin/components/Barangays/BarangayTable';

export default function BarangaysPage({ barangays }) {
    return (
        <AdminLayout title="Barangay Management">
            <BarangayTable barangays={barangays ?? []} />
        </AdminLayout>
    );
}
