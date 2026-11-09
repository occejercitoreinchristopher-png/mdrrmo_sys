import AdminLayout from '@/admin/layouts/AdminLayout';
import IncidentTypeTable from '@/admin/components/IncidentTypes/IncidentTypeTable';
import { IncidentType } from '@/admin/components/IncidentTypes/IncidentTypeModal';

interface IncidentTypesPageProps {
    incidentTypes?: IncidentType[];
    pagination?: any;
    filters?: {
        search?: string;
    };
}

export default function IncidentTypesPage({
    incidentTypes = [],
    pagination = null,
    filters = {},
}: IncidentTypesPageProps) {
    return (
        <AdminLayout title="Emergency Incident Types">
            <IncidentTypeTable
                incidentTypes={incidentTypes}
                pagination={pagination}
                filters={filters}
            />
        </AdminLayout>
    );
}

