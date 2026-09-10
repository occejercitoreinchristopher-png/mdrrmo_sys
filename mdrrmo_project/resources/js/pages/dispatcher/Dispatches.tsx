import DispatcherLayout from '@/dispatcher/layouts/DispatcherLayout';
import ActiveDispatchWorkspace from '@/dispatcher/components/Dispatches/ActiveDispatchWorkspace';

export default function DispatchesPage({ dispatches, verifiedIncidents, ambulances, responders, pagination, selectedIncidentId }) {
    return (
        <DispatcherLayout title="Operations Monitoring Center">
            <ActiveDispatchWorkspace 
                dispatches={dispatches ?? []}
                verifiedIncidents={verifiedIncidents ?? []}
                ambulances={ambulances ?? []}
                responders={responders ?? []}
                pagination={pagination}
                selectedIncidentId={selectedIncidentId}
            />
        </DispatcherLayout>
    );
}
