import { useState, useEffect } from 'react';
import Input from '@/shared/components/Input';
import Button from '@/shared/components/Button';
import AmbulanceStatusBadge from './AmbulanceStatusBadge';
import {
    Ambulance as AmbulanceIcon,
    Shield,
    CheckCircle2,
    Truck,
    Wrench,
    Tag,
    Hash,
    Car,
    Sparkles,
    Building2,
    RotateCcw,
} from 'lucide-react';
import { toPascalCase } from '@/shared/utils/utils';
import { clsx } from 'clsx';

export interface Ambulance {
    id?: number | string;
    ambulance_code?: string;
    plate_number?: string;
    vehicle_name?: string;
    vehicle_type?: string;
    status?: string;
    [key: string]: any;
}

interface AmbulanceFormProps {
    ambulance?: Ambulance | null;
    defaultCode?: string;
    onSubmit?: (form: any) => void;
    onCancel?: () => void;
    loading?: boolean;
    errors?: Record<string, string>;
}

const CATEGORY_PRESETS = [
    { id: 'Type 1 Ambulance', label: 'Type 1 (BLS)', badge: 'Basic Life Support' },
    { id: 'Advanced Life Support', label: 'ALS Rescue', badge: 'Advanced Life Support' },
    { id: 'Patient Transport', label: 'Transport', badge: 'Non-Emergency' },
    { id: 'Rapid Response Unit', label: 'Rapid Response', badge: 'First Responder' },
    { id: 'Station', label: 'Base Clinic', badge: 'Walk-In Facility' },
];

export default function AmbulanceForm({
    ambulance = null,
    defaultCode = 'AMB-01',
    onSubmit,
    onCancel,
    loading = false,
    errors = {},
}: AmbulanceFormProps) {
    const [isAutoCode, setIsAutoCode] = useState(!ambulance);
    const [form, setForm] = useState({
        ambulance_code: ambulance?.ambulance_code ?? defaultCode,
        plate_number: ambulance?.plate_number ?? '',
        vehicle_name: ambulance?.vehicle_name ?? '',
        vehicle_type: ambulance?.vehicle_type ?? 'Type 1 Ambulance',
        status: ambulance?.status ?? 'available',
    });

    // Sync form whenever ambulance or defaultCode changes
    useEffect(() => {
        if (ambulance) {
            setForm({
                ambulance_code: ambulance.ambulance_code ?? '',
                plate_number: ambulance.plate_number ?? '',
                vehicle_name: ambulance.vehicle_name ?? '',
                vehicle_type: ambulance.vehicle_type ?? 'Type 1 Ambulance',
                status: ambulance.status ?? 'available',
            });
            setIsAutoCode(false);
        } else {
            setForm({
                ambulance_code: defaultCode || 'AMB-01',
                plate_number: '',
                vehicle_name: '',
                vehicle_type: 'Type 1 Ambulance',
                status: 'available',
            });
            setIsAutoCode(true);
        }
    }, [ambulance, defaultCode]);

    const set = (field: string) => (e: any) => {
        let val = e?.target ? e.target.value : e;
        if (field === 'ambulance_code' || field === 'plate_number') {
            val = val.toUpperCase();
        }
        setForm((f) => ({ ...f, [field]: val }));
    };

    const isStation =
        form.ambulance_code?.toUpperCase().includes('STATION') ||
        form.ambulance_code?.toUpperCase().includes('WALK-IN') ||
        form.vehicle_type?.toLowerCase().includes('station');

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit?.(form);
            }}
            className="space-y-5"
        >
            {/* LIVE VEHICLE CARD PREVIEW */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-md border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                        Live Fleet Badge Preview
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                        {form.status.toUpperCase()}
                    </span>
                </div>

                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                            {isStation ? (
                                <Building2 className="w-5 h-5 text-teal-400" />
                            ) : (
                                <AmbulanceIcon className="w-5 h-5 text-rose-400" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-base font-black tracking-wider text-white">
                                    {form.ambulance_code.trim() || 'AMB-??'}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-950 text-white border border-slate-700">
                                    {form.plate_number.trim() || 'NO-PLATE'}
                                </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-200 mt-0.5">
                                {form.vehicle_name.trim() || 'Vehicle Model & Callsign'}
                            </p>
                        </div>
                    </div>

                    <AmbulanceStatusBadge status={form.status} size="sm" />
                </div>
            </div>

            {/* SECTION 1: Vehicle Identification */}
            <div className="space-y-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-200/60 dark:border-white/10">
                    <Tag className="w-4 h-4 text-rose-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Unit Identification
                    </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                                Ambulance Code <span className="text-rose-500">*</span>
                            </label>
                            {!ambulance && (
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" /> Auto
                                </span>
                            )}
                        </div>
                        <div className="relative">
                            <Hash className="w-4 h-4 text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                value={form.ambulance_code}
                                onChange={set('ambulance_code')}
                                required
                                readOnly={!ambulance && isAutoCode}
                                placeholder="e.g. AMB-01"
                                className={clsx(
                                    "w-full pl-9.5 pr-20 py-2.5 border rounded-xl text-xs sm:text-sm font-mono font-black text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-xs transition-colors",
                                    !ambulance && isAutoCode
                                        ? "bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/40 text-emerald-900 dark:text-emerald-200 cursor-not-allowed"
                                        : "bg-white dark:bg-slate-800 border-slate-300 dark:border-white/10"
                                )}
                            />
                            {!ambulance && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!isAutoCode) {
                                            setForm((f) => ({ ...f, ambulance_code: defaultCode }));
                                        }
                                        setIsAutoCode(!isAutoCode);
                                    }}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-200/80 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-white/10 transition-colors cursor-pointer"
                                    title={isAutoCode ? "Click to manually customize callsign" : "Reset to auto-generated callsign"}
                                >
                                    {isAutoCode ? 'Custom' : 'Auto'}
                                </button>
                            )}
                        </div>
                        {errors.ambulance_code && (
                            <p className="text-xs text-rose-500 mt-1">{errors.ambulance_code}</p>
                        )}
                        <p className="text-[11px] text-slate-400">
                            {!ambulance && isAutoCode
                                ? 'Auto-generated next sequential ID. No manual input needed.'
                                : 'Official radio callsign or unit ID.'}
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                            Plate Number <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <Car className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                value={form.plate_number}
                                onChange={set('plate_number')}
                                required
                                placeholder="e.g. SAB-101"
                                className="w-full pl-9.5 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-white/10 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-xs"
                            />
                        </div>
                        {errors.plate_number && (
                            <p className="text-xs text-rose-500 mt-1">{errors.plate_number}</p>
                        )}
                        <p className="text-[11px] text-slate-400">Official registered LTO plate</p>
                    </div>
                </div>
            </div>

            {/* SECTION 2: Vehicle Model & Category */}
            <div className="space-y-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-200/60 dark:border-white/10">
                    <AmbulanceIcon className="w-4 h-4 text-emerald-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Model & Category
                    </h4>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                        Vehicle Model & Callsign <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={form.vehicle_name}
                        onChange={set('vehicle_name')}
                        required
                        placeholder="e.g. Toyota Hiace (Alpha 1)"
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-white/10 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-xs"
                    />
                    {errors.vehicle_name && (
                        <p className="text-xs text-rose-500 mt-1">{errors.vehicle_name}</p>
                    )}
                    <p className="text-[11px] text-slate-400">Vehicle make, model, or squad nickname</p>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                        Fleet Category <span className="text-rose-500">*</span>
                    </label>

                    {/* Presets Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {CATEGORY_PRESETS.map((cat) => {
                            const isSelected = form.vehicle_type === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setForm((f) => ({ ...f, vehicle_type: cat.id }))}
                                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                                        isSelected
                                            ? 'bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300 font-bold shadow-xs ring-1 ring-rose-500/30'
                                            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <span className="text-xs font-bold">{cat.label}</span>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">
                                        {cat.badge}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <input
                        type="text"
                        value={form.vehicle_type}
                        onChange={set('vehicle_type')}
                        placeholder="Or type custom category name..."
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-xs"
                    />
                    {errors.vehicle_type && (
                        <p className="text-xs text-rose-500 mt-1">{errors.vehicle_type}</p>
                    )}
                </div>
            </div>

            {/* SECTION 3: Deployment Status (Only shown when editing an existing ambulance) */}
            {ambulance && (
                <div className="space-y-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10">
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-200/60 dark:border-white/10">
                        <Shield className="w-4 h-4 text-blue-500" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                            Operational Status
                        </h4>
                    </div>

                    {ambulance.status === 'dispatched' ? (
                        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-800 dark:text-blue-300 text-xs flex items-center gap-2.5">
                            <Truck className="w-4 h-4 animate-pulse shrink-0" />
                            <span>
                                <strong>Active Dispatch:</strong> This vehicle is currently assigned to an active emergency run. Status will automatically update when the dispatch completes.
                            </span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {[
                                {
                                    id: 'available',
                                    label: 'Available',
                                    desc: 'Ready for emergency dispatch',
                                    icon: CheckCircle2,
                                    activeColor:
                                        'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500/30',
                                },
                                {
                                    id: 'maintenance',
                                    label: 'Maintenance',
                                    desc: 'In service bay / inspection',
                                    icon: Wrench,
                                    activeColor:
                                        'border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-300 ring-1 ring-amber-500/30',
                                },
                            ].map((opt) => {
                                const Icon = opt.icon;
                                const isSelected = form.status === opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setForm((f) => ({ ...f, status: opt.id }))}
                                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                                            isSelected
                                                ? `${opt.activeColor} shadow-xs font-bold`
                                                : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <Icon className="w-4 h-4" />
                                            {isSelected && (
                                                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold">{opt.label}</p>
                                            <p className="text-[10px] opacity-80">{opt.desc}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    {errors.status && (
                        <p className="text-xs text-rose-500 mt-1">{errors.status}</p>
                    )}
                </div>
            )}

            {/* STICKY FOOTER ACTIONS */}
            <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-200/80 dark:border-white/10">
                {onCancel && (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onCancel}
                        className="cursor-pointer text-xs"
                    >
                        Cancel
                    </Button>
                )}
                <Button
                    type="submit"
                    loading={loading}
                    variant="primary"
                    className="min-w-[160px] cursor-pointer text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-md shadow-red-600/30"
                >
                    {ambulance ? 'Save Changes' : 'Register Ambulance'}
                </Button>
            </div>
        </form>
    );
}
