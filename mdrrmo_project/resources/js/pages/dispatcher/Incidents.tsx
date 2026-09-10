import DispatcherLayout from '@/dispatcher/layouts/DispatcherLayout';
import IncidentTable from '@/dispatcher/components/Incidents/IncidentTable';

export default function IncidentsPage({ 
    incidents, 
    pagination, 
    statusFilter, 
    incidentTypes, 
    chiefComplaints,
    ambulances = [],
    responders = []
}) {
    return (
        <DispatcherLayout title={statusFilter === 'history' ? "Incident History" : "Incoming Incidents"}>
            <IncidentTable 
                incidents={incidents ?? []} 
                pagination={pagination} 
                statusFilter={statusFilter} 
                incidentTypes={incidentTypes ?? []}
                chiefComplaints={chiefComplaints ?? []}
                ambulances={ambulances}
                responders={responders}
            />
        </DispatcherLayout>
    );
}
