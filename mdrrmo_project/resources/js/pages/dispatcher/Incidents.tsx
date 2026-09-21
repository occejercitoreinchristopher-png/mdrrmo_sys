import DispatcherLayout from '@/dispatcher/layouts/DispatcherLayout';
import IncidentTable from '@/dispatcher/components/Incidents/IncidentTable';

export default function IncidentsPage({ 
    incidents, 
    allHistoryIncidents = [],
    pagination, 
    statusFilter, 
    incidentTypes, 
    chiefComplaints,
    pcrChiefComplaints = [],
    opolBarangays = [],
    barangayGeojson = null,
    ambulances = [],
    responders = []
}) {
    return (
        <DispatcherLayout title={statusFilter === 'history' ? "Incident Archive" : "Incoming Incidents"}>
            <IncidentTable 
                incidents={incidents ?? []} 
                allHistoryIncidents={allHistoryIncidents}
                pagination={pagination} 
                statusFilter={statusFilter} 
                incidentTypes={incidentTypes ?? []}
                chiefComplaints={chiefComplaints ?? []}
                pcrChiefComplaints={pcrChiefComplaints}
                opolBarangays={opolBarangays}
                barangayGeojson={barangayGeojson}
                ambulances={ambulances}
                responders={responders}
            />
        </DispatcherLayout>
    );
}
