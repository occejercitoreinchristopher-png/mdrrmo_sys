import DispatcherLayout from '@/dispatcher/layouts/DispatcherLayout';
import ResponderManagement from '@/dispatcher/components/Responders/ResponderManagement';

export default function RespondersPage({ users, pagination, filters }: { users?: any[]; pagination?: any; filters?: any }) {
    return (
        <DispatcherLayout title="Responder Management">
            <ResponderManagement users={users ?? []} pagination={pagination} initialSearch={filters?.search ?? ''} />
        </DispatcherLayout>
    );
}
