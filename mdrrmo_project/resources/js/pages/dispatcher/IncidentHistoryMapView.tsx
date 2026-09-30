import { useState, useMemo } from 'react';
import DispatcherLayout from '@/dispatcher/layouts/DispatcherLayout';
import IncidentHistoryMap from '@/dispatcher/components/Incidents/IncidentHistoryMap';
import PageHeader from '@/shared/components/PageHeader';
import Button from '@/shared/components/Button';
import { ArrowLeft } from 'lucide-react';
import { router } from '@inertiajs/react';
import ArchiveFilterSidebar from '@/dispatcher/components/Incidents/ArchiveFilterSidebar';
import IncidentDetails from '@/dispatcher/components/Incidents/IncidentDetails';

const DEFAULT_OPOL_BARANGAYS = [
    'Awang', 'Bagocboc', 'Barra', 'Bonbon', 'Cauyonan',
    'Igpit', 'Limonda', 'Luyongbonbon', 'Malanang',
    'Nangcaon', 'Patag', 'Poblacion', 'Taboc', 'Tingalan'
];

export default function IncidentHistoryMapView({ 
    incidents = [], 
    selectedIncidentId = null,
    opolBarangays = [],
    pcrChiefComplaints = [],
    barangayGeojson = null
}: {
    incidents?: any[];
    selectedIncidentId?: string | number | null;
    opolBarangays?: string[];
    pcrChiefComplaints?: string[];
    barangayGeojson?: any;
}) {
    const [selectedBarangays, setSelectedBarangays] = useState<string[]>([]);
    const [selectedComplaints, setSelectedComplaints] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewing, setViewing] = useState<any | null>(null);
    const [selectedIncident, setSelectedIncident] = useState<any | null>(() => {
        return selectedIncidentId ? incidents.find(i => String(i.id) === String(selectedIncidentId)) : null;
    });

    const availableBarangays = useMemo(() => {
        return opolBarangays?.length > 0 ? opolBarangays : DEFAULT_OPOL_BARANGAYS;
    }, [opolBarangays]);

    const availableComplaints = useMemo(() => {
        if (pcrChiefComplaints && pcrChiefComplaints.length > 0) return pcrChiefComplaints;
        const set = new Set<string>();
        incidents.forEach((inc) => {
            const list = inc.pcr_chief_complaints || (inc.pcr_chief_complaint ? [inc.pcr_chief_complaint] : []);
            list.forEach((c: string) => {
                if (c && c.trim()) set.add(c.trim());
            });
        });
        return Array.from(set).sort();
    }, [pcrChiefComplaints, incidents]);

    const barangayCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        incidents.forEach((inc) => {
            if ((typeof inc.barangay === 'object' ? inc.barangay?.barangay_name || inc.barangay?.name : inc.barangay)) {
                counts[(typeof inc.barangay === 'object' ? inc.barangay?.barangay_name || inc.barangay?.name : inc.barangay)] = (counts[(typeof inc.barangay === 'object' ? inc.barangay?.barangay_name || inc.barangay?.name : inc.barangay)] || 0) + 1;
            }
        });
        return counts;
    }, [incidents]);

    const complaintCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        incidents.forEach((inc) => {
            const list = inc.pcr_chief_complaints || (inc.pcr_chief_complaint ? [inc.pcr_chief_complaint] : []);
            list.forEach((c: string) => {
                counts[c] = (counts[c] || 0) + 1;
            });
        });
        return counts;
    }, [incidents]);

    const filteredIncidents = useMemo(() => {
        return incidents.filter((inc) => {
            if (selectedBarangays.length > 0) {
                const incBarangay = ((typeof inc.barangay === 'object' ? inc.barangay?.barangay_name || inc.barangay?.name : inc.barangay) || '').toLowerCase().replace(/[\s-]/g, '');
                const matches = selectedBarangays.some((b) => {
                    const normB = b.toLowerCase().replace(/[\s-]/g, '');
                    return incBarangay === normB;
                });
                if (!matches) return false;
            }

            if (selectedComplaints.length > 0) {
                const complaintsList: string[] = inc.pcr_chief_complaints || (inc.pcr_chief_complaint ? [inc.pcr_chief_complaint] : []);
                const matches = selectedComplaints.some((c) => {
                    const normC = c.toLowerCase().trim();
                    return complaintsList.some((ic) => (ic || '').toLowerCase().trim() === normC);
                });
                if (!matches) return false;
            }

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchQ =
                    String(inc.id).includes(q) ||
                    (inc.place_of_incident && inc.place_of_incident.toLowerCase().includes(q)) ||
                    (inc.location && inc.location.toLowerCase().includes(q)) ||
                    ((typeof inc.barangay === 'object' ? inc.barangay?.barangay_name || inc.barangay?.name : inc.barangay) && (typeof inc.barangay === 'object' ? inc.barangay?.barangay_name || inc.barangay?.name : inc.barangay).toLowerCase().includes(q)) ||
                    (inc.pcr_chief_complaint && inc.pcr_chief_complaint.toLowerCase().includes(q));
                if (!matchQ) return false;
            }

            return true;
        });
    }, [incidents, selectedBarangays, selectedComplaints, searchQuery]);

    const handleReset = () => {
        setSelectedBarangays([]);
        setSelectedComplaints([]);
        setSearchQuery('');
        setSelectedIncident(null);
    };

    return (
        <DispatcherLayout title="Incident History Map">
            <PageHeader
                title="Incident History Map"
                subtitle="Visual geospatial overview of historical emergency incident locations filtered by Barangay and PCR Chief Complaint."
                actions={
                    <Button
                        variant="secondary"
                        onClick={() => router.get('/dispatcher/incidents?status=history')}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Incident Archive
                    </Button>
                }
            />

            <div className="flex flex-col lg:flex-row gap-5 items-start">
                <ArchiveFilterSidebar
                    barangays={availableBarangays}
                    chiefComplaints={availableComplaints}
                    selectedBarangays={selectedBarangays}
                    setSelectedBarangays={setSelectedBarangays}
                    selectedComplaints={selectedComplaints}
                    setSelectedComplaints={setSelectedComplaints}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    barangayCounts={barangayCounts}
                    complaintCounts={complaintCounts}
                    totalFilteredCount={filteredIncidents.length}
                    totalAllCount={incidents.length}
                    onReset={handleReset}
                />

                <div className="flex-1 min-w-0 w-full">
                    <IncidentHistoryMap 
                        incidents={filteredIncidents} 
                        selectedIncident={selectedIncident} 
                        onSelectIncident={setSelectedIncident}
                        onViewDetails={(inc) => setViewing(inc)}
                        selectedBarangays={selectedBarangays}
                        barangayGeojson={barangayGeojson}
                        heightClass="h-[calc(100vh-13.5rem)] min-h-[560px]"
                    />
                </div>
            </div>

            {/* Detailed Incident Drawer */}
            <IncidentDetails
                incident={viewing}
                open={!!viewing}
                onClose={() => setViewing(null)}
            />
        </DispatcherLayout>
    );
}
