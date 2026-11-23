import DispatcherLayout from '@/dispatcher/layouts/DispatcherLayout';
import PatientTable from '@/dispatcher/components/Patients/PatientTable';

interface PatientsPageProps {
    patients?: any[];
    pagination?: any;
    filters?: any;
    summary?: {
        total: number;
        identified: number;
        unidentified: number;
        pcr_records: number;
    };
}

export default function PatientsPage({ patients, pagination, filters, summary }: PatientsPageProps) {
    return (
        <DispatcherLayout title="Patient Management">
            <PatientTable
                patients={patients ?? []}
                pagination={pagination}
                filters={filters}
                summary={summary}
            />
        </DispatcherLayout>
    );
}
