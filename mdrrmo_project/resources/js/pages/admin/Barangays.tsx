import AdminLayout from '@/admin/layouts/AdminLayout';
import BarangayTable from '@/admin/components/Barangays/BarangayTable';

interface BarangaysPageProps {
    barangays: any[];
}

export default function BarangaysPage({ barangays = [] }: BarangaysPageProps) {
    return (
        <AdminLayout title="Barangay Management">
            <BarangayTable barangays={barangays} />
        </AdminLayout>
    );
}
