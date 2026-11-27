import { MapPin, Navigation } from 'lucide-react';
import IncidentHistoryMap from '@/dispatcher/components/Incidents/IncidentHistoryMap';
import { usePage } from '@inertiajs/react';
import opolBarangays from '@/data/opol_barangays.json';

export default function ReportsGeographic({ incidents = [] }: { incidents?: any[] }) {
    const { props } = usePage<any>();
    const barangayGeojson = props.barangayGeojson || opolBarangays;

    const mappedIncidents = incidents.filter(
        (inc) =>
            inc.latitude ||
            inc.incident_latitude ||
            inc.longitude ||
            inc.incident_longitude
    );

    return (
        <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-6 bg-[#F61509] rounded-full shadow-[0_0_12px_rgba(246,21,9,0.4)]" />
                    <div>
                        <h2 className="text-sm font-black tracking-wider text-slate-900 dark:text-white uppercase flex items-center gap-2">
                            <span>04 Geographic Intelligence</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/25">
                                Spatial Heatmap
                            </span>
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Spatial coordinate distribution across Opol administrative boundaries and zones
                        </p>
                    </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-400">
                    <Navigation className="w-3.5 h-3.5 text-cyan-500" />
                    <span>{mappedIncidents.length} geocoded locations</span>
                </div>
            </div>

            {/* Map Card */}
            <div className="rounded-2xl overflow-hidden bg-white/90 dark:bg-[#0c1220]/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-sm print:hidden">
                <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-cyan-500" />
                            <span>Interactive Incident Spatial Map</span>
                        </h3>
                        <p className="text-[11px] text-slate-400">
                            Pan and zoom to inspect incident clusters across barangay polygons
                        </p>
                    </div>

                    <div className="text-xs font-mono font-bold text-cyan-500 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                        Opol, Misamis Oriental
                    </div>
                </div>

                <div className="p-2 bg-slate-100/60 dark:bg-slate-900/60">
                    <IncidentHistoryMap
                        incidents={incidents}
                        barangayGeojson={barangayGeojson}
                        heightClass="h-[520px]"
                    />
                </div>
            </div>
        </div>
    );
}
