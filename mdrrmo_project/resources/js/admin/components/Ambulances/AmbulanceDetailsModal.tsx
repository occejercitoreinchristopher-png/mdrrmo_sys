import Modal from '@/shared/components/Modal';
import Button from '@/shared/components/Button';
import AmbulanceStatusBadge from './AmbulanceStatusBadge';
import {
    Ambulance as AmbulanceIcon,
    Building2,
    Shield,
    Wrench,
    CheckCircle2,
    Pencil,
    Radio,
    HeartPulse,
    Activity,
    Truck,
} from 'lucide-react';
import { toPascalCase } from '@/shared/utils/utils';

interface AmbulanceDetailsModalProps {
    ambulance: any | null;
    open: boolean;
    onClose: () => void;
    onEdit?: (ambulance: any) => void;
    onQuickStatus?: (ambulance: any, newStatus: string) => void;
}

export default function AmbulanceDetailsModal({
    ambulance,
    open,
    onClose,
    onEdit,
    onQuickStatus,
}: AmbulanceDetailsModalProps) {
    if (!ambulance) return null;

    const isStation =
        ambulance.ambulance_code?.toUpperCase().includes('STATION') ||
        ambulance.ambulance_code?.toUpperCase().includes('WALK-IN') ||
        ambulance.vehicle_type?.toLowerCase().includes('station');

    return (
        <Modal
            open={open}
            onClose={onClose}
            size="lg"
            title="Vehicle Dossier & Fleet Readiness"
            footer={
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Quick Status:</span>
                        <button
                            type="button"
                            onClick={() => {
                                onQuickStatus?.(ambulance, 'available');
                                onClose();
                            }}
                            disabled={ambulance.status === 'available'}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                ambulance.status === 'available'
                                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                    : 'bg-slate-100 dark:bg-white/10 hover:bg-emerald-500/15 hover:text-emerald-600 text-slate-700 dark:text-slate-300'
                            }`}
                        >
                            Set Available
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                onQuickStatus?.(ambulance, 'maintenance');
                                onClose();
                            }}
                            disabled={ambulance.status === 'maintenance'}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                ambulance.status === 'maintenance'
                                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                    : 'bg-slate-100 dark:bg-white/10 hover:bg-amber-500/15 hover:text-amber-600 text-slate-700 dark:text-slate-300'
                            }`}
                        >
                            Set Maintenance
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        {onEdit && (
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    onClose();
                                    onEdit(ambulance);
                                }}
                                className="cursor-pointer text-xs"
                            >
                                <Pencil className="w-3.5 h-3.5 mr-1" />
                                Edit Unit
                            </Button>
                        )}
                        <Button variant="ghost" onClick={onClose} className="cursor-pointer text-xs">
                            Close
                        </Button>
                    </div>
                </div>
            }
        >
            <div className="space-y-5">
                {/* Hero Header */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-md border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                            {isStation ? (
                                <Building2 className="w-6 h-6 text-teal-400" />
                            ) : (
                                <AmbulanceIcon className="w-6 h-6 text-rose-400" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-base font-black tracking-wider text-white">
                                    {ambulance.ambulance_code}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-950 text-white border border-slate-700">
                                    {ambulance.plate_number}
                                </span>
                            </div>
                            <h2 className="text-sm font-semibold text-slate-200 mt-0.5">
                                {toPascalCase(ambulance.vehicle_name)}
                            </h2>
                        </div>
                    </div>

                    <div className="self-start sm:self-auto">
                        <AmbulanceStatusBadge status={ambulance.status} size="lg" />
                    </div>
                </div>

                {/* Technical Specifications Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1">
                        <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
                            Unit Category
                        </span>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">
                            {toPascalCase(ambulance.vehicle_type) || 'Emergency Medical Vehicle'}
                        </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1">
                        <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
                            License Plate / Identifier
                        </span>
                        <p className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                            {ambulance.plate_number || 'N/A'}
                        </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1">
                        <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
                            Vehicle Model & Make
                        </span>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">
                            {toPascalCase(ambulance.vehicle_name) || 'Not specified'}
                        </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1">
                        <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
                            Operational Role
                        </span>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">
                            {isStation ? 'On-Site Triage & Walk-In Clinic' : 'Emergency Field Ambulance'}
                        </p>
                    </div>
                </div>

                {/* Standard Medical Readiness Checklist */}
                {!isStation && (
                    <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <HeartPulse className="w-4 h-4 text-rose-500" />
                                Standard Medical Equipment & Readiness
                            </h4>
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                Verified
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span>Main Wheeled Stretcher & Cot</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span>Fixed & Portable O2 Oxygen Supply</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span>Automated External Defibrillator (AED)</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span>Trauma & Splinting Medical Pack</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span>MDRRMO 2-Way VHF Radio & Siren</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span>Cervical Collars & Spine Board</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
