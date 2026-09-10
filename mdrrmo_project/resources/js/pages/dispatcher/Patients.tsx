import DispatcherLayout from '@/dispatcher/layouts/DispatcherLayout';
import PatientTable from '@/dispatcher/components/Patients/PatientTable';

export default function PatientsPage({ patients, pagination }) {
    return (
        <DispatcherLayout title="Patient Management">
            <PatientTable patients={patients ?? []} pagination={pagination} />
        </DispatcherLayout>
    );
}
