import AdminLayout from '@/admin/layouts/AdminLayout';
import AmbulanceTable from '@/admin/components/Ambulances/AmbulanceTable';

export default function AmbulancesPage({ ambulances }) {
    return (
        <AdminLayout title="Ambulance Management">
            <AmbulanceTable ambulances={ambulances ?? []} />
        </AdminLayout>
    );
}
