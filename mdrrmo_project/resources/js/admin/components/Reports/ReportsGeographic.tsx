import Card from '@/shared/components/Card';
import IncidentHistoryMap from '@/dispatcher/components/Incidents/IncidentHistoryMap';
import { usePage } from '@inertiajs/react';

export default function ReportsGeographic({ incidents }) {
    const { props } = usePage<any>();
    const barangayGeojson = props.barangayGeojson ?? null;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-rose-600 rounded-full" />
                <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase">
                    04 Geographic Intelligence
                </h2>
            </div>
            
            <Card padding={false} className="print:hidden border-slate-200/60 dark:border-white/10 shadow-sm">
                <div className="p-5 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/30">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Interactive Incident Map</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Geographic distribution of incidents matching the selected filters.</p>
                </div>
                <div className="p-2 bg-slate-100 dark:bg-slate-900">
                    <IncidentHistoryMap 
                        incidents={incidents} 
                        barangayGeojson={barangayGeojson}
                        heightClass="h-[500px]" 
                    />
                </div>
            </Card>
        </div>
    );
}
