import DispatcherLayout from '@/dispatcher/layouts/DispatcherLayout';
import ResponderManagement from '@/dispatcher/components/Responders/ResponderManagement';

export default function RespondersPage({
    users,
    pagination,
    filters,
    summary,
}: {
    users?: any[];
    pagination?: any;
    filters?: any;
    summary?: any;
}) {
    return (
        <DispatcherLayout title="Responder Roster">
            <ResponderManagement
                initialUsers={users ?? []}
                initialPagination={pagination}
                initialFilters={filters}
                initialSummary={summary}
            />
        </DispatcherLayout>
    );
}
