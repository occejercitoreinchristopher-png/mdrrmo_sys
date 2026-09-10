import DispatcherLayout from '@/dispatcher/layouts/DispatcherLayout';
import IncidentHistoryMap from '@/dispatcher/components/Incidents/IncidentHistoryMap';
import PageHeader from '@/shared/components/PageHeader';
import Card from '@/shared/components/Card';

export default function IncidentHistoryMapView({ incidents, selectedIncidentId }) {
    const selectedIncident = selectedIncidentId 
        ? incidents?.find(i => String(i.id) === String(selectedIncidentId))
        : null;

    return (
        <DispatcherLayout title="Incident History Map">
            <PageHeader
                title="Incident History Map"
                subtitle="Visual overview of all historical emergency incident locations."
            />
            <Card padding={false} className="border-none shadow-none bg-transparent">
                <IncidentHistoryMap incidents={incidents ?? []} selectedIncident={selectedIncident} />
            </Card>
        </DispatcherLayout>
    );
}
