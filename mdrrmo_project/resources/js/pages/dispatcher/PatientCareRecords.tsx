import DispatcherLayout from '@/dispatcher/layouts/DispatcherLayout';
import PatientCareTable from '@/dispatcher/components/PatientCareRecords/PatientCareTable';

export default function PatientCareRecordsPage({ records, pagination }) {
    return (
        <DispatcherLayout title="Patient Care Records">
            <PatientCareTable records={records ?? []} pagination={pagination} />
        </DispatcherLayout>
    );
}
