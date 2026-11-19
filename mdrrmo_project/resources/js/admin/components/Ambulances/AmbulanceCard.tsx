import AmbulanceStatusBadge from './AmbulanceStatusBadge';
import {
    Ambulance as AmbulanceIcon,
    Building2,
    Pencil,
    Trash2,
    Eye,
} from 'lucide-react';
import { toPascalCase } from '@/shared/utils/utils';

export default function AmbulanceCard({
    ambulance,
    onEdit,
    onDelete,
    onView,
    onQuickStatus,
}: {
    ambulance: any;
    onEdit?: (ambulance: any) => void;
    onDelete?: (ambulance: any) => void;
    onView?: (ambulance: any) => void;
    onQuickStatus?: (ambulance: any, newStatus: string) => void;
}) {
    const isStation =
        ambulance.ambulance_code?.toUpperCase().includes('STATION') ||
        ambulance.ambulance_code?.toUpperCase().includes('WALK-IN') ||
        ambulance.vehicle_type?.toLowerCase().includes('station');

    return (
        <div className="relative group p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-xl hover:border-primary/40 dark:hover:border-primary/50 transition-all duration-300 flex flex-col justify-between gap-4">
            {/* Top Bar: Code Badge, Plate, Status */}
            <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        {isStation ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-black uppercase tracking-wider bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                                <Building2 className="w-3.5 h-3.5" />
                                {ambulance.ambulance_code}
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-black uppercase tracking-wider bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white border border-slate-200 dark:border-white/15">
                                <AmbulanceIcon className="w-3.5 h-3.5 text-rose-500" />
                                {ambulance.ambulance_code}
                            </span>
                        )}

                        {/* Plate Pill */}
                        <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-slate-950 text-white border border-slate-700 tracking-wider">
                            {ambulance.plate_number}
                        </span>
                    </div>

                    <AmbulanceStatusBadge status={ambulance.status} size="sm" />
                </div>

                {/* Vehicle Model & Category */}
                <div className="space-y-1">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                        {toPascalCase(ambulance.vehicle_name) || 'Unnamed Unit'}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                            {toPascalCase(ambulance.vehicle_type) || 'Emergency Fleet'}
                        </span>
                        {isStation && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                                Base Clinic
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Status Bar */}
            <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-2.5">
                <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Quick Status:</span>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => onQuickStatus?.(ambulance, 'available')}
                            disabled={ambulance.status === 'available'}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                ambulance.status === 'available'
                                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                    : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10'
                            }`}
                        >
                            Ready
                        </button>
                        <button
                            type="button"
                            onClick={() => onQuickStatus?.(ambulance, 'maintenance')}
                            disabled={ambulance.status === 'maintenance'}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                ambulance.status === 'maintenance'
                                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                    : 'text-slate-400 hover:text-amber-500 hover:bg-amber-500/10'
                            }`}
                        >
                            Service
                        </button>
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-end gap-1.5">
                    {onView && (
                        <button
                            type="button"
                            onClick={() => onView(ambulance)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                            title="View vehicle specifications"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                    )}
                    {onEdit && (
                        <button
                            type="button"
                            onClick={() => onEdit(ambulance)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-800 dark:text-white transition-all cursor-pointer"
                        >
                            <Pencil className="w-3 h-3" />
                            <span>Edit</span>
                        </button>
                    )}
                    {onDelete && !isStation && (
                        <button
                            type="button"
                            onClick={() => onDelete(ambulance)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Decommission ambulance"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
